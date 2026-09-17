"use client";

export type ChipTone = "neutral" | "gold" | "negocio" | "done" | "danger";

const ACTIVE_STYLES: Record<ChipTone, string> = {
  neutral: "border-navy-900 bg-navy-900 text-white shadow-[0_4px_14px_-4px_rgba(12,24,48,0.45)]",
  gold: "border-gold-600 bg-gold-500 text-navy-950 shadow-[0_4px_14px_-4px_rgba(245,154,31,0.5)]",
  negocio: "border-negocio bg-negocio text-white shadow-[0_4px_14px_-4px_rgba(29,84,201,0.5)]",
  done: "border-status-done bg-status-done text-white shadow-[0_4px_14px_-4px_rgba(26,125,74,0.5)]",
  danger: "border-red-500 bg-red-500 text-white shadow-[0_4px_14px_-4px_rgba(239,68,68,0.5)]",
};

export default function Chip({
  active,
  onClick,
  children,
  tone = "neutral",
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: ChipTone;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`cursor-pointer touch-manipulation rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? ACTIVE_STYLES[tone]
          : "border-ink/15 bg-surface text-body shadow-sm hover:border-ink/25 hover:text-ink hover:shadow-md"
      }`}
    >
      {children}
    </button>
  );
}
