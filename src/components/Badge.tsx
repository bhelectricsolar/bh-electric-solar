export default function Badge({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] ${
        tone === "dark" ? "text-gold-300" : "text-gold-600"
      }`}
    >
      <span
        className={`h-px w-7 ${tone === "dark" ? "bg-gold-400" : "bg-gold-500"}`}
      />
      {children}
    </span>
  );
}
