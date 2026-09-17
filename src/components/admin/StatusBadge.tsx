export type StatusTone = "gold" | "negocio" | "done" | "danger" | "neutral";

const TONE_STYLES: Record<StatusTone, string> = {
  gold: "border-gold-600/40 bg-gold-500/15 text-gold-600",
  negocio: "border-negocio/40 bg-negocio/15 text-negocio",
  done: "border-status-done/40 bg-status-done/15 text-status-done",
  danger: "border-red-500/40 bg-red-500/15 text-red-500",
  neutral: "border-ink/15 bg-cream-200 text-ink",
};

export default function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
