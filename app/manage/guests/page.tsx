"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { RSVPChip } from "@/components/ui/StatusChip";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { archiveGuest as archiveGuestAction, createGuest, listGuests, updateGuest } from "@/app/actions/panel";
import type { Guest, RSVPStatus } from "@/lib/types";
import { Plus, Trash2, Search, Download, ChevronUp, ChevronDown } from "lucide-react";

const EMPTY_GUEST: Omit<Guest, "id" | "submission_id" | "created_at" | "archived"> = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  rsvp_status: "awaiting",
  dietary: "",
  plus_one: false,
  table_id: null,
  notes: "",
};

type SortKey = keyof Pick<Guest, "first_name" | "last_name" | "rsvp_status" | "dietary">;

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<RSVPStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("last_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newGuest, setNewGuest] = useState({ ...EMPTY_GUEST });

  const load = useCallback(async () => {
    const data = await listGuests();
    setGuests(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const counts = {
    confirmed: guests.filter((g) => g.rsvp_status === "confirmed").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    total: guests.length,
  };
  const completion = counts.total > 0
    ? Math.round(((counts.confirmed + counts.declined) / counts.total) * 100)
    : 0;

  const filtered = guests
    .filter((g) =>
      (filterStatus === "all" || g.rsvp_status === filterStatus) &&
      (search === "" ||
        `${g.first_name} ${g.last_name} ${g.email}`.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  async function addGuest() {
    const data = await createGuest(newGuest);
    setGuests((prev) => [...prev, data]);
    setShowAdd(false);
    setNewGuest({ ...EMPTY_GUEST });
  }

  async function saveEdit() {
    if (!editGuest) return;
    const data = await updateGuest(editGuest.id, {
      first_name: editGuest.first_name,
      last_name: editGuest.last_name,
      email: editGuest.email,
      phone: editGuest.phone,
      rsvp_status: editGuest.rsvp_status,
      dietary: editGuest.dietary,
      plus_one: editGuest.plus_one,
      notes: editGuest.notes,
    });
    setGuests((prev) => prev.map((g) => (g.id === data.id ? data : g)));
    setEditGuest(null);
  }

  async function archiveGuest(id: string) {
    await archiveGuestAction(id);
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setDeleteTarget(null);
  }

  function exportCSV() {
    const rows = [
      ["First Name", "Last Name", "Email", "Phone", "RSVP Status", "Dietary", "Plus One", "Notes"],
      ...filtered.map((g) => [
        g.first_name, g.last_name, g.email, g.phone,
        g.rsvp_status, g.dietary, g.plus_one ? "Yes" : "No", g.notes,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "guest-list.csv";
    a.click();
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc
        ? <ChevronUp size={12} strokeWidth={1} />
        : <ChevronDown size={12} strokeWidth={1} />
      : null;

  return (
    <div>
      <ModuleHeader
        title="Guest List & RSVP"
        subtitle="Manage your invitations and track responses."
        actions={
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container)]"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
            >
              <Download size={14} strokeWidth={1} /> Export
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
            >
              <Plus size={14} strokeWidth={1.5} /> Add Guest
            </button>
          </div>
        }
      />

      {/* RSVP Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Confirmed", count: counts.confirmed, active: filterStatus === "confirmed", status: "confirmed" as const, highlight: true },
          { label: "Declined", count: counts.declined, active: filterStatus === "declined", status: "declined" as const, highlight: false },
          { label: "Pending", count: counts.pending, active: filterStatus === "pending", status: "pending" as const, highlight: false },
          { label: `${completion}% complete`, count: counts.total, active: filterStatus === "all", status: "all" as const, highlight: false },
        ].map(({ label, count, active, status, highlight }) => (
          <button
            key={status}
            onClick={() => setFilterStatus(active ? "all" : status)}
            className="text-left p-4 rounded-xl transition-all"
            style={{
              background: highlight ? "var(--secondary-container)" : active ? "var(--surface-container)" : "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <p
              className="text-2xl font-light mb-1"
              style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
            >
              {count}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
            >
              {label}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div
          className="flex items-center gap-2 flex-1 px-3 rounded-lg"
          style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
        >
          <Search size={14} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="flex-1 py-2.5 bg-transparent text-sm outline-none"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RSVPStatus | "all")}
          className="px-3 py-2.5 rounded-lg text-sm bg-[var(--surface-container-lowest)] outline-none cursor-pointer"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)", boxShadow: "var(--shadow-ambient)" }}
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
          <option value="awaiting">Awaiting Invite</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
      >
        {loading ? (
          <div className="p-12 text-center" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)", fontSize: "0.875rem" }}>
            Loading guests…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>
              No guests found
            </p>
            <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
              Add your first guest to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-container-low)" }}>
                {[
                  { key: "last_name" as SortKey, label: "Name" },
                  { key: null, label: "Email" },
                  { key: "rsvp_status" as SortKey, label: "RSVP" },
                  { key: "dietary" as SortKey, label: "Dietary" },
                  { key: null, label: "Plus One" },
                  { key: null, label: "" },
                ].map(({ key, label }, i) => (
                  <th
                    key={i}
                    onClick={key ? () => toggleSort(key) : undefined}
                    className={`text-left px-4 py-3 font-medium ${key ? "cursor-pointer select-none" : ""}`}
                    style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)", fontSize: "0.75rem" }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && <SortIcon k={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest, i) => (
                <tr
                  key={guest.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--surface-container-low)]"
                  style={{ background: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)" }}
                  onClick={() => setEditGuest({ ...guest })}
                >
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                    {guest.first_name} {guest.last_name}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {guest.email}
                  </td>
                  <td className="px-4 py-3">
                    <RSVPChip status={guest.rsvp_status} />
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {guest.dietary || "—"}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {guest.plus_one ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(guest.id); }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--secondary-container)]"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      <Trash2 size={14} strokeWidth={1} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Guest Overlay */}
      {showAdd && (
        <Overlay title="Add Guest" onClose={() => { setShowAdd(false); setNewGuest({ ...EMPTY_GUEST }); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>First name</label>
                <input value={newGuest.first_name} onChange={(e) => setNewGuest((g) => ({ ...g, first_name: e.target.value }))} className="input-underline" placeholder="First" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Last name</label>
                <input value={newGuest.last_name} onChange={(e) => setNewGuest((g) => ({ ...g, last_name: e.target.value }))} className="input-underline" placeholder="Last" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Email</label>
              <input type="email" value={newGuest.email} onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))} className="input-underline" placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Phone</label>
              <input value={newGuest.phone} onChange={(e) => setNewGuest((g) => ({ ...g, phone: e.target.value }))} className="input-underline" placeholder="+44 7700 000000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>RSVP Status</label>
                <select value={newGuest.rsvp_status} onChange={(e) => setNewGuest((g) => ({ ...g, rsvp_status: e.target.value as RSVPStatus }))} className="input-underline">
                  <option value="awaiting">Awaiting Invite</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Dietary</label>
                <input value={newGuest.dietary} onChange={(e) => setNewGuest((g) => ({ ...g, dietary: e.target.value }))} className="input-underline" placeholder="e.g. Vegan" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="plus_one" checked={newGuest.plus_one} onChange={(e) => setNewGuest((g) => ({ ...g, plus_one: e.target.checked }))} className="rounded" />
              <label htmlFor="plus_one" className="text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>Bringing a plus one</label>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Notes</label>
              <textarea value={newGuest.notes} onChange={(e) => setNewGuest((g) => ({ ...g, notes: e.target.value }))} className="input-underline resize-none" rows={2} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Cancel</button>
            <button onClick={addGuest} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>Add Guest</button>
          </div>
        </Overlay>
      )}

      {/* Edit Guest Overlay */}
      {editGuest && (
        <Overlay title="Edit Guest" onClose={() => setEditGuest(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>First name</label>
                <input value={editGuest.first_name} onChange={(e) => setEditGuest((g) => g && ({ ...g, first_name: e.target.value }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Last name</label>
                <input value={editGuest.last_name} onChange={(e) => setEditGuest((g) => g && ({ ...g, last_name: e.target.value }))} className="input-underline" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Email</label>
              <input type="email" value={editGuest.email} onChange={(e) => setEditGuest((g) => g && ({ ...g, email: e.target.value }))} className="input-underline" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Phone</label>
              <input value={editGuest.phone} onChange={(e) => setEditGuest((g) => g && ({ ...g, phone: e.target.value }))} className="input-underline" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>RSVP Status</label>
                <select value={editGuest.rsvp_status} onChange={(e) => setEditGuest((g) => g && ({ ...g, rsvp_status: e.target.value as RSVPStatus }))} className="input-underline">
                  <option value="awaiting">Awaiting Invite</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Dietary</label>
                <input value={editGuest.dietary} onChange={(e) => setEditGuest((g) => g && ({ ...g, dietary: e.target.value }))} className="input-underline" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editGuest.plus_one} onChange={(e) => setEditGuest((g) => g && ({ ...g, plus_one: e.target.checked }))} className="rounded" />
              <span className="text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>Bringing a plus one</span>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Notes</label>
              <textarea value={editGuest.notes} onChange={(e) => setEditGuest((g) => g && ({ ...g, notes: e.target.value }))} className="input-underline resize-none" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditGuest(null)} className="px-4 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>Save Changes</button>
          </div>
        </Overlay>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmOverlay
          title="Archive Guest"
          message="This guest will be moved to your archived list. You can restore them at any time."
          confirmLabel="Archive"
          onConfirm={() => archiveGuest(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
