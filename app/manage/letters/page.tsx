"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { ConfirmOverlay } from "@/components/ui/Overlay";
import { archiveLetter as archiveLetterAction, listLetters, toggleLetterRead } from "@/app/actions/panel";
import type { Letter } from "@/lib/types";
import { Archive, RotateCcw, Printer, ArrowUpDown } from "lucide-react";

function LetterCard({
  letter,
  onToggleRead,
  onArchive,
  onPrint,
}: {
  letter: Letter;
  onToggleRead: () => void;
  onArchive: () => void;
  onPrint: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-all cursor-pointer"
      style={{
        background: letter.read ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
        boxShadow: "var(--shadow-ambient)",
        border: letter.read ? "1px solid transparent" : "1px solid rgba(204,198,188,0.3)",
      }}
      onClick={() => { setExpanded(!expanded); if (!letter.read) onToggleRead(); }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              className="font-medium text-sm"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
            >
              {letter.anonymous ? "Anonymous" : letter.guest_name}
            </p>
            {!letter.read && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                style={{ background: "var(--secondary-container)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}
              >
                New
              </span>
            )}
          </div>
          <p
            className="text-xs"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
          >
            {new Date(letter.created_at).toLocaleString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleRead}
            title={letter.read ? "Mark unread" : "Mark read"}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <RotateCcw size={13} strokeWidth={1} />
          </button>
          <button
            onClick={onPrint}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <Printer size={13} strokeWidth={1} />
          </button>
          <button
            onClick={onArchive}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--secondary-container)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <Archive size={13} strokeWidth={1} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div
          className="mt-4 text-sm leading-relaxed"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", lineHeight: "1.8" }}
        >
          {letter.body}
        </div>
      ) : (
        <p
          className="mt-2 text-sm line-clamp-2"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface-variant)", lineHeight: "1.7" }}
        >
          {letter.body}
        </p>
      )}
    </div>
  );
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");
  const [sortAsc, setSortAsc] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await listLetters();
    setLetters(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const visible = letters
    .filter((l) => (tab === "inbox" ? !l.archived : l.archived))
    .sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? d : -d;
    });

  const unreadCount = letters.filter((l) => !l.read && !l.archived).length;

  async function toggleRead(id: string) {
    const letter = letters.find((l) => l.id === id);
    if (!letter) return;
    await toggleLetterRead(id, !letter.read);
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, read: !l.read } : l)));
  }

  async function archiveLetter(id: string) {
    await archiveLetterAction(id);
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, archived: true } : l)));
    setArchiveTarget(null);
  }

  function printLetter(letter: Letter) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Letter from ${letter.anonymous ? "Anonymous" : letter.guest_name}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 600px; margin: 80px auto; color: #1a1c1a; line-height: 1.8; }
            .meta { font-family: system-ui, sans-serif; font-size: 12px; color: #726b64; margin-bottom: 40px; }
            .body { font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="meta">
            <strong>${letter.anonymous ? "Anonymous" : letter.guest_name}</strong><br/>
            ${new Date(letter.created_at).toLocaleDateString("en-GB", { dateStyle: "long" })}
          </div>
          <div class="body">${letter.body.replace(/\n/g, "<br/>")}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  function printAll() {
    const inboxLetters = letters.filter((l) => !l.archived);
    const win = window.open("", "_blank");
    if (!win) return;
    const pages = inboxLetters.map((l) => `
      <div style="page-break-after: always; padding: 80px;">
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #726b64; margin-bottom: 40px;">
          <strong>${l.anonymous ? "Anonymous" : l.guest_name}</strong><br/>
          ${new Date(l.created_at).toLocaleDateString("en-GB", { dateStyle: "long" })}
        </div>
        <div style="font-family: Georgia, serif; font-size: 16px; line-height: 1.8;">${l.body.replace(/\n/g, "<br/>")}</div>
      </div>
    `).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>All Letters</title></head><body>${pages}</body></html>`);
    win.document.close();
    win.print();
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>Loading letters…</div>;

  return (
    <div>
      <ModuleHeader
        title="Letters Inbox"
        subtitle="Private messages from your guests."
        actions={
          <button
            onClick={printAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container)]"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
          >
            <Printer size={14} strokeWidth={1} /> Print all
          </button>
        }
      />

      {/* Tabs + controls */}
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--surface-container-low)" }}
        >
          {(["inbox", "archived"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                fontFamily: "var(--font-work-sans)",
                background: tab === t ? "var(--surface-container-lowest)" : "transparent",
                color: tab === t ? "var(--on-surface)" : "var(--on-surface-variant)",
                boxShadow: tab === t ? "var(--shadow-ambient)" : "none",
              }}
            >
              {t === "inbox" ? `Inbox${unreadCount > 0 ? ` (${unreadCount} new)` : ""}` : "Archived"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[var(--surface-container)]"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          <ArrowUpDown size={12} strokeWidth={1} />
          {sortAsc ? "Oldest first" : "Newest first"}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>
            {tab === "inbox" ? "No letters yet" : "Nothing archived"}
          </p>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {tab === "inbox" ? "Letters from guests will appear here." : "Archived letters will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onToggleRead={() => toggleRead(letter.id)}
              onArchive={() => setArchiveTarget(letter.id)}
              onPrint={() => printLetter(letter)}
            />
          ))}
        </div>
      )}

      {archiveTarget && (
        <ConfirmOverlay
          title="Archive Letter"
          message="This letter will be moved to your archive. You can still access it from the Archived tab."
          confirmLabel="Archive"
          onConfirm={() => archiveLetter(archiveTarget)}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
    </div>
  );
}
