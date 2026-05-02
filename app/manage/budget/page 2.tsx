"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { PaidChip } from "@/components/ui/StatusChip";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { createBudgetItem, deleteBudgetItem, listBudgetItems, updateBudgetItem } from "@/app/actions/panel";
import type { BudgetItem } from "@/lib/types";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Venue", "Catering", "Photography", "Videography",
  "Flowers & Décor", "Music & Entertainment", "Stationery",
  "Attire", "Hair & Makeup", "Transport", "Honeymoon", "Other",
];

const EMPTY_ITEM: Omit<BudgetItem, "id" | "submission_id"> = {
  category: "Venue",
  description: "",
  budgeted: 0,
  actual: 0,
  deposit_paid: 0,
  payment_due_date: "",
  paid_status: "unpaid",
  notes: "",
};

function fmt(n: number, currency = "£") {
  return `${currency}${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ProgressBar({ budgeted, actual }: { budgeted: number; actual: number }) {
  const over = actual > budgeted;
  const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: over
            ? "var(--secondary-container)"
            : "linear-gradient(90deg, var(--primary), var(--primary-container))",
        }}
      />
    </div>
  );
}

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  const load = useCallback(async () => {
    const data = await listBudgetItems();
    setItems(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const totalBudgeted = items.reduce((s, i) => s + i.budgeted, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const totalDeposits = items.reduce((s, i) => s + i.deposit_paid, 0);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...items.map((i) => i.category)])];

  function itemsInCategory(cat: string) {
    return items.filter((i) => i.category === cat);
  }

  function toggleCollapse(cat: string) {
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  }

  async function addItem() {
    const data = await createBudgetItem(newItem);
    setItems((prev) => [...prev, data]);
    setShowAdd(false);
    setNewItem({ ...EMPTY_ITEM });
  }

  async function saveEdit() {
    if (!editItem) return;
    const data = await updateBudgetItem(editItem.id, {
      category: editItem.category,
      description: editItem.description,
      budgeted: editItem.budgeted,
      actual: editItem.actual,
      deposit_paid: editItem.deposit_paid,
      payment_due_date: editItem.payment_due_date,
      paid_status: editItem.paid_status,
      notes: editItem.notes,
    });
    setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
    setEditItem(null);
  }

  async function deleteItem(id: string) {
    await deleteBudgetItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteTarget(null);
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>Loading budget…</div>;

  return (
    <div>
      <ModuleHeader
        title="Budget Tracker"
        subtitle="Track every wedding expense across all categories."
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
          >
            <Plus size={14} strokeWidth={1.5} /> Add Item
          </button>
        }
      />

      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Budget", value: totalBudgeted },
          { label: "Total Spent", value: totalActual, highlight: totalActual > totalBudgeted },
          { label: "Remaining", value: totalBudgeted - totalActual },
          { label: "Deposits Paid", value: totalDeposits },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="p-4 rounded-xl"
            style={{
              background: highlight ? "var(--secondary-container)" : "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <p
              className="text-2xl font-light mb-1"
              style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
            >
              {fmt(value)}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catItems = itemsInCategory(cat);
          if (catItems.length === 0) return null;
          const catBudget = catItems.reduce((s, i) => s + i.budgeted, 0);
          const catActual = catItems.reduce((s, i) => s + i.actual, 0);
          const isOpen = !collapsed[cat];

          return (
            <div
              key={cat}
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
            >
              <button
                onClick={() => toggleCollapse(cat)}
                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[var(--surface-container-low)]"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={14} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} /> : <ChevronRight size={14} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} />}
                  <span style={{ fontFamily: "var(--font-work-sans)", fontWeight: 500, color: "var(--on-surface)", fontSize: "0.875rem" }}>{cat}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <ProgressBar budgeted={catBudget} actual={catActual} />
                  </div>
                  <span className="text-sm tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {fmt(catActual)} / {fmt(catBudget)}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--surface-container-low)" }}>
                        {["Description", "Budgeted", "Actual", "Deposit", "Balance Due", "Due Date", "Status", ""].map((h) => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, i) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-[var(--surface-container-low)]"
                          style={{ background: i % 2 === 0 ? "transparent" : "var(--surface-container-low)" }}
                          onClick={() => setEditItem({ ...item })}
                        >
                          <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>{item.description}</td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{fmt(item.budgeted)}</td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: item.actual > item.budgeted ? "#5a3e36" : "var(--on-surface-variant)" }}>{fmt(item.actual)}</td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{fmt(item.deposit_paid)}</td>
                          <td className="px-4 py-2.5 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{fmt(Math.max(item.actual - item.deposit_paid, 0))}</td>
                          <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{item.payment_due_date || "—"}</td>
                          <td className="px-4 py-2.5"><PaidChip status={item.paid_status} /></td>
                          <td className="px-4 py-2.5">
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id); }} className="p-1 rounded hover:bg-[var(--secondary-container)] transition-colors" style={{ color: "var(--on-surface-variant)" }}>
                              <Trash2 size={12} strokeWidth={1} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
            <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>No budget items yet</p>
            <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Add your first expense to start tracking.</p>
          </div>
        )}
      </div>

      {/* Add Item Overlay */}
      {showAdd && (
        <Overlay title="Add Budget Item" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Category</label>
                <select value={newItem.category} onChange={(e) => setNewItem((i) => ({ ...i, category: e.target.value }))} className="input-underline">
                  {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Description</label>
                <input value={newItem.description} onChange={(e) => setNewItem((i) => ({ ...i, description: e.target.value }))} className="input-underline" placeholder="e.g. Main venue hire" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Budgeted (£)</label>
                <input type="number" min="0" value={newItem.budgeted} onChange={(e) => setNewItem((i) => ({ ...i, budgeted: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Actual / Quoted (£)</label>
                <input type="number" min="0" value={newItem.actual} onChange={(e) => setNewItem((i) => ({ ...i, actual: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Deposit Paid (£)</label>
                <input type="number" min="0" value={newItem.deposit_paid} onChange={(e) => setNewItem((i) => ({ ...i, deposit_paid: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Payment Due Date</label>
                <input type="date" value={newItem.payment_due_date} onChange={(e) => setNewItem((i) => ({ ...i, payment_due_date: e.target.value }))} className="input-underline" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Status</label>
                <select value={newItem.paid_status} onChange={(e) => setNewItem((i) => ({ ...i, paid_status: e.target.value as BudgetItem["paid_status"] }))} className="input-underline">
                  <option value="unpaid">Unpaid</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Notes</label>
                <textarea value={newItem.notes} onChange={(e) => setNewItem((i) => ({ ...i, notes: e.target.value }))} className="input-underline resize-none" rows={2} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Cancel</button>
            <button onClick={addItem} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>Add Item</button>
          </div>
        </Overlay>
      )}

      {/* Edit Item Overlay */}
      {editItem && (
        <Overlay title="Edit Budget Item" onClose={() => setEditItem(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Description</label>
                <input value={editItem.description} onChange={(e) => setEditItem((i) => i && ({ ...i, description: e.target.value }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Budgeted (£)</label>
                <input type="number" value={editItem.budgeted} onChange={(e) => setEditItem((i) => i && ({ ...i, budgeted: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Actual (£)</label>
                <input type="number" value={editItem.actual} onChange={(e) => setEditItem((i) => i && ({ ...i, actual: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Deposit Paid (£)</label>
                <input type="number" value={editItem.deposit_paid} onChange={(e) => setEditItem((i) => i && ({ ...i, deposit_paid: Number(e.target.value) }))} className="input-underline" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Payment Due Date</label>
                <input type="date" value={editItem.payment_due_date} onChange={(e) => setEditItem((i) => i && ({ ...i, payment_due_date: e.target.value }))} className="input-underline" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Status</label>
                <select value={editItem.paid_status} onChange={(e) => setEditItem((i) => i && ({ ...i, paid_status: e.target.value as BudgetItem["paid_status"] }))} className="input-underline">
                  <option value="unpaid">Unpaid</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Notes</label>
                <textarea value={editItem.notes} onChange={(e) => setEditItem((i) => i && ({ ...i, notes: e.target.value }))} className="input-underline resize-none" rows={2} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>Save Changes</button>
          </div>
        </Overlay>
      )}

      {deleteTarget && (
        <ConfirmOverlay
          title="Delete Item"
          message="This budget item will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={() => deleteItem(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
