"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { PaidChip } from "@/components/ui/StatusChip";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { createBudgetItem, deleteBudgetItem, listBudgetItems, updateBudgetItem } from "@/app/actions/panel";
import { useT } from "@/context/UserContext";
import { translations } from "@/lib/panel-i18n";
import type { BudgetItem } from "@/lib/types";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const DEFAULT_CATEGORY_VALUES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Flowers & Decor",
  "Music & Entertainment",
  "Stationery",
  "Attire",
  "Hair & Makeup",
  "Transport",
  "Honeymoon",
  "Other",
];

const CHART_COLORS = ["#6c5b4e", "#a88778", "#d2a18f", "#8fa39a", "#c0b28f", "#9a9087", "#c87969", "#b6aaa0"];

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

type BudgetDraft = Omit<BudgetItem, "id" | "submission_id">;
type ChartMode = "actual" | "budgeted" | "balance";
type BudgetText = {
  [K in keyof typeof translations.en.budget]: K extends "categoryLabels" ? readonly string[] : string;
};

function fmt(n: number, currency = "£") {
  return `${currency}${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function balanceDue(item: Pick<BudgetItem, "actual" | "deposit_paid">) {
  return Math.max(item.actual - item.deposit_paid, 0);
}

function statusFromAmounts(actual: number, paid: number): BudgetItem["paid_status"] {
  if (actual > 0 && paid >= actual) return "fully_paid";
  if (paid > 0) return "deposit_paid";
  return "unpaid";
}

function buildCategoryOptions(t: BudgetText) {
  return DEFAULT_CATEGORY_VALUES.map((value, index) => ({
    value,
    label: t.categoryLabels[index] ?? value,
  }));
}

function categoryLabel(category: string, t: BudgetText) {
  const canonicalIndex = DEFAULT_CATEGORY_VALUES.findIndex((value) => value.toLowerCase() === category.toLowerCase());
  if (canonicalIndex >= 0) return t.categoryLabels[canonicalIndex] ?? category;

  const englishIndex = translations.en.budget.categoryLabels.findIndex((label) => label.toLowerCase() === category.toLowerCase());
  if (englishIndex >= 0) return t.categoryLabels[englishIndex] ?? category;

  const spanishIndex = translations.es.budget.categoryLabels.findIndex((label) => label.toLowerCase() === category.toLowerCase());
  if (spanishIndex >= 0) return t.categoryLabels[spanishIndex] ?? category;

  return category;
}

function categoryValueFromInput(input: string, t: BudgetText) {
  const options = buildCategoryOptions(t);
  const localizedMatch = options.find((option) => option.label.toLowerCase() === input.toLowerCase());
  if (localizedMatch) return localizedMatch.value;

  const englishIndex = translations.en.budget.categoryLabels.findIndex((label) => label.toLowerCase() === input.toLowerCase());
  if (englishIndex >= 0) return DEFAULT_CATEGORY_VALUES[englishIndex];

  const spanishIndex = translations.es.budget.categoryLabels.findIndex((label) => label.toLowerCase() === input.toLowerCase());
  if (spanishIndex >= 0) return DEFAULT_CATEGORY_VALUES[spanishIndex];

  return input;
}

function normalizeDraft(item: BudgetDraft): BudgetDraft {
  const actual = Math.max(Number(item.actual) || 0, 0);
  const paid = Math.min(Math.max(Number(item.deposit_paid) || 0, 0), actual || Number.MAX_SAFE_INTEGER);
  return {
    ...item,
    category: item.category.trim() || "Other",
    description: item.description.trim(),
    budgeted: Math.max(Number(item.budgeted) || 0, 0),
    actual,
    deposit_paid: actual > 0 ? paid : Math.max(Number(item.deposit_paid) || 0, 0),
    paid_status: statusFromAmounts(actual, paid),
    notes: item.notes.trim(),
  };
}

function ProgressBar({ budgeted, actual }: { budgeted: number; actual: number }) {
  const over = actual > budgeted && budgeted > 0;
  const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
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

function ExpenseForm({
  value,
  categoryOptions,
  t,
  onChange,
  onSubmit,
  submitLabel,
}: {
  value: BudgetDraft;
  categoryOptions: { value: string; label: string }[];
  t: BudgetText;
  onChange: (next: BudgetDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  function update<K extends keyof BudgetDraft>(key: K, nextValue: BudgetDraft[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function updateAmount(key: "budgeted" | "actual" | "deposit_paid", raw: string) {
    const amount = Math.max(Number(raw) || 0, 0);
    const next = { ...value, [key]: amount };
    if (key === "actual" && value.paid_status === "fully_paid") next.deposit_paid = amount;
    if (key === "actual" && value.deposit_paid > amount && amount > 0) next.deposit_paid = amount;
    if (key === "deposit_paid") next.paid_status = statusFromAmounts(next.actual, amount);
    onChange(next);
  }

  function setPaymentState(status: BudgetItem["paid_status"]) {
    if (status === "fully_paid") onChange({ ...value, paid_status: status, deposit_paid: value.actual });
    if (status === "deposit_paid") onChange({ ...value, paid_status: status, deposit_paid: value.deposit_paid || 0 });
    if (status === "unpaid") onChange({ ...value, paid_status: status, deposit_paid: 0 });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.section}
          </label>
          <input
            list="budget-categories"
            value={categoryLabel(value.category, t)}
            onChange={(e) => update("category", categoryValueFromInput(e.target.value, t))}
            className="input-underline"
            placeholder={t.sectionPlaceholder}
          />
          <datalist id="budget-categories">
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.label} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.expenseName}
          </label>
          <input
            value={value.description}
            onChange={(e) => update("description", e.target.value)}
            className="input-underline"
            placeholder={t.expensePlaceholder}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.budgeted}
          </label>
          <input type="number" min="0" value={value.budgeted} onChange={(e) => updateAmount("budgeted", e.target.value)} className="input-underline" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.actual}
          </label>
          <input type="number" min="0" value={value.actual} onChange={(e) => updateAmount("actual", e.target.value)} className="input-underline" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>
          {t.paymentState}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "unpaid", label: t.future, icon: CalendarClock },
            { value: "deposit_paid", label: t.partial, icon: CircleDollarSign },
            { value: "fully_paid", label: t.paid, icon: Check },
          ].map((option) => {
            const Icon = option.icon;
            const active = value.paid_status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentState(option.value as BudgetItem["paid_status"])}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--primary)" : "var(--surface-container-low)",
                  color: active ? "white" : "var(--on-surface)",
                }}
              >
                <Icon size={13} strokeWidth={1.5} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.deposit}
          </label>
          <input type="number" min="0" value={value.deposit_paid} onChange={(e) => updateAmount("deposit_paid", e.target.value)} className="input-underline" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
            {t.dueDate}
          </label>
          <input type="date" value={value.payment_due_date} onChange={(e) => update("payment_due_date", e.target.value)} className="input-underline" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: "var(--surface-container-low)" }}>
        <MiniStat label={t.total} value={fmt(value.actual)} />
        <MiniStat label={t.paid} value={fmt(value.deposit_paid)} />
        <MiniStat label={t.balanceDue} value={fmt(balanceDue(value))} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
          {t.notes}
        </label>
        <textarea value={value.notes} onChange={(e) => update("notes", e.target.value)} className="input-underline resize-none" rows={2} />
      </div>

      <button
        onClick={onSubmit}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium"
        style={{ background: "var(--primary)", color: "white" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium tabular-nums" style={{ color: "var(--on-surface)" }}>
        {value}
      </p>
      <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </p>
    </div>
  );
}

function DonutChart({
  data,
  mode,
  t,
}: {
  data: { label: string; value: number; color: string }[];
  mode: ChartMode;
  t: BudgetText;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = total
    ? data
        .map((item) => {
          const start = cursor;
          const end = cursor + (item.value / total) * 100;
          cursor = end;
          return `${item.color} ${start}% ${end}%`;
        })
        .join(", ")
    : "var(--surface-container-low) 0% 100%";

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {t.sectionBreakdown}
          </p>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {mode === "actual" ? t.showingCosts : mode === "budgeted" ? t.showingBudget : t.showingDue}
          </p>
        </div>
        <p className="text-xl font-light tabular-nums" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
          {fmt(total)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-5 items-center">
        <div
          className="relative mx-auto h-40 w-40 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
          aria-label={t.sectionBreakdown}
        >
          <div className="absolute inset-8 rounded-full flex items-center justify-center text-center" style={{ background: "var(--surface-container-lowest)" }}>
            <div>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                {t.total}
              </p>
              <p className="text-lg font-medium tabular-nums" style={{ color: "var(--on-surface)" }}>
                {fmt(total)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              {t.addExpensesChart}
            </p>
          ) : (
            data.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="truncate" style={{ color: "var(--on-surface)" }}>
                    {item.label}
                  </span>
                </div>
                <span className="tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
                  {fmt(item.value)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentStatusChart({ items, t }: { items: BudgetItem[]; t: BudgetText }) {
  const segments = [
    {
      key: "unpaid",
      label: t.futureLabel,
      count: items.filter((item) => item.paid_status === "unpaid").length,
      value: items.filter((item) => item.paid_status === "unpaid").reduce((sum, item) => sum + item.actual, 0),
      color: "#c7cbd6",
    },
    {
      key: "deposit_paid",
      label: t.partialLabel,
      count: items.filter((item) => item.paid_status === "deposit_paid").length,
      value: items.filter((item) => item.paid_status === "deposit_paid").reduce((sum, item) => sum + item.actual, 0),
      color: "#d96b72",
    },
    {
      key: "fully_paid",
      label: t.paidLabel,
      count: items.filter((item) => item.paid_status === "fully_paid").length,
      value: items.filter((item) => item.paid_status === "fully_paid").reduce((sum, item) => sum + item.actual, 0),
      color: "#70bda9",
    },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="rounded-xl p-4 h-full" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {t.paymentStatus}
          </p>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {fmt(total)}
          </p>
        </div>
        <p className="text-xl font-light tabular-nums" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
          {items.length}
        </p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full mb-4" style={{ background: "var(--surface-container-low)" }}>
        {segments.map((segment) => (
          <div
            key={segment.key}
            style={{
              width: total > 0 ? `${Math.max((segment.value / total) * 100, segment.value > 0 ? 4 : 0)}%` : "0%",
              background: segment.color,
            }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: segment.color }} />
              <span className="truncate" style={{ color: "var(--on-surface)" }}>
                {segment.label}
              </span>
            </div>
            <span className="tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
              {fmt(segment.value)} - {segment.count} {t.itemsLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBarChart({
  categories,
  items,
  t,
}: {
  categories: string[];
  items: BudgetItem[];
  t: BudgetText;
}) {
  const rows = categories
    .map((category) => {
      const catItems = items.filter((item) => item.category === category);
      return {
        category,
        budgeted: catItems.reduce((sum, item) => sum + item.budgeted, 0),
        actual: catItems.reduce((sum, item) => sum + item.actual, 0),
      };
    })
    .filter((row) => row.budgeted > 0 || row.actual > 0)
    .sort((a, b) => Math.max(b.actual, b.budgeted) - Math.max(a.actual, a.budgeted))
    .slice(0, 6);
  const max = Math.max(...rows.flatMap((row) => [row.budgeted, row.actual]), 1);

  return (
    <div className="rounded-xl p-4 h-full" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {t.budgetVsCost}
          </p>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {t.sectionProgress}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#c7cbd6" }} />{t.planned}</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#70bda9" }} />{t.spent}</span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {t.addExpensesChart}
          </p>
        ) : (
          rows.map((row) => {
            const over = row.actual > row.budgeted && row.budgeted > 0;
            return (
              <div key={row.category}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-medium truncate" style={{ color: "var(--on-surface)" }}>
                    {categoryLabel(row.category, t)}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: over ? "#5a3e36" : "var(--on-surface-variant)" }}>
                    {fmt(row.actual)} / {fmt(row.budgeted)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(row.budgeted / max) * 100}%`, background: "#c7cbd6" }} />
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(row.actual / max) * 100}%`, background: over ? "#d96b72" : "#70bda9" }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DuePaymentsCard({ items, t, onSelect }: { items: BudgetItem[]; t: BudgetText; onSelect: (item: BudgetItem) => void }) {
  const dueItems = items
    .filter((item) => balanceDue(item) > 0)
    .sort((a, b) => {
      const aTime = a.payment_due_date ? new Date(a.payment_due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.payment_due_date ? new Date(b.payment_due_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 6);
  const points = dueItems.map((item) => balanceDue(item));
  const max = Math.max(...points, 1);
  const width = 280;
  const height = 90;
  const linePoints = points.map((value, index) => {
    const x = points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - (value / max) * (height - 12) - 6;
    return `${x},${y}`;
  });
  const areaPoints = linePoints.length > 0 ? `0,${height} ${linePoints.join(" ")} ${width},${height}` : "";

  return (
    <div className="rounded-xl p-4 h-full" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {t.duePayments}
          </p>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {t.upcomingPayments}
          </p>
        </div>
        <p className="text-xl font-light tabular-nums" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
          {fmt(dueItems.reduce((sum, item) => sum + balanceDue(item), 0))}
        </p>
      </div>

      {dueItems.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          {t.noUpcomingPayments}
        </p>
      ) : (
        <>
          <svg className="mb-4 w-full h-24" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t.duePayments}>
            <polygon points={areaPoints} fill="#fed3c7" opacity="0.65" />
            <polyline points={linePoints.join(" ")} fill="none" stroke="#d96b72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {linePoints.map((point, index) => {
              const [x, y] = point.split(",");
              return <circle key={point + index} cx={x} cy={y} r="3" fill="#d96b72" />;
            })}
          </svg>

          <div className="space-y-2">
            {dueItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full flex items-center justify-between gap-3 text-left text-xs"
                style={{ color: "var(--on-surface-variant)" }}
              >
                <span className="truncate" style={{ color: "var(--on-surface)" }}>
                  {item.description || categoryLabel(item.category, t)}
                </span>
                <span className="shrink-0 tabular-nums">
                  {fmt(balanceDue(item))}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BudgetPulseCard({
  totalBudgeted,
  totalActual,
  totalPaid,
  t,
}: {
  totalBudgeted: number;
  totalActual: number;
  totalPaid: number;
  t: BudgetText;
}) {
  const spentPct = totalBudgeted > 0 ? Math.min((totalActual / totalBudgeted) * 100, 140) : 0;
  const paidPct = totalActual > 0 ? Math.round((totalPaid / totalActual) * 100) : 0;
  const status = totalBudgeted === 0 ? t.onTrack : totalActual > totalBudgeted ? t.overBudget : totalActual > totalBudgeted * 0.85 ? t.onTrack : t.underBudget;

  return (
    <div className="rounded-xl p-4 h-full" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {t.budgetDashboard}
          </p>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {status}
          </p>
        </div>
        <p className="text-2xl font-light tabular-nums" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
          {paidPct}%
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--on-surface-variant)" }}>
            <span>{t.spent}</span>
            <span>{fmt(totalActual)} / {fmt(totalBudgeted)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(spentPct, 100)}%`,
                background: totalActual > totalBudgeted && totalBudgeted > 0 ? "#d96b72" : "#70bda9",
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--on-surface-variant)" }}>
            <span>{t.paidPercent}</span>
            <span>{fmt(totalPaid)} / {fmt(totalActual)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-container-low)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(paidPct, 100)}%`, background: "#6c5b4e" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const t = useT();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<BudgetDraft>({ ...EMPTY_ITEM });
  const [chartMode, setChartMode] = useState<ChartMode>("actual");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const load = useCallback(async () => {
    const data = await listBudgetItems();
    setItems(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const totalBudgeted = items.reduce((s, i) => s + i.budgeted, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const totalPaid = items.reduce((s, i) => s + i.deposit_paid, 0);
  const totalBalance = items.reduce((s, i) => s + balanceDue(i), 0);

  const categoryOptions = useMemo(() => buildCategoryOptions(t.budget), [t.budget]);
  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORY_VALUES, ...items.map((i) => i.category)])], [items]);
  const activeCategories = useMemo(() => categories.filter((cat) => items.some((i) => i.category === cat)), [categories, items]);
  const visibleChartSections = selectedSections.length > 0 ? selectedSections : activeCategories;

  const chartData = visibleChartSections
    .map((cat, index) => {
      const catItems = items.filter((i) => i.category === cat);
      const value = catItems.reduce((sum, item) => {
        if (chartMode === "budgeted") return sum + item.budgeted;
        if (chartMode === "balance") return sum + balanceDue(item);
        return sum + item.actual;
      }, 0);
      return { label: categoryLabel(cat, t.budget), value, color: CHART_COLORS[index % CHART_COLORS.length] };
    })
    .filter((item) => item.value > 0);

  function itemsInCategory(cat: string) {
    return items.filter((i) => i.category === cat);
  }

  function toggleCollapse(cat: string) {
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  }

  function toggleSection(cat: string) {
    setSelectedSections((current) => {
      const base = current.length > 0 ? current : activeCategories;
      return base.includes(cat) ? base.filter((section) => section !== cat) : [...base, cat];
    });
  }

  async function addItem() {
    const data = await createBudgetItem(normalizeDraft(newItem));
    setItems((prev) => [...prev, data]);
    setShowAdd(false);
    setNewItem({ ...EMPTY_ITEM });
  }

  async function saveEdit() {
    if (!editItem) return;
    const data = await updateBudgetItem(editItem.id, normalizeDraft(editItem));
    setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
    setEditItem(null);
  }

  async function deleteItem(id: string) {
    await deleteBudgetItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
        {t.common.loading}
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader
        title={t.budget.title}
        subtitle={t.budget.subtitle}
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Plus size={14} strokeWidth={1.5} /> {t.budget.addExpense}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.budget.totalBudget, value: totalBudgeted },
          { label: t.budget.totalSpent, value: totalActual, highlight: totalActual > totalBudgeted && totalBudgeted > 0 },
          { label: t.budget.depositsPaid, value: totalPaid },
          { label: t.budget.stillDue, value: totalBalance, highlight: totalBalance > 0 },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="p-4 rounded-xl"
            style={{
              background: highlight ? "var(--secondary-container)" : "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <p className="text-2xl font-light mb-1 tabular-nums" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
              {fmt(value)}
            </p>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(340px,1.15fr)_minmax(300px,0.85fr)] gap-6 mb-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-lg p-1" style={{ background: "var(--surface-container-low)" }}>
              {[
                { value: "actual", label: t.budget.costs },
                { value: "budgeted", label: t.budget.budget },
                { value: "balance", label: t.budget.due },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setChartMode(mode.value as ChartMode)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: chartMode === mode.value ? "var(--surface-container-lowest)" : "transparent",
                    color: chartMode === mode.value ? "var(--on-surface)" : "var(--on-surface-variant)",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedSections([])} className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {t.budget.showAllSections}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeCategories.map((cat) => {
              const selected = selectedSections.length === 0 || selectedSections.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleSection(cat)}
                  className="rounded-full px-3 py-1 text-xs transition-colors"
                  style={{
                    background: selected ? "var(--primary)" : "var(--surface-container-low)",
                    color: selected ? "white" : "var(--on-surface-variant)",
                  }}
                >
                  {categoryLabel(cat, t.budget)}
                </button>
              );
            })}
          </div>

          <DonutChart data={chartData} mode={chartMode} t={t.budget} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
          <BudgetPulseCard totalBudgeted={totalBudgeted} totalActual={totalActual} totalPaid={totalPaid} t={t.budget} />
          <PaymentStatusChart items={items} t={t.budget} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 mb-8">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                {t.budget.quickAddTitle}
              </p>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                {t.budget.quickAddDesc}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-container-low)]"
              style={{ color: "var(--on-surface-variant)" }}
              aria-label={t.budget.addExpense}
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </div>
          <ExpenseForm value={newItem} categoryOptions={categoryOptions} t={t.budget} onChange={setNewItem} onSubmit={addItem} submitLabel={t.budget.addExpense} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <SectionBarChart categories={activeCategories} items={items} t={t.budget} />
          <DuePaymentsCard items={items} t={t.budget} onSelect={(item) => setEditItem({ ...item })} />
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const catItems = itemsInCategory(cat);
          if (catItems.length === 0) return null;
          const catBudget = catItems.reduce((s, i) => s + i.budgeted, 0);
          const catActual = catItems.reduce((s, i) => s + i.actual, 0);
          const catPaid = catItems.reduce((s, i) => s + i.deposit_paid, 0);
          const isOpen = !collapsed[cat];

          return (
            <div
              key={cat}
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
            >
              <button
                onClick={() => toggleCollapse(cat)}
                className="w-full flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--surface-container-low)]"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={14} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} /> : <ChevronRight size={14} strokeWidth={1} style={{ color: "var(--on-surface-variant)" }} />}
                  <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                    {categoryLabel(cat, t.budget)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <div className="w-36">
                    <ProgressBar budgeted={catBudget} actual={catActual} />
                  </div>
                  <span className="text-sm tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
                    {fmt(catActual)} {t.budget.totalPaidSummary} {fmt(catPaid)} {t.budget.paidSummary}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr style={{ background: "var(--surface-container-low)" }}>
                        {[t.budget.description, t.budget.budget, t.budget.totalFuture, t.budget.paid, t.budget.balanceDue, t.budget.dueDate, t.budget.state, t.budget.actions].map((h) => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, i) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-[var(--surface-container-low)]"
                          style={{ background: i % 2 === 0 ? "transparent" : "rgba(243,237,232,0.45)" }}
                        >
                          <td className="px-4 py-3">
                            <button onClick={() => setEditItem({ ...item })} className="text-left">
                              <span className="block font-medium" style={{ color: "var(--on-surface)" }}>
                                {item.description}
                              </span>
                              {item.notes && (
                                <span className="block text-xs mt-0.5 max-w-[260px] truncate" style={{ color: "var(--on-surface-variant)" }}>
                                  {item.notes}
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "var(--on-surface-variant)" }}>{fmt(item.budgeted)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: item.actual > item.budgeted && item.budgeted > 0 ? "#5a3e36" : "var(--on-surface-variant)" }}>{fmt(item.actual)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "var(--on-surface-variant)" }}>{fmt(item.deposit_paid)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "var(--on-surface-variant)" }}>{fmt(balanceDue(item))}</td>
                          <td className="px-4 py-3" style={{ color: "var(--on-surface-variant)" }}>{item.payment_due_date || "-"}</td>
                          <td className="px-4 py-3"><PaidChip status={item.paid_status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditItem({ ...item })} className="p-1.5 rounded hover:bg-[var(--surface-container)] transition-colors" style={{ color: "var(--on-surface-variant)" }} aria-label={t.budget.editExpense}>
                                <Pencil size={13} strokeWidth={1.5} />
                              </button>
                              <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 rounded hover:bg-[var(--secondary-container)] transition-colors" style={{ color: "var(--on-surface-variant)" }} aria-label={t.budget.deleteExpense}>
                                <Trash2 size={13} strokeWidth={1.5} />
                              </button>
                            </div>
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
          <div className="text-center py-16 rounded-xl" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
            <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>{t.budget.noExpensesTitle}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>{t.budget.noExpensesSubtitle}</p>
          </div>
        )}
      </div>

      {showAdd && (
        <Overlay title={t.budget.addExpense} onClose={() => setShowAdd(false)}>
          <ExpenseForm value={newItem} categoryOptions={categoryOptions} t={t.budget} onChange={setNewItem} onSubmit={addItem} submitLabel={t.budget.addExpense} />
        </Overlay>
      )}

      {editItem && (
        <Overlay title={t.budget.editExpense} onClose={() => setEditItem(null)}>
          <ExpenseForm value={editItem} categoryOptions={categoryOptions} t={t.budget} onChange={(next) => setEditItem((current) => current && { ...current, ...next })} onSubmit={saveEdit} submitLabel={t.budget.saveChanges} />
        </Overlay>
      )}

      {deleteTarget && (
        <ConfirmOverlay
          title={t.budget.deleteExpense}
          message={t.budget.deleteExpenseConfirm}
          confirmLabel={t.common.delete}
          onConfirm={() => deleteItem(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
