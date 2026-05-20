"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { listDietaryGuests } from "@/app/actions/panel";
import type { Guest } from "@/lib/types";
import { Download } from "lucide-react";

const DIETARY_CATEGORIES = [
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Nut Allergy",
  "Halal",
  "Kosher",
  "Dairy-Free",
  "Other",
];

const ACCESSIBILITY_CATEGORIES = [
  "Wheelchair Access",
  "Hearing Loop",
  "Seating Priority",
  "Carer Attending",
  "Other",
];

function guestsWithDietary(guests: Guest[], category: string) {
  if (category === "Other") {
    const known = DIETARY_CATEGORIES.filter((c) => c !== "Other").map((c) => c.toLowerCase());
    return guests.filter((g) => {
      if (!g.dietary) return false;
      const d = g.dietary.toLowerCase();
      return !known.some((k) => d.includes(k));
    });
  }
  return guests.filter(
    (g) => g.dietary && g.dietary.toLowerCase().includes(category.toLowerCase())
  );
}

function CategorySection({
  title,
  guests,
  type,
}: {
  title: string;
  guests: Guest[];
  type: "dietary" | "accessibility";
}) {
  if (guests.length === 0) return null;
  return (
    <div 
      className="mb-6 p-5 rounded-2xl"
      style={{
        background: "var(--surface-container-lowest)",
        boxShadow: "var(--shadow-ambient)"
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
        >
          {title}
        </h3>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
          style={{ background: "var(--secondary-container)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}
        >
          {guests.length}
        </span>
      </div>
      <div className="space-y-2">
        {guests.map((g, i) => (
          <div
            key={g.id}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
            style={{ background: i % 2 === 0 ? "var(--surface-container-low)" : "var(--surface-container-lowest)" }}
          >
            <div>
              <p className="text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                {g.first_name} {g.last_name}
              </p>
              {type === "dietary" && g.dietary && (
                <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                  {g.dietary}
                </p>
              )}
              {type === "accessibility" && g.notes && (
                <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                  {g.notes}
                </p>
              )}
            </div>
            {g.table_id && (
              <p className="text-xs" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                Assigned
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DietaryPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dietary" | "accessibility">("dietary");

  const load = useCallback(async () => {
    const data = await listDietaryGuests();
    setGuests(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const guestsWithRequirements = guests.filter((g) => g.dietary && g.dietary.trim() !== "");

  const accessibilityKeywords = [
    "wheelchair", "hearing loop", "seating priority", "carer", "accessible",
  ];
  const guestsWithAccessibility = guests.filter((g) =>
    g.notes && accessibilityKeywords.some((k) => g.notes.toLowerCase().includes(k))
  );

  function exportDietaryCSV() {
    const rows = [
      ["Guest Name", "Dietary Requirement", "Table"],
      ...guestsWithRequirements.map((g) => [
        `${g.first_name} ${g.last_name}`,
        g.dietary,
        g.table_id ? "Assigned" : "Unassigned",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "dietary-requirements.csv";
    a.click();
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>Loading…</div>;

  return (
    <div>
      <ModuleHeader
        title="Dietary & Accessibility"
        subtitle="Share requirements with your caterers and venue."
        actions={
          <button
            onClick={exportDietaryCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container)]"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
          >
            <Download size={14} strokeWidth={1} /> Export PDF
          </button>
        }
      />

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
        style={{ background: "var(--surface-container-low)" }}
      >
        {(["dietary", "accessibility"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-bold tracking-wider uppercase transition-all"
            style={{
              fontFamily: "var(--font-work-sans)",
              background: tab === t ? "var(--surface-container-lowest)" : "transparent",
              color: tab === t ? "var(--on-surface)" : "var(--on-surface-variant)",
              boxShadow: tab === t ? "var(--shadow-ambient)" : "none",
            }}
          >
            {t === "dietary" ? "Dietary Requirements" : "Accessibility Needs"}
          </button>
        ))}
      </div>

      {tab === "dietary" && (
        <div>
          {guestsWithRequirements.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem", fontWeight: "bold" }}>No dietary requirements recorded</p>
              <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Dietary information comes from your guest list.</p>
            </div>
          ) : (
            <div>
              {DIETARY_CATEGORIES.map((cat) => (
                <CategorySection
                  key={cat}
                  title={cat}
                  guests={guestsWithDietary(guests, cat)}
                  type="dietary"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "accessibility" && (
        <div>
          {guestsWithAccessibility.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem", fontWeight: "bold" }}>No accessibility needs recorded</p>
              <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>Add notes to guests in the Guest List to capture accessibility information.</p>
            </div>
          ) : (
            <div>
              {ACCESSIBILITY_CATEGORIES.map((cat) => {
                const catGuests = guests.filter((g) =>
                  g.notes && g.notes.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
                );
                return (
                  <CategorySection
                    key={cat}
                    title={cat}
                    guests={catGuests}
                    type="accessibility"
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
