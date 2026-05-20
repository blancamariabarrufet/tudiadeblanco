"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { archiveLetter as archiveLetterAction, listLetters, toggleLetterRead } from "@/app/actions/panel";
import type { Letter } from "@/lib/types";
import { Archive, Printer, ArrowUpDown, Mail, X } from "lucide-react";

function LetterOverlay({
  letter,
  onClose,
  onPrint,
}: {
  letter: Letter;
  onClose: () => void;
  onPrint: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Trigger the enter animation shortly after mount
    const t = setTimeout(() => setOpen(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 600); // Wait for exit animation
  };

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto flex items-center justify-center p-4 sm:p-6" style={{ perspective: "1200px" }}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "rgba(250, 249, 246, 0.86)", backdropFilter: "blur(18px)" }}
        onClick={handleClose}
      />

      {/* Letter Container */}
      <div
        className={`relative z-10 w-full max-w-xl transition-all duration-700 origin-bottom ${
          open ? "opacity-100 translate-y-0 rotate-x-0 scale-100" : "opacity-0 translate-y-16 rotate-x-12 scale-95"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Envelope Top Flap (animates open) */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 origin-top transition-all duration-700 ease-out ${
            open ? "-rotate-x-180 opacity-0" : "rotate-x-0 opacity-100"
          }`}
          style={{ 
            background: "var(--surface-container-low)",
            clipPath: "polygon(0 0, 50% 100%, 100% 0)",
            zIndex: 20,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        />

        {/* Paper Letter */}
        <div
          className={`relative bg-[#fcfbf9] rounded-sm p-8 sm:p-12 transition-all duration-1000 delay-100 ${
            open ? "mt-0 shadow-2xl" : "mt-24 shadow-none"
          }`}
          style={{
            fontFamily: "var(--font-newsreader)",
            color: "var(--on-surface)",
            backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(204,198,188,0.2) 95%)",
            backgroundSize: "100% 2.2rem",
            lineHeight: "2.2rem",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 transition-colors rounded-full hover:bg-[rgba(26,28,26,0.05)]"
            style={{ color: "var(--on-surface-variant)" }}
            title="Close & Archive"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          <h2 className="text-2xl italic mb-6">
            Dear {letter.anonymous ? "Anonymous" : letter.guest_name},
          </h2>
          
          <div className="text-[1.1rem] whitespace-pre-wrap">{letter.body}</div>

          <div
            className="mt-16 flex justify-between items-center text-xs font-medium uppercase tracking-widest border-t pt-6"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)", borderColor: "var(--outline-variant)" }}
          >
            <button
              onClick={onPrint}
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
            >
              <Printer size={15} strokeWidth={1.5} /> Print
            </button>
            <p>{new Date(letter.created_at).toLocaleDateString("en-GB", { dateStyle: "long" })}</p>
          </div>
        </div>

        {/* Envelope Bottom Pocket (always in front during initial state) */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[80%] rounded-b-xl transition-opacity duration-500 ${
            open ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ 
            background: "var(--surface-container-low)",
            clipPath: "polygon(0 100%, 100% 100%, 100% 0, 50% 40%, 0 0)",
            zIndex: 30,
            boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.05)"
          }}
        />
      </div>
    </div>
  );
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeLetter, setActiveLetter] = useState<Letter | null>(null);

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

  async function handleOpenLetter(letter: Letter) {
    if (!letter.read) {
      await toggleLetterRead(letter.id, true);
      setLetters((prev) => prev.map((l) => (l.id === letter.id ? { ...l, read: true } : l)));
    }
    setActiveLetter(letter);
  }

  async function handleCloseLetter() {
    if (activeLetter) {
      // Auto-archive if closing an inbox letter
      if (!activeLetter.archived) {
        await archiveLetterAction(activeLetter.id);
        setLetters((prev) => prev.map((l) => (l.id === activeLetter.id ? { ...l, archived: true } : l)));
      }
      setActiveLetter(null);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--surface-container-low)" }}
        >
          {(["inbox", "archived"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
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
        <div className="text-center py-20">
          <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem", fontWeight: "bold" }}>
            {tab === "inbox" ? "No letters yet" : "Nothing archived"}
          </p>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {tab === "inbox" ? "Letters from guests will appear here." : "Archived letters will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {visible.map((letter) => (
            <button
              key={letter.id}
              onClick={() => handleOpenLetter(letter)}
              className="flex flex-col items-center group gap-3 w-full"
            >
              <div 
                className="relative w-full aspect-[4/3] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-2" 
                style={{ 
                  background: letter.read ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                  border: letter.read ? "1px solid var(--outline-variant)" : "1px solid transparent",
                  boxShadow: "var(--shadow-ambient)"
                }}
              >
                <Mail 
                  size={36} 
                  strokeWidth={1} 
                  style={{ color: "var(--primary)", opacity: letter.read ? 0.4 : 1 }} 
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* Green dot for new */}
                {!letter.read && (
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white" style={{ background: "#28c840" }} />
                )}
                
                {/* Visual Envelope Flap line */}
                <div 
                  className="absolute inset-0 pointer-events-none border-t border-[var(--outline-variant)] opacity-20 rounded-xl" 
                  style={{ clipPath: "polygon(0 0, 50% 50%, 100% 0)" }} 
                />
              </div>
              
              <div className="text-center px-1 w-full">
                <p className="text-sm font-bold truncate w-full" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                  {letter.anonymous ? "Anonymous" : letter.guest_name}
                </p>
                <p className="text-[0.65rem] font-medium uppercase tracking-widest mt-1 opacity-70" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                  {new Date(letter.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeLetter && (
        <LetterOverlay
          letter={activeLetter}
          onClose={handleCloseLetter}
          onPrint={() => printLetter(activeLetter)}
        />
      )}
    </div>
  );
}
