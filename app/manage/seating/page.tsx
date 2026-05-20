"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { assignGuestTable, createTable, deleteTable, listTablesAndGuests, renameTable as renameTableAction, updateTable as updateTableAction, updateTablePosition } from "@/app/actions/panel";
import { useT } from "@/context/UserContext";
import type { Guest, Table } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Download, Pencil, Plus, Trash2, Search, AlertTriangle, Users, RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

type SeatPosition = {
  left: string;
  top: string;
};

type SeatSlot = {
  guest: Guest | null;
  isPersisted: boolean;
};

const CANVAS_COLS = 4;
const CANVAS_CELL_W = 340;
const CANVAS_CELL_H = 360;
const CANVAS_PAD = 40;
const CARD_SIZE = 280;

function gridSlot(index: number) {
  const col = index % CANVAS_COLS;
  const row = Math.floor(index / CANVAS_COLS);
  return {
    x: CANVAS_PAD + col * CANVAS_CELL_W,
    y: CANVAS_PAD + row * CANVAS_CELL_H,
  };
}

const TABLE_DRAG_PREFIX = "table:";

function getSeatDropId(tableId: string, seatIndex: number) {
  return `seat:${tableId}:${seatIndex}`;
}

function parseSeatDropId(id: string) {
  const match = id.match(/^seat:(.+):(\d+)$/);
  if (!match) return null;
  return {
    tableId: match[1],
    seatIndex: Number(match[2]),
  };
}

function getGuestInitials(guest: Guest) {
  return `${guest.first_name[0] ?? ""}${guest.last_name[0] ?? ""}`.toUpperCase();
}

function getGuestName(guest: Guest) {
  return `${guest.first_name} ${guest.last_name}`.trim();
}

function escapeHtml(value: unknown) {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(/[&<>"']/g, (char) => replacements[char]);
}

function getSeatSlots(guests: Guest[], capacity: number): SeatSlot[] {
  const highestSeatIndex = guests.reduce((highest, guest) => {
    return typeof guest.seat_index === "number" ? Math.max(highest, guest.seat_index) : highest;
  }, -1);
  const seatCount = Math.max(capacity, guests.length, highestSeatIndex + 1);
  const seats: SeatSlot[] = Array.from({ length: seatCount }, () => ({ guest: null, isPersisted: false }));
  const unseatedGuests: Guest[] = [];

  guests.forEach((guest) => {
    if (
      typeof guest.seat_index === "number" &&
      guest.seat_index >= 0 &&
      guest.seat_index < seats.length &&
      !seats[guest.seat_index].guest
    ) {
      seats[guest.seat_index] = { guest, isPersisted: true };
      return;
    }

    unseatedGuests.push(guest);
  });

  unseatedGuests.forEach((guest) => {
    const openIndex = seats.findIndex((seat) => !seat.guest);
    if (openIndex >= 0) {
      seats[openIndex] = { guest, isPersisted: false };
    }
  });

  return seats;
}

function getSeatPosition({
  index,
  seatCount,
  isRound,
  tableWidth,
  tableHeight,
  gap,
}: {
  index: number;
  seatCount: number;
  isRound: boolean;
  tableWidth: number;
  tableHeight: number;
  gap: number;
}): SeatPosition {
  if (isRound) {
    const angle = (index / seatCount) * 2 * Math.PI - Math.PI / 2;
    const radius = tableWidth / 2 + gap;
    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px)`,
    };
  }

  const headSeats = seatCount >= 6 ? 2 : 0;
  const sideCapacity = seatCount - headSeats;
  const topSeatsCount = Math.ceil(sideCapacity / 2);
  const bottomSeatsCount = Math.floor(sideCapacity / 2);

  if (headSeats > 0 && index === 0) {
    return {
      left: `calc(50% - ${tableWidth / 2 + gap}px)`,
      top: "50%",
    };
  }

  if (headSeats > 0 && index === 1) {
    return {
      left: `calc(50% + ${tableWidth / 2 + gap}px)`,
      top: "50%",
    };
  }

  const sideIndex = index - headSeats;
  const isTop = sideIndex < topSeatsCount;
  const rowCount = isTop ? topSeatsCount : bottomSeatsCount;
  const rowIndex = isTop ? sideIndex : sideIndex - topSeatsCount;
  const yOffset = isTop ? -tableHeight / 2 - gap : tableHeight / 2 + gap;
  const spacing = tableWidth / (rowCount + 1);
  const xOffset = -tableWidth / 2 + spacing * (rowIndex + 1);

  return {
    left: `calc(50% + ${xOffset}px)`,
    top: `calc(50% + ${yOffset}px)`,
  };
}

type TableSchemaExportLabels = {
  allAssigned: string;
  assignedGuests: string;
  capacity: string;
  dietary: string;
  generatedOn: string;
  guests: string;
  openSeat: string;
  rectangular: string;
  round: string;
  seat: string;
  seats: string;
  shape: string;
  table: string;
  tableOverview: string;
  tableSchema: string;
  totalGuests: string;
  unassigned: string;
};

function buildTableSchemaPrintHtml({
  tables,
  guests,
  labels,
  generatedAt,
}: {
  tables: Table[];
  guests: Guest[];
  labels: TableSchemaExportLabels;
  generatedAt: string;
}) {
  const assignedGuests = guests.filter((guest) => guest.table_id);
  const unassignedGuests = guests.filter((guest) => !guest.table_id);
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

  const getGuestsAtTable = (tableId: string) =>
    guests
      .filter((guest) => guest.table_id === tableId)
      .sort((a, b) => (a.seat_index ?? Number.MAX_SAFE_INTEGER) - (b.seat_index ?? Number.MAX_SAFE_INTEGER));

  const tableCards = tables
    .map((table) => {
      const tableGuests = getGuestsAtTable(table.id);
      const seats = getSeatSlots(tableGuests, table.capacity);
      const isRound = table.shape === "round";
      const tableWidth = isRound ? 116 : 150;
      const tableHeight = isRound ? 116 : 84;
      const shapeLabel = isRound ? labels.round : labels.rectangular;
      const seatNodes = seats
        .map(({ guest }, index) => {
          const { left, top } = getSeatPosition({
            index,
            seatCount: seats.length,
            isRound,
            tableWidth,
            tableHeight,
            gap: 28,
          });
          const guestLabel = guest ? getGuestInitials(guest) : "";
          const guestTitle = guest ? escapeHtml(getGuestName(guest)) : escapeHtml(labels.openSeat);

          return `
            <div class="seat ${guest ? "" : "empty"}" style="left: ${left}; top: ${top};" title="${guestTitle}">
              <strong>${index + 1}</strong>
              <span>${escapeHtml(guestLabel)}</span>
            </div>
          `;
        })
        .join("");

      return `
        <article class="table-card">
          <div class="table-card__heading">
            <div>
              <h3>${escapeHtml(table.name)}</h3>
              <p>${escapeHtml(shapeLabel)} &middot; ${tableGuests.length} / ${table.capacity} ${escapeHtml(labels.seats)}</p>
            </div>
            <span>${escapeHtml(labels.table)}</span>
          </div>
          <div class="schema-map">
            <div class="table-shape ${isRound ? "round" : "rectangular"}" style="width: ${tableWidth}px; height: ${tableHeight}px;">
              <strong>${escapeHtml(table.name)}</strong>
            </div>
            ${seatNodes}
          </div>
        </article>
      `;
    })
    .join("");

  const assignmentRows = tables
    .map((table) => {
      const tableGuests = getGuestsAtTable(table.id);
      const seats = getSeatSlots(tableGuests, table.capacity);
      const shapeLabel = table.shape === "round" ? labels.round : labels.rectangular;

      return seats
        .map(({ guest }, index) => `
          <tr>
            <td>${escapeHtml(table.name)}</td>
            <td>${escapeHtml(shapeLabel)}</td>
            <td>${index + 1}</td>
            <td>${guest ? escapeHtml(getGuestName(guest)) : `<span class="muted">${escapeHtml(labels.openSeat)}</span>`}</td>
            <td>${guest?.dietary ? escapeHtml(guest.dietary) : ""}</td>
          </tr>
        `)
        .join("");
    })
    .join("");

  const unassignedList = unassignedGuests.length
    ? `
      <div class="unassigned-list">
        ${unassignedGuests.map((guest) => `<span>${escapeHtml(getGuestName(guest))}</span>`).join("")}
      </div>
    `
    : `<p class="empty-copy">${escapeHtml(labels.allAssigned)}</p>`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(labels.tableSchema)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #ffffff;
            color: #221f1a;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page { max-width: 980px; margin: 0 auto; }
          .report-header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 1px solid #d8d0c4;
            padding-bottom: 16px;
          }
          h1, h2, h3, p { margin: 0; }
          h1 { font-family: Georgia, "Times New Roman", serif; font-size: 30px; font-weight: 500; }
          h2 { font-size: 15px; margin: 24px 0 10px; }
          h3 { font-size: 15px; font-weight: 700; }
          .generated { color: #686056; text-align: right; white-space: nowrap; }
          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 18px 0 22px;
          }
          .stat {
            border: 1px solid #ded6ca;
            border-radius: 8px;
            padding: 10px;
            background: #fbfaf7;
          }
          .stat strong { display: block; font-size: 18px; }
          .stat span { color: #686056; }
          .schema-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .table-card {
            break-inside: avoid;
            border: 1px solid #ded6ca;
            border-radius: 8px;
            padding: 12px;
            background: #fffdf9;
          }
          .table-card__heading {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
          }
          .table-card__heading p { color: #686056; }
          .table-card__heading span {
            border: 1px solid #ded6ca;
            border-radius: 999px;
            color: #686056;
            padding: 2px 8px;
            font-size: 10px;
          }
          .schema-map {
            position: relative;
            width: 260px;
            height: 224px;
            margin: 8px auto 0;
          }
          .table-shape {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.4px solid #5e554a;
            background: #f3eee6;
            text-align: center;
            padding: 10px;
          }
          .table-shape.round { border-radius: 50%; }
          .table-shape.rectangular { border-radius: 8px; }
          .seat {
            position: absolute;
            transform: translate(-50%, -50%);
            width: 36px;
            min-height: 32px;
            border: 1px solid #b8aa9a;
            border-radius: 999px;
            background: #ffffff;
            color: #5d4037;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 3px;
          }
          .seat.empty { color: #8a8177; background: #f8f5ef; border-style: dashed; }
          .seat strong { display: block; font-size: 8px; line-height: 1; }
          .seat span { display: block; font-size: 10px; font-weight: 700; line-height: 1.1; }
          table {
            width: 100%;
            border-collapse: collapse;
            break-inside: auto;
          }
          thead { display: table-header-group; }
          th, td {
            border-bottom: 1px solid #e5ddd2;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f3eee6;
            color: #5b5249;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0;
          }
          .muted, .empty-copy { color: #776e64; }
          .unassigned-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .unassigned-list span {
            border: 1px solid #ded6ca;
            border-radius: 999px;
            padding: 4px 8px;
            background: #fbfaf7;
          }
          @media print {
            .page { max-width: none; }
            .table-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="report-header">
            <div>
              <h1>${escapeHtml(labels.tableSchema)}</h1>
              <p class="muted">${escapeHtml(labels.tableOverview)}</p>
            </div>
            <p class="generated">${escapeHtml(labels.generatedOn)}<br />${escapeHtml(generatedAt)}</p>
          </header>

          <section class="stats" aria-label="${escapeHtml(labels.tableOverview)}">
            <div class="stat"><strong>${tables.length}</strong><span>${escapeHtml(labels.table)}</span></div>
            <div class="stat"><strong>${totalCapacity}</strong><span>${escapeHtml(labels.capacity)}</span></div>
            <div class="stat"><strong>${assignedGuests.length}</strong><span>${escapeHtml(labels.assignedGuests)}</span></div>
            <div class="stat"><strong>${guests.length}</strong><span>${escapeHtml(labels.totalGuests)}</span></div>
          </section>

          <section>
            <h2>${escapeHtml(labels.tableSchema)}</h2>
            <div class="schema-grid">${tableCards}</div>
          </section>

          <section>
            <h2>${escapeHtml(labels.tableOverview)}</h2>
            <table>
              <thead>
                <tr>
                  <th>${escapeHtml(labels.table)}</th>
                  <th>${escapeHtml(labels.shape)}</th>
                  <th>${escapeHtml(labels.seat)}</th>
                  <th>${escapeHtml(labels.guests)}</th>
                  <th>${escapeHtml(labels.dietary)}</th>
                </tr>
              </thead>
              <tbody>${assignmentRows}</tbody>
            </table>
          </section>

          <section>
            <h2>${escapeHtml(labels.unassigned)} (${unassignedGuests.length})</h2>
            ${unassignedList}
          </section>
        </main>
      </body>
    </html>
  `;
}

function printHtmlDocument(html: string) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "794px";
  frame.style.height = "1123px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument ?? frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    frame.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (frame.isConnected) frame.remove();
    }, 500);
  };

  frameWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => {
      if (frame.isConnected) frame.remove();
    }, 60000);
  }, 150);
}

function DraggableGuest({
  guest,
  selected,
  onSelect,
}: {
  guest: Guest;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className="px-3 py-2.5 rounded-xl cursor-grab select-none transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-3 relative overflow-hidden group"
      style={{
        width: "100%",
        textAlign: "left",
        background: selected ? "var(--primary-container)" : "var(--surface-container-lowest)",
        opacity: isDragging ? 0.3 : 1,
        boxShadow: selected ? "0 10px 24px rgba(26,28,26,0.1)" : "0 2px 8px -2px rgba(0,0,0,0.05)",
        border: selected ? "1px solid rgba(108,91,78,0.42)" : "1px solid rgba(204,198,188,0.2)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--primary)] to-[var(--primary-container)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-[11px] font-bold shadow-sm" style={{ background: "var(--surface-container-highest)", color: "var(--primary)", border: "1px solid rgba(204,198,188,0.3)" }}>
        {getGuestInitials(guest)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
          {guest.first_name} {guest.last_name}
        </p>
        {guest.dietary && (
          <p className="text-[10px] mt-0.5 truncate font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--primary)" }}>
            {guest.dietary}
          </p>
        )}
      </div>
    </button>
  );
}

function SeatButton({
  tableId,
  index,
  guest,
  isPersisted,
  selectedGuestId,
  size,
  position,
  labels,
  onAssignSeat,
}: {
  tableId: string;
  index: number;
  guest: Guest | null;
  isPersisted: boolean;
  selectedGuestId: string | null;
  size: number;
  position: SeatPosition;
  labels: {
    seat: string;
    pendingSeat: string;
  };
  onAssignSeat: (tableId: string, seatIndex: number, seatedGuest: Guest | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: getSeatDropId(tableId, index) });
  const isSelected = selectedGuestId === guest?.id;
  const isOccupiedByOther = Boolean(guest && selectedGuestId && selectedGuestId !== guest.id);

  return (
    <button
      type="button"
      ref={setNodeRef}
      className="absolute flex items-center justify-center rounded-full transition-all duration-300"
      onClick={(event) => {
        event.stopPropagation();
        onAssignSeat(tableId, index, guest);
      }}
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        border: isOver
          ? "2px solid var(--primary)"
          : isSelected
            ? "2px solid var(--primary)"
            : guest
              ? "1px solid rgba(108,91,78,0.34)"
              : "1px solid rgba(26,28,26,0.16)",
        background: isOver
          ? "var(--primary-container)"
          : isSelected
            ? "var(--primary-container)"
            : guest
              ? "var(--surface-container-lowest)"
              : "rgba(250,249,246,0.32)",
        boxShadow: isOver
          ? "0 16px 34px rgba(26,28,26,0.14)"
          : isSelected
            ? "0 14px 32px rgba(26,28,26,0.13)"
            : guest
              ? "0 12px 28px rgba(26,28,26,0.09)"
              : "none",
        color: guest ? "var(--primary)" : "var(--on-surface-variant)",
        cursor: isOccupiedByOther ? "not-allowed" : "pointer",
      }}
      title={
        guest
          ? `${guest.first_name} ${guest.last_name}`
          : `${labels.seat} ${index + 1}`
      }
      aria-label={
        guest
          ? `${labels.seat} ${index + 1}: ${guest.first_name} ${guest.last_name}`
          : `${labels.seat} ${index + 1}`
      }
    >
      {guest ? (
        <span className="flex flex-col items-center leading-none" style={{ fontFamily: "var(--font-work-sans)" }}>
          <span className={size > 50 ? "text-sm font-bold" : "text-[13px] font-bold"}>{getGuestInitials(guest)}</span>
          {!isPersisted && <span className="mt-0.5 text-[8px] font-medium opacity-55">{labels.pendingSeat}</span>}
        </span>
      ) : (
        <span className={size > 50 ? "text-sm font-medium opacity-55 tabular-nums" : "text-xs font-medium opacity-50 tabular-nums"} style={{ fontFamily: "var(--font-work-sans)" }}>
          {index + 1}
        </span>
      )}
    </button>
  );
}

function TableCard({
  table,
  guests,
  zoom,
  onRemove,
  onUnassignGuest,
  onRename,
  onOpen,
  onAssignSeat,
  selectedGuestId,
  labels,
}: {
  table: Table;
  guests: Guest[];
  zoom: number;
  onRemove: () => void;
  onUnassignGuest: (guestId: string) => void;
  onRename: (name: string) => void;
  onOpen: () => void;
  onAssignSeat: (tableId: string, seatIndex: number, seatedGuest: Guest | null) => void;
  selectedGuestId: string | null;
  labels: {
    seats: string;
    seat: string;
    pendingSeat: string;
    dropHere: string;
    remove: string;
    viewEditTable: string;
  };
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({
    id: `${TABLE_DRAG_PREFIX}${table.id}`,
    data: { kind: "table", tableId: table.id },
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(table.name);
  const justDragged = useRef(false);
  const isRound = table.shape === "round";
  const capacity = table.capacity;

  const seats = getSeatSlots(guests, capacity);
  const seatCount = seats.length;

  // Dimensions for the card
  const cardSize = CARD_SIZE;
  const tableWidth = isRound ? 160 : 180;
  const tableHeight = isRound ? 160 : 100;
  const hasConflict = guests.some((g) => g.dietary && g.dietary.length > 0);
  const selectedTableGuest = selectedGuestId ? guests.find((guest) => guest.id === selectedGuestId) ?? null : null;

  useEffect(() => {
    if (isDragging) justDragged.current = true;
  }, [isDragging]);

  const handleOpen = () => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    if (!editing) onOpen();
  };

  return (
    <div
      className="absolute group"
      style={{
        left: `${table.x * zoom}px`,
        top: `${table.y * zoom}px`,
        width: `${cardSize * zoom}px`,
        height: `${cardSize * zoom}px`,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 50 : undefined,
      }}
    >
       <div
         ref={setNodeRef}
         className="absolute left-0 top-0 flex items-center justify-center rounded-2xl transition-colors"
         style={{
           width: `${cardSize}px`,
           height: `${cardSize}px`,
           background: isOver ? "rgba(204,198,188,0.15)" : "transparent",
           transform: `scale(${zoom})`,
           transformOrigin: "top left",
         }}
         onClick={handleOpen}
       >
         {/* Table Shape (drag handle) */}
         <div
           ref={setDragRef}
           {...(editing ? {} : listeners)}
           {...attributes}
           className="relative flex flex-col items-center justify-center transition-all duration-300 touch-none"
           style={{
             width: `${tableWidth}px`,
             height: `${tableHeight}px`,
             borderRadius: isRound ? "50%" : "8px",
             border: isOver ? "2px solid var(--primary)" : "1px solid rgba(0,0,0,0.05)",
             background: "#ffffff",
             boxShadow: "0 12px 32px -4px rgba(26,28,26,0.12), inset 0 0 24px rgba(0,0,0,0.02)",
             cursor: isDragging ? "grabbing" : "grab",
             outline: "none",
           }}
         >
           {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { onRename(name); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { onRename(name); setEditing(false); } }}
                onClick={(e) => e.stopPropagation()}
                className="text-xl bg-transparent outline-none border-b text-center italic transition-colors"
                style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", borderColor: "var(--primary)", width: isRound ? "112px" : "138px" }}
                autoFocus
              />
            ) : (
              <p
                className="text-2xl italic px-3 py-0.5 rounded transition-colors"
                style={{
                  fontFamily: "var(--font-newsreader)",
                  color: "var(--on-surface)",
                  lineHeight: 1.05,
                  maxWidth: isRound ? "118px" : "150px",
                  textAlign: "center",
                  overflowWrap: "break-word",
                }}
                onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
              >
                {table.name}
              </p>
            )}
            
            <p className="text-sm mt-1 tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
              {guests.length} &nbsp;/&nbsp; {capacity}
            </p>
         </div>
         
         {/* Seats */}
         {seats.map(({ guest, isPersisted }, index) => (
           <SeatButton
             key={index}
             tableId={table.id}
             index={index}
             guest={guest}
             isPersisted={isPersisted}
             selectedGuestId={selectedGuestId}
             size={48}
             position={getSeatPosition({
               index,
               seatCount,
               isRound,
               tableWidth,
               tableHeight,
               gap: 32,
             })}
             labels={{ seat: labels.seat, pendingSeat: labels.pendingSeat }}
             onAssignSeat={onAssignSeat}
           />
         ))}

         {selectedTableGuest && (
           <button
             type="button"
             onClick={(event) => {
               event.stopPropagation();
               onUnassignGuest(selectedTableGuest.id);
             }}
             className="absolute z-30 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
             style={{ top: "0px", right: "0px", color: "var(--on-surface-variant)", borderColor: "rgba(204,198,188,0.26)" }}
             aria-label={labels.remove}
             title={labels.remove}
           >
             <Trash2 size={15} strokeWidth={1.6} />
           </button>
         )}
         
         {/* Actions (hover) */}
          <div
            className="absolute flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
            style={{ top: "0px", right: selectedTableGuest ? "38px" : "0px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {hasConflict && (
              <div className="bg-white rounded-full p-1.5 shadow-sm border" style={{ borderColor: "rgba(204,198,188,0.2)" }}>
                <AlertTriangle size={14} strokeWidth={2} style={{ color: "var(--primary)" }} />
              </div>
            )}
            <button
              onClick={onOpen}
              className="p-1.5 rounded-full bg-white hover:bg-[var(--surface-container-low)] transition-colors shadow-sm border"
              style={{ color: "var(--on-surface)", borderColor: "rgba(204,198,188,0.2)" }}
              aria-label={labels.viewEditTable}
            >
              <Pencil size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-full bg-white hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm border"
              style={{ color: "var(--on-surface-variant)", borderColor: "rgba(204,198,188,0.2)" }}
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
       </div>
    </div>
  );
}

function VisualTable({
  table,
  guests,
  capacity,
  shape,
  selectedGuestId,
  onUnassignGuest,
  onAssignSeat,
  labels,
}: {
  table: Table;
  guests: Guest[];
  capacity: number;
  shape: Table["shape"];
  selectedGuestId: string | null;
  onUnassignGuest: (guestId: string) => void;
  onAssignSeat: (tableId: string, seatIndex: number, seatedGuest: Guest | null) => void;
  labels: {
    seat: string;
    pendingSeat: string;
    remove: string;
  };
}) {
  const isRound = shape === "round";
  const seats = getSeatSlots(guests, capacity);
  const seatCount = seats.length;
  const tableWidth = isRound ? 230 : 280;
  const tableHeight = isRound ? 230 : 150;
  const selectedTableGuest = selectedGuestId ? guests.find((guest) => guest.id === selectedGuestId) ?? null : null;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {selectedTableGuest && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onUnassignGuest(selectedTableGuest.id);
          }}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
          style={{ color: "var(--on-surface-variant)", borderColor: "rgba(204,198,188,0.3)" }}
          aria-label={labels.remove}
          title={labels.remove}
        >
          <Trash2 size={16} strokeWidth={1.6} />
        </button>
      )}
      <div
        className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center"
        style={{
          width: `${tableWidth}px`,
          height: `${tableHeight}px`,
          transform: "translate(-50%, -50%)",
          borderRadius: isRound ? "50%" : "12px",
          border: "1px solid rgba(26,28,26,0.42)",
          background: "rgba(250,249,246,0.42)",
        }}
      >
        <p
          className="text-3xl italic text-center px-5"
          style={{
            fontFamily: "var(--font-newsreader)",
            color: "var(--on-surface)",
            lineHeight: 1.05,
            maxWidth: isRound ? "174px" : "230px",
            overflowWrap: "break-word",
          }}
        >
          {table.name}
        </p>
        <p className="mt-2 text-sm tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
          {guests.length} &nbsp;/&nbsp; {capacity}
        </p>
      </div>

      {seats.map(({ guest, isPersisted }, index) => (
        <SeatButton
          key={index}
          tableId={table.id}
          index={index}
          guest={guest}
          isPersisted={isPersisted}
          selectedGuestId={selectedGuestId}
          size={58}
          position={getSeatPosition({
            index,
            seatCount,
            isRound,
            tableWidth,
            tableHeight,
            gap: 50,
          })}
          labels={labels}
          onAssignSeat={onAssignSeat}
        />
      ))}
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
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [tableZoom, setTableZoom] = useState(1);
  const [isTableEditorFullscreen, setIsTableEditorFullscreen] = useState(false);
  const [newTable, setNewTable] = useState<{ name: string; capacity: string; shape: "round" | "rectangular" }>({ name: "", capacity: "8", shape: "round" });
  const [tableForm, setTableForm] = useState<{ name: string; capacity: string; shape: "round" | "rectangular" }>({ name: "", capacity: "8", shape: "round" });

  const { setNodeRef: unassignedRef, isOver: isOverUnassigned } = useDroppable({ id: "unassigned" });

  const load = useCallback(async () => {
    const data = await listTablesAndGuests();
    setGuests(data.guests);

    // Legacy tables were created at (0,0) and would stack. Lay any of them
    // out on a tidy grid and persist so positions stay consistent.
    let legacyIndex = 0;
    const pendingPositions: { id: string; x: number; y: number }[] = [];
    const positionedTables = data.tables.map((table) => {
      if (table.x === 0 && table.y === 0) {
        const slot = gridSlot(legacyIndex);
        legacyIndex += 1;
        pendingPositions.push({ id: table.id, x: slot.x, y: slot.y });
        return { ...table, x: slot.x, y: slot.y };
      }
      return table;
    });

    setTables(positionedTables);
    setLoading(false);

    await Promise.all(
      pendingPositions.map((p) =>
        updateTablePosition(p.id, p.x, p.y).catch(() => undefined)
      )
    );
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isTableEditorFullscreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTableEditorFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTableEditorFullscreen]);

  const unassigned = guests.filter(
    (g) => !g.table_id && `${g.first_name} ${g.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const selectedGuest = selectedGuestId ? guests.find((guest) => guest.id === selectedGuestId) ?? null : null;

  const canvasBounds = tables.reduce(
    (acc, table) => ({
      w: Math.max(acc.w, table.x + CARD_SIZE + CANVAS_PAD),
      h: Math.max(acc.h, table.y + CARD_SIZE + CANVAS_PAD),
    }),
    { w: 960, h: 560 }
  );

  function guestsAtTable(tableId: string) {
    return guests
      .filter((g) => g.table_id === tableId)
      .sort((a, b) => (a.seat_index ?? Number.MAX_SAFE_INTEGER) - (b.seat_index ?? Number.MAX_SAFE_INTEGER));
  }

  function firstOpenSeatIndex(tableId: string, guestId: string) {
    const table = tables.find((t) => t.id === tableId);
    const tableGuests = guests.filter((g) => g.table_id === tableId && g.id !== guestId);
    const seats = getSeatSlots(tableGuests, table?.capacity ?? 1);
    const openIndex = seats.findIndex((seat) => !seat.guest);
    return openIndex >= 0 ? openIndex : seats.length;
  }

  function guestInSeat(tableId: string, seatIndex: number) {
    return guests.find((guest) => guest.table_id === tableId && guest.seat_index === seatIndex) ?? null;
  }

  function selectGuest(guestId: string) {
    setSelectedGuestId((current) => (current === guestId ? null : guestId));
  }

  async function moveGuestToSeat(guestId: string, tableId: string | null, seatIndex: number | null) {
    const previousGuests = guests;
    setGuests((prev) =>
      prev.map((guest) =>
        guest.id === guestId ? { ...guest, table_id: tableId, seat_index: tableId ? seatIndex : null } : guest
      )
    );
    setSelectedGuestId(null);

    try {
      await assignGuestTable(guestId, tableId, tableId ? seatIndex : null);
    } catch {
      setGuests(previousGuests);
      await load();
    }
  }

  async function moveTable(tableId: string, deltaX: number, deltaY: number) {
    const current = tables.find((tb) => tb.id === tableId);
    if (!current) return;
    const nextX = Math.max(0, Math.round(current.x + deltaX / tableZoom));
    const nextY = Math.max(0, Math.round(current.y + deltaY / tableZoom));
    if (nextX === current.x && nextY === current.y) return;

    const previousTables = tables;
    setTables((prev) =>
      prev.map((tb) => (tb.id === tableId ? { ...tb, x: nextX, y: nextY } : tb))
    );

    try {
      await updateTablePosition(tableId, nextX, nextY);
    } catch {
      setTables(previousTables);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggedGuest(null);

    if (active.data.current?.kind === "table") {
      const tableId = String(active.data.current.tableId);
      await moveTable(tableId, event.delta.x, event.delta.y);
      return;
    }

    if (!over) return;

    const guestId = String(active.id);
    const destination = String(over.id);
    const seatDrop = parseSeatDropId(destination);
    const tableId = seatDrop?.tableId ?? (destination === "unassigned" ? null : destination);
    const seatIndex = tableId ? seatDrop?.seatIndex ?? firstOpenSeatIndex(tableId, guestId) : null;
    const seatedGuest = tableId && typeof seatIndex === "number" ? guestInSeat(tableId, seatIndex) : null;

    if (seatedGuest && seatedGuest.id !== guestId) {
      setSelectedGuestId(seatedGuest.id);
      return;
    }

    await moveGuestToSeat(guestId, tableId, seatIndex);
  }

  async function addTable() {
    const slot = gridSlot(tables.length);
    const data = await createTable({
      name: newTable.name || `${t.seating.table} ${tables.length + 1}`,
      capacity: parseInt(newTable.capacity, 10),
      shape: newTable.shape,
      x: slot.x,
      y: slot.y,
    });
    setTables((prev) => [...prev, data]);
    setShowAddTable(false);
    setNewTable({ name: "", capacity: "8", shape: "round" });
  }

  async function removeTable(id: string) {
    await deleteTable(id);
    setGuests((prev) => prev.map((g) => (g.table_id === id ? { ...g, table_id: null, seat_index: null } : g)));
    setTables((prev) => prev.filter((t) => t.id !== id));
    setRemoveTarget(null);
  }

  async function renameTable(id: string, name: string) {
    await renameTableAction(id, name);
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  async function unassignGuest(guestId: string) {
    await moveGuestToSeat(guestId, null, null);
  }

  async function assignSelectedGuestToSeat(tableId: string, seatIndex: number, seatedGuest: Guest | null) {
    if (!selectedGuestId) {
      if (seatedGuest) selectGuest(seatedGuest.id);
      return;
    }

    if (seatedGuest && seatedGuest.id !== selectedGuestId) {
      setSelectedGuestId(seatedGuest.id);
      return;
    }

    await moveGuestToSeat(selectedGuestId, tableId, seatIndex);
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

  function shapeLabel(shape: Table["shape"]) {
    return shape === "round" ? t.seating.round : t.seating.rectangular;
  }

  function adjustTableZoom(direction: 1 | -1) {
    setTableZoom((current) => Math.min(1.4, Math.max(0.7, Number((current + direction * 0.1).toFixed(2)))));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function exportTableSchemaPdf() {
    const generatedAt = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

    const html = buildTableSchemaPrintHtml({
      tables,
      guests,
      generatedAt,
      labels: {
        allAssigned: t.seating.allAssigned,
        assignedGuests: t.seating.assignedGuests,
        capacity: t.seating.capacity,
        dietary: t.guests.dietary,
        generatedOn: t.seating.generatedOn,
        guests: t.seating.guests,
        openSeat: t.seating.openSeat,
        rectangular: t.seating.rectangular,
        round: t.seating.round,
        seat: t.seating.seat,
        seats: t.seating.seats,
        shape: t.seating.shape,
        table: t.seating.table,
        tableOverview: t.seating.tableOverview,
        tableSchema: t.seating.tableSchema,
        totalGuests: t.seating.totalGuests,
        unassigned: t.seating.unassigned,
      },
    });

    printHtmlDocument(html);
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>{t.common.loading}</div>;

  return (
    <div>
      <ModuleHeader
        title={t.seating.title}
        subtitle={t.seating.subtitle}
        actions={
          <>
            <button
              type="button"
              onClick={exportTableSchemaPdf}
              disabled={tables.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--surface-container)] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}
            >
              <Download size={14} strokeWidth={1.5} /> {t.seating.exportPdf}
            </button>
            <button
              type="button"
              onClick={() => setShowAddTable(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
            >
              <Plus size={14} strokeWidth={1.5} /> {t.seating.addTable}
            </button>
          </>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={(e) => {
          const guest = guests.find((g) => g.id === e.active.id);
          setDraggedGuest(guest ?? null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 items-start gap-4 xl:block xl:pr-20">
          {/* Tables canvas */}
          <div
            className={`${isTableEditorFullscreen ? "fixed inset-0 z-[210] h-screen min-h-screen rounded-none p-6 sm:p-10" : "min-w-0 h-[calc(100vh-180px)] min-h-[640px] rounded-2xl p-10"} relative overflow-auto shadow-inner border`}
            style={{ 
              background: "url('/images/noise.png'), linear-gradient(135deg, var(--surface-container-low), #e0d9cc)",
              backgroundRepeat: "repeat",
              borderColor: "rgba(204,198,188,0.3)"
            }}
          >
            <div
              className="sticky right-0 top-0 z-30 ml-auto mb-3 flex w-fit items-center gap-1 rounded-xl border px-1.5 py-1.5 shadow-sm backdrop-blur-md"
              style={{
                background: "rgba(250,249,246,0.86)",
                borderColor: "rgba(204,198,188,0.38)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-work-sans)",
              }}
            >
              <button
                type="button"
                onClick={() => adjustTableZoom(-1)}
                disabled={tableZoom <= 0.7}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-container-low)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={t.seating.zoomOut}
                title={t.seating.zoomOut}
              >
                <ZoomOut size={16} strokeWidth={1.6} />
              </button>
              <span className="min-w-12 text-center text-xs font-bold tabular-nums">
                {Math.round(tableZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => adjustTableZoom(1)}
                disabled={tableZoom >= 1.4}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-container-low)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={t.seating.zoomIn}
                title={t.seating.zoomIn}
              >
                <ZoomIn size={16} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={() => setTableZoom(1)}
                disabled={tableZoom === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-container-low)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={t.seating.resetZoom}
                title={t.seating.resetZoom}
              >
                <RotateCcw size={15} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={() => setIsTableEditorFullscreen((current) => !current)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-container-low)]"
                aria-label={isTableEditorFullscreen ? t.seating.exitFullScreen : t.seating.fullScreen}
                title={isTableEditorFullscreen ? t.seating.exitFullScreen : t.seating.fullScreen}
              >
                {isTableEditorFullscreen ? <Minimize2 size={16} strokeWidth={1.6} /> : <Maximize2 size={16} strokeWidth={1.6} />}
              </button>
            </div>
            {tables.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-xl max-w-sm">
                  <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg rotate-3">
                    <Plus size={32} strokeWidth={1.5} />
                  </div>
                  <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.5rem", fontWeight: "bold" }}>{t.seating.noTablesTitle}</p>
                  <p className="mt-2 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>{t.seating.noTablesSubtitle}</p>
                  <button
                    onClick={() => setShowAddTable(true)}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-transform hover:-translate-y-0.5 shadow-md"
                    style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
                  >
                    {t.seating.addTable}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="relative mx-auto"
                style={{
                  width: `${canvasBounds.w * tableZoom}px`,
                  height: `${canvasBounds.h * tableZoom}px`,
                }}
              >
                {tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    guests={guestsAtTable(table.id)}
                    zoom={tableZoom}
                    onRemove={() => setRemoveTarget(table.id)}
                    onUnassignGuest={unassignGuest}
                    onRename={(name) => renameTable(table.id, name)}
                    onOpen={() => openTable(table)}
                    onAssignSeat={assignSelectedGuestToSeat}
                    selectedGuestId={selectedGuestId}
                    labels={{
                      seats: t.seating.seats,
                      seat: t.seating.seat,
                      pendingSeat: t.seating.pendingSeat,
                      dropHere: t.seating.dropHere,
                      remove: t.seating.remove,
                      viewEditTable: t.seating.viewEditTable,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unassigned sidebar */}
          <div
            className="group relative h-[calc(100vh-180px)] min-h-[640px] rounded-2xl flex flex-col border xl:fixed xl:right-6 xl:top-6 xl:bottom-6 xl:z-30 xl:h-auto xl:min-h-0 xl:w-14 xl:hover:w-72 xl:transition-[width] xl:duration-300 xl:overflow-hidden"
            style={{ background: "var(--surface-container-lowest)", borderColor: "rgba(204,198,188,0.2)", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}
          >
            {/* Collapsed icon strip — xl only, fades out on hover */}
            <div className="hidden xl:flex xl:group-hover:opacity-0 xl:group-hover:pointer-events-none absolute inset-0 flex-col items-center justify-start pt-6 gap-3 transition-opacity duration-150 z-10">
              <Users size={20} strokeWidth={1.5} style={{ color: "var(--on-surface-variant)" }} />
              <div className="px-1.5 py-0.5 rounded-md text-xs font-bold tabular-nums" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}>
                {unassigned.length}
              </div>
            </div>

            {/* Full content — always visible on mobile, fades in on xl hover */}
            <div className="flex-1 flex flex-col overflow-hidden xl:opacity-0 xl:group-hover:opacity-100 xl:transition-opacity xl:duration-200 xl:min-w-[18rem]">
              <div className="p-5 border-b flex-shrink-0" style={{ borderColor: "rgba(204,198,188,0.2)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-bold" style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}>
                    {t.seating.unassigned}
                  </p>
                  <div className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}>
                    {unassigned.length}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors focus-within:ring-1 focus-within:ring-[var(--primary)] border" style={{ background: "var(--surface-container-low)", borderColor: "rgba(204,198,188,0.2)" }}>
                  <Search size={16} strokeWidth={2} style={{ color: "var(--on-surface-variant)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.seating.searchPlaceholder}
                    className="flex-1 bg-transparent text-sm outline-none font-medium placeholder-opacity-60"
                    style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
                  />
                </div>
              </div>

              <div
                ref={unassignedRef}
                className="flex-1 overflow-auto p-4 space-y-2.5 transition-colors"
                style={{ background: isOverUnassigned ? "rgba(204,198,188,0.1)" : "transparent" }}
              >
                {selectedGuest && (
                  <div className="mb-3 rounded-xl border px-3 py-2 text-xs" style={{ background: "var(--primary-container)", borderColor: "rgba(108,91,78,0.24)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}>
                    {t.seating.assigning}: {selectedGuest.first_name} {selectedGuest.last_name}
                  </div>
                )}
                {unassigned.map((g) => (
                  <DraggableGuest key={g.id} guest={g} selected={selectedGuestId === g.id} onSelect={() => selectGuest(g.id)} />
                ))}
                {unassigned.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Users size={32} strokeWidth={1} style={{ color: "var(--on-surface-variant)", marginBottom: "12px" }} />
                    <p className="text-sm italic text-center font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                      {t.seating.allAssigned}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {draggedGuest && (
            <div
              className="px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 cursor-grabbing"
              style={{ 
                background: "var(--primary)", 
                fontFamily: "var(--font-work-sans)", 
                color: "white",
                transform: "rotate(-3deg) scale(1.05)",
              }}
            >
              <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-[11px] font-bold shadow-sm" style={{ background: "rgba(255,255,255,0.2)" }}>
                {getGuestInitials(draggedGuest)}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-semibold truncate text-white">
                  {draggedGuest.first_name} {draggedGuest.last_name}
                </p>
                {draggedGuest.dietary && (
                  <p className="text-[10px] mt-0.5 truncate opacity-90 font-medium">
                    {draggedGuest.dietary}
                  </p>
                )}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {tables.length > 0 && (
        <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(204,198,188,0.25)" }}>
            <Users size={15} strokeWidth={1.5} style={{ color: "var(--on-surface-variant)" }} />
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
              {t.seating.tableOverview}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr style={{ background: "var(--surface-container-low)" }}>
                  {[t.seating.table, t.seating.shape, t.seating.seats, t.seating.guests, t.seating.open].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
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
        <Overlay title={editTable.name} onClose={() => setEditTable(null)} width="max-w-[900px]">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            <div className="flex flex-col gap-6">
              {/* Settings Card */}
              <div className="p-5 rounded-2xl border" style={{ background: "var(--surface-container-lowest)", borderColor: "rgba(204,198,188,0.35)", boxShadow: "var(--shadow-ambient)" }}>
                <p className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>Table Settings</p>
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
                  <button onClick={saveTable} className="w-full mt-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-transform hover:-translate-y-0.5 shadow-sm" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}>
                    {t.seating.saveTable}
                  </button>
                </div>
              </div>

              {/* Guest List summary */}
              <div className="p-5 rounded-2xl border flex-1" style={{ background: "var(--surface-container-lowest)", borderColor: "rgba(204,198,188,0.35)", boxShadow: "var(--shadow-ambient)", maxHeight: "300px", display: "flex", flexDirection: "column" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                    {t.seating.guestsAtTable}
                  </p>
                  <p className="text-xs font-medium tabular-nums px-2 py-0.5 rounded-full" style={{ background: "var(--surface-container-low)", fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                    {guestsAtTable(editTable.id).length} / {tableForm.capacity || editTable.capacity}
                  </p>
                </div>
                
                <div className="flex-1 overflow-auto pr-1">
                  {guestsAtTable(editTable.id).length === 0 ? (
                    <p className="text-xs mt-2 italic" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                      {t.seating.noGuestsAssignedYet}
                    </p>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {guestsAtTable(editTable.id).map((guest) => (
                        <button
                          type="button"
                          key={guest.id}
                          onClick={() => selectGuest(guest.id)}
                          className="group flex w-full items-center justify-between gap-2 p-2 rounded-lg text-left transition-colors hover:bg-[var(--surface-container-low)]"
                          style={{ background: selectedGuestId === guest.id ? "var(--primary-container)" : "transparent" }}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--surface-container-highest)", color: "var(--primary)", border: "1px solid rgba(204,198,188,0.4)" }}>
                               {getGuestInitials(guest)}
                             </div>
                             <div className="min-w-0">
                               <p className="text-xs font-medium truncate" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>{guest.first_name} {guest.last_name}</p>
                             </div>
                          </div>
                          <span className="text-[10px] tabular-nums" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                            {typeof guest.seat_index === "number" ? guest.seat_index + 1 : "-"}
                          </span>
                          <span onClick={(event) => { event.stopPropagation(); unassignGuest(guest.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[var(--secondary-container)] transition-all" style={{ color: "var(--on-surface-variant)" }} title={t.seating.remove}>
                             <Trash2 size={12} strokeWidth={1.5} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Table Editor */}
            <div className="rounded-2xl border flex items-center justify-center relative overflow-hidden" style={{ background: "var(--surface-container-lowest)", borderColor: "rgba(204,198,188,0.35)", minHeight: "500px", boxShadow: "inset 0 2px 20px rgba(0,0,0,0.02)" }}>
               <VisualTable 
                 table={editTable} 
                 guests={guestsAtTable(editTable.id)} 
                 capacity={parseInt(tableForm.capacity, 10) || editTable.capacity} 
                 shape={tableForm.shape as "round" | "rectangular"} 
                 selectedGuestId={selectedGuestId}
                 onUnassignGuest={unassignGuest}
                 onAssignSeat={assignSelectedGuestToSeat}
                 labels={{
                   seat: t.seating.seat,
                   pendingSeat: t.seating.pendingSeat,
                   remove: t.seating.remove,
                 }}
               />
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
