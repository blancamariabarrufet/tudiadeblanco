"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { assignGuestTable, createTable, deleteTable, listTablesAndGuests, renameTable as renameTableAction, updateTable as updateTableAction } from "@/app/actions/panel";
import { useT } from "@/context/UserContext";
import type { Guest, Table } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Pencil, Plus, Trash2, Search, AlertTriangle, Users } from "lucide-react";

function DraggableGuest({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="px-3 py-2 rounded-lg cursor-grab select-none transition-opacity"
      style={{
        background: "var(--surface-container-lowest)",
        opacity: isDragging ? 0.3 : 1,
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <p className="text-xs font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
        {guest.first_name} {guest.last_name}
      </p>
      {guest.dietary && (
        <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
          {guest.dietary}
        </p>
      )}
    </div>
  );
}

function TableCard({
  table,
  guests,
  onRemove,
  onRename,
  onOpen,
  labels,
}: {
  table: Table;
  guests: Guest[];
  onRemove: () => void;
  onRename: (name: string) => void;
  onOpen: () => void;
  labels: {
    seats: string;
    dropHere: string;
    viewFullTable: string;
    viewEditTable: string;
  };
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(table.name);
  const pct = guests.length / table.capacity;
  const hasConflict = guests.some((g) => g.dietary && g.dietary.length > 0);

  return (
    <div
      ref={setNodeRef}
      className="p-4 rounded-2xl flex-shrink-0 transition-all"
      style={{
        width: "200px",
        background: isOver ? "var(--surface-container)" : "var(--surface-container-lowest)",
        boxShadow: "var(--shadow-ambient)",
        border: isOver ? "2px solid var(--primary)" : "2px solid transparent",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { onRename(name); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onRename(name); setEditing(false); } }}
            className="text-sm font-medium bg-transparent outline-none border-b"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)", borderColor: "var(--primary)", width: "120px" }}
            autoFocus
          />
        ) : (
          <p
            className="text-sm font-medium cursor-pointer"
            style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
            onDoubleClick={() => setEditing(true)}
          >
            {table.name}
          </p>
        )}
        <div className="flex items-center gap-1">
          {hasConflict && (
            <AlertTriangle size={12} strokeWidth={1} style={{ color: "var(--primary)" }} />
          )}
          <button onClick={onOpen} className="p-1 rounded hover:bg-[var(--surface-container-low)] transition-colors" style={{ color: "var(--on-surface-variant)" }} aria-label={labels.viewEditTable}>
            <Pencil size={12} strokeWidth={1} />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-[var(--secondary-container)] transition-colors" style={{ color: "var(--on-surface-variant)" }}>
            <Trash2 size={12} strokeWidth={1} />
          </button>
        </div>
      </div>

      <p className="text-xs mb-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
        {guests.length} / {table.capacity} {labels.seats}
      </p>

      <div
        className="h-1 rounded-full mb-3 overflow-hidden"
        style={{ background: "var(--surface-container-low)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct * 100, 100)}%`,
            background: pct >= 1 ? "var(--secondary-container)" : "linear-gradient(90deg, var(--primary), var(--primary-container))",
          }}
        />
      </div>

      <button
        onClick={onOpen}
        className="w-full rounded-lg px-2 py-1.5 mb-3 text-xs transition-colors hover:bg-[var(--surface-container-low)]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {labels.viewFullTable}
      </button>

      <div className="space-y-1 min-h-[40px] max-h-36 overflow-auto">
        {guests.map((g) => (
          <p key={g.id} className="text-xs px-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
            {g.first_name} {g.last_name}
          </p>
        ))}
        {guests.length === 0 && (
          <p className="text-xs italic px-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)", opacity: 0.5 }}>
            {labels.dropHere}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SeatingPage() {
  const t = useT();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddTable, setShowAddTable] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [newTable, setNewTable] = useState<{ name: string; capacity: string; shape: "round" | "rectangular" }>({ name: "", capacity: "8", shape: "round" });
  const [tableForm, setTableForm] = useState<{ name: string; capacity: string; shape: "round" | "rectangular" }>({ name: "", capacity: "8", shape: "round" });

  const { setNodeRef: unassignedRef, isOver: isOverUnassigned } = useDroppable({ id: "unassigned" });

  const load = useCallback(async () => {
    const data = await listTablesAndGuests();
    setGuests(data.guests);
    setTables(data.tables);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const unassigned = guests.filter(
    (g) => !g.table_id && `${g.first_name} ${g.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  function guestsAtTable(tableId: string) {
    return guests.filter((g) => g.table_id === tableId);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggedGuest(null);
    if (!over) return;

    const guestId = String(active.id);
    const destination = String(over.id);
    const tableId = destination === "unassigned" ? null : destination;

    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, table_id: tableId } : g))
    );

    await assignGuestTable(guestId, tableId);
  }

  async function addTable() {
    const data = await createTable({
      name: newTable.name || `${t.seating.table} ${tables.length + 1}`,
      capacity: parseInt(newTable.capacity, 10),
      shape: newTable.shape,
      x: 0,
      y: 0,
    });
    setTables((prev) => [...prev, data]);
    setShowAddTable(false);
    setNewTable({ name: "", capacity: "8", shape: "round" });
  }

  async function removeTable(id: string) {
    await deleteTable(id);
    setGuests((prev) => prev.map((g) => (g.table_id === id ? { ...g, table_id: null } : g)));
    setTables((prev) => prev.filter((t) => t.id !== id));
    setRemoveTarget(null);
  }

  async function renameTable(id: string, name: string) {
    await renameTableAction(id, name);
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function openTable(table: Table) {
    setEditTable(table);
    setTableForm({ name: table.name, capacity: String(table.capacity), shape: table.shape });
  }

  async function saveTable() {
    if (!editTable) return;
    const data = await updateTableAction(editTable.id, {
      name: tableForm.name.trim() || editTable.name,
      capacity: Math.max(parseInt(tableForm.capacity, 10) || editTable.capacity, 1),
      shape: tableForm.shape,
    });
    setTables((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    setEditTable(data);
    setTableForm({ name: data.name, capacity: String(data.capacity), shape: data.shape });
  }

  async function unassignGuest(guestId: string) {
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_id: null } : g)));
    await assignGuestTable(guestId, null);
  }

  function shapeLabel(shape: Table["shape"]) {
    return shape === "round" ? t.seating.round : t.seating.rectangular;
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>{t.common.loading}</div>;

  return (
    <div>
      <ModuleHeader
        title={t.seating.title}
        subtitle={t.seating.subtitle}
        actions={
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
          >
            <Plus size={14} strokeWidth={1.5} /> {t.seating.addTable}
          </button>
        }
      />

      <DndContext
        onDragStart={(e) => {
          const guest = guests.find((g) => g.id === e.active.id);
          setDraggedGuest(guest ?? null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Tables canvas */}
          <div
            className="flex-1 rounded-2xl overflow-auto p-6"
            style={{ background: "var(--surface-container-low)" }}
          >
            {tables.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>{t.seating.noTablesTitle}</p>
                  <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.noTablesSubtitle}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    guests={guestsAtTable(table.id)}
                    onRemove={() => setRemoveTarget(table.id)}
                    onRename={(name) => renameTable(table.id, name)}
                    onOpen={() => openTable(table)}
                    labels={{
                      seats: t.seating.seats,
                      dropHere: t.seating.dropHere,
                      viewFullTable: t.seating.viewFullTable,
                      viewEditTable: t.seating.viewEditTable,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unassigned sidebar */}
          <div
            className="w-56 shrink-0 rounded-2xl flex flex-col"
            style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
          >
            <div className="p-4 border-b" style={{ borderColor: "rgba(204,198,188,0.2)" }}>
              <p className="text-sm font-medium mb-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                {t.seating.unassigned} ({unassigned.length})
              </p>
              <div className="flex items-center gap-2" style={{ borderBottom: "1px solid rgba(204,198,188,0.3)" }}>
                <Search size={12} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.seating.searchPlaceholder}
                  className="flex-1 py-1 bg-transparent text-xs outline-none"
                  style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
                />
              </div>
            </div>

            <div
              ref={unassignedRef}
              className="flex-1 overflow-auto p-3 space-y-2 transition-colors"
              style={{ background: isOverUnassigned ? "var(--surface-container-low)" : "transparent" }}
            >
              {unassigned.map((g) => (
                <DraggableGuest key={g.id} guest={g} />
              ))}
              {unassigned.length === 0 && (
                <p className="text-xs italic text-center pt-6" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)", opacity: 0.5 }}>
                  {t.seating.allAssigned}
                </p>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggedGuest && (
            <div
              className="px-3 py-2 rounded-lg shadow-lg"
              style={{ background: "var(--surface-container-lowest)", fontFamily: "var(--font-work-sans)", fontSize: "0.75rem", color: "var(--on-surface)" }}
            >
              {draggedGuest.first_name} {draggedGuest.last_name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {tables.length > 0 && (
        <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(204,198,188,0.25)" }}>
            <Users size={15} strokeWidth={1.5} style={{ color: "var(--on-surface-variant)" }} />
            <p className="text-sm font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              {t.seating.tableOverview}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr style={{ background: "var(--surface-container-low)" }}>
                  {[t.seating.table, t.seating.shape, t.seating.seats, t.seating.guests, t.seating.open].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map((table, index) => {
                  const tableGuests = guestsAtTable(table.id);
                  return (
                    <tr key={table.id} style={{ background: index % 2 === 0 ? "transparent" : "rgba(243,237,232,0.45)" }}>
                      <td className="px-4 py-3 font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>{table.name}</td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{shapeLabel(table.shape)}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{tableGuests.length} / {table.capacity}</td>
                      <td className="px-4 py-3 max-w-[360px] truncate" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                        {tableGuests.length > 0 ? tableGuests.map((g) => `${g.first_name} ${g.last_name}`).join(", ") : t.seating.noGuestsAssigned}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openTable(table)} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-container-low)]" style={{ color: "var(--on-surface)" }}>
                          <Pencil size={12} strokeWidth={1.5} /> {t.seating.details}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddTable && (
        <Overlay title={t.seating.addTable} onClose={() => setShowAddTable(false)} width="max-w-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.tableName}</label>
              <input value={newTable.name} onChange={(e) => setNewTable((t) => ({ ...t, name: e.target.value }))} className="input-underline" placeholder={`${t.seating.table} ${tables.length + 1}`} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.capacity}</label>
              <input type="number" min="1" max="30" value={newTable.capacity} onChange={(e) => setNewTable((t) => ({ ...t, capacity: e.target.value }))} className="input-underline" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.shape}</label>
              <select value={newTable.shape} onChange={(e) => setNewTable((t) => ({ ...t, shape: e.target.value as "round" | "rectangular" }))} className="input-underline">
                <option value="round">{t.seating.round}</option>
                <option value="rectangular">{t.seating.rectangular}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAddTable(false)} className="px-4 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.common.cancel}</button>
            <button onClick={addTable} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>{t.seating.addTable}</button>
          </div>
        </Overlay>
      )}

      {editTable && (
        <Overlay title={editTable.name} onClose={() => setEditTable(null)} width="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.tableName}</label>
                <input value={tableForm.name} onChange={(e) => setTableForm((t) => ({ ...t, name: e.target.value }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.capacity}</label>
                <input type="number" min="1" max="30" value={tableForm.capacity} onChange={(e) => setTableForm((t) => ({ ...t, capacity: e.target.value }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.shape}</label>
                <select value={tableForm.shape} onChange={(e) => setTableForm((t) => ({ ...t, shape: e.target.value as "round" | "rectangular" }))} className="input-underline">
                  <option value="round">{t.seating.round}</option>
                  <option value="rectangular">{t.seating.rectangular}</option>
                </select>
              </div>
              <button onClick={saveTable} className="w-full px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>
                {t.seating.saveTable}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                  {t.seating.guestsAtTable}
                </p>
                <p className="text-xs tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                  {guestsAtTable(editTable.id).length} / {tableForm.capacity || editTable.capacity}
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(204,198,188,0.35)" }}>
                {guestsAtTable(editTable.id).length === 0 ? (
                  <p className="p-4 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {t.seating.noGuestsAssignedYet}
                  </p>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    {guestsAtTable(editTable.id).map((guest, index) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        style={{ background: index % 2 === 0 ? "var(--surface-container-lowest)" : "rgba(243,237,232,0.45)" }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                            {guest.first_name} {guest.last_name}
                          </p>
                          {(guest.dietary || guest.notes) && (
                            <p className="text-xs truncate" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                              {guest.dietary || guest.notes}
                            </p>
                          )}
                        </div>
                        <button onClick={() => unassignGuest(guest.id)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-[var(--secondary-container)]" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                          {t.seating.remove}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {removeTarget && (
        <ConfirmOverlay
          title={t.seating.removeTable}
          message={t.seating.removeTableConfirm}
          confirmLabel={t.seating.removeTable}
          onConfirm={() => removeTable(removeTarget)}
          onCancel={() => setRemoveTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
