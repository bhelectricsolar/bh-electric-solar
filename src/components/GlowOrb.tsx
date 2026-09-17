export default function GlowOrb({
  className = "",
  color = "#f59a1f",
  size = 480,
  opacity = 0.5,
  blur = "blur-2xl",
}: {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
  blur?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-10 hidden rounded-full sm:block ${blur} ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${color}${Math.round(
          opacity * 255,
        )
          .toString(16)
          .padStart(2, "0")}, ${color}00 72%)`,
      }}
    />
  );
}
