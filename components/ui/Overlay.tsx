"use client";

import { useEffect, type ReactNode } from "react";

import { CloseIcon } from "@/components/ui/icons";

type OverlayProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
};

type ConfirmOverlayProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function Overlay({ title, onClose, children, width = "max-w-xl" }: OverlayProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <button
        type="button"
        className="fixed inset-0 h-full w-full cursor-default"
        style={{ background: "rgba(250, 249, 246, 0.86)", backdropFilter: "blur(18px)" }}
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-6 sm:px-6">
        <div
          className={`relative w-full ${width} rounded-2xl p-5 sm:p-6`}
          style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2
              id="overlay-title"
              className="text-2xl font-light leading-tight"
              style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmOverlay({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmOverlayProps) {
  return (
    <Overlay title={title} onClose={onCancel} width="max-w-md">
      <p className="text-sm leading-6" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-container-low)]"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            background: destructive ? "#7f3f36" : "var(--primary)",
            color: "white",
            fontFamily: "var(--font-work-sans)",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}
