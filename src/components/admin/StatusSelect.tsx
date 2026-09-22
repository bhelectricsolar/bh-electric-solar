"use client";

import { useEffect, useRef, useState } from "react";
import type { StatusTone } from "./StatusBadge";

const DOT: Record<StatusTone, string> = {
  gold: "bg-gold-500",
  negocio: "bg-negocio",
  done: "bg-status-done",
  danger: "bg-red-500",
  neutral: "bg-ink/40",
};

export type StatusOption<T extends string> = { value: T; label: string; tone: StatusTone; hint?: string };

// Selector desplegable compacto para cambiar un estado (pedido, etapa de
// proyecto, etc.) sin ocupar una fila entera de botones.
export default function StatusSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
}: {
  value: T;
  options: StatusOption<T>[];
  onChange: (v: T) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block text-left ${className}`}>
      {label && <span className="mb-1 block text-xs font-semibold text-body">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer touch-manipulation items-center gap-2 rounded-lg border border-ink/15 bg-surface py-2.5 pl-3 pr-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md sm:w-auto"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[current.tone]}`} />
        <span className="flex-1 text-left sm:flex-none">{current.label}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-body transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-ink/10 bg-surface py-1.5 shadow-[0_18px_40px_-14px_rgba(12,24,48,0.35)] sm:left-auto sm:w-64">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer touch-manipulation items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-cream-200 ${
                o.value === value ? "font-bold text-ink" : "text-body"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[o.tone]}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{o.label}</span>
                {o.hint && <span className="block truncate text-[11px] font-normal text-body/80">{o.hint}</span>}
              </span>
              {o.value === value && (
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-600" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
