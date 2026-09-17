import Link from "next/link";
import Badge from "./Badge";
import CornerFrame from "./CornerFrame";
import GlowOrb from "./GlowOrb";

const MONTH_BARS = [38, 52, 61, 70, 84, 94];

const PROOF_STATS = [
  { value: "1.2–80", unit: "kWp", label: "Rango de sistemas dimensionados" },
  { value: "6", unit: "regiones", label: "De AMBA a Patagonia" },
  { value: "90%", unit: "máx.", label: "Reducción posible de factura" },
];

export default function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-background px-4 pb-16 pt-14 sm:pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <GlowOrb color="#f59a1f" size={560} opacity={0.55} className="-left-20 -top-20" />
      <GlowOrb color="#2a4a8a" size={640} opacity={0.6} className="-right-24 top-0" />
      <GlowOrb color="#f59a1f" size={420} opacity={0.4} className="bottom-0 left-1/3" />

      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="text-center lg:text-left">
          <Badge>Especialistas en energía solar en Misiones</Badge>

          <h1 className="balance mt-5 text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            Transformamos tu consumo en{" "}
            <span className="text-gold-500">energía limpia.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-body sm:text-lg lg:mx-0">
            Diseñamos e instalamos sistemas de energía solar fotovoltaica para
            empresas, hogares e industrias, ayudándote a reducir costos y a
            construir un futuro más sostenible.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/contacto"
              className="rounded-lg bg-navy-900 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_15px_40px_-12px_rgba(12,24,48,0.55)] transition-all hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-[0_20px_45px_-12px_rgba(12,24,48,0.65)]"
            >
              Solicitar Asesoramiento Gratuito
            </Link>
            <Link
              href="/calculadora-solar"
              className="rounded-lg border border-ink/15 px-6 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-ink/30"
            >
              Usar Calculadora Solar
            </Link>
          </div>
        </div>

        <div className="relative">
          <GlowOrb color="#f59a1f" size={420} opacity={0.6} className="-right-16 -top-16" />
          <GlowOrb color="#2a4a8a" size={320} opacity={0.45} className="-bottom-16 -left-10" />

          <CornerFrame className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_30px_70px_-25px_rgba(12,24,48,0.4)] backdrop-blur-md sm:backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-body">
                Ejemplo de estimación
              </span>
              <span className="rounded-full bg-cream-100 px-3 py-1 text-[11px] font-semibold text-ink">
                NEA · Misiones
              </span>
            </div>

            <p className="mt-4 text-xs font-medium text-body">
              Ahorro mensual estimado
            </p>
            <p className="font-data mt-1 text-4xl font-semibold text-ink sm:text-5xl">
              $52.360
            </p>

            <div className="mt-6 flex h-24 items-end gap-2">
              {MONTH_BARS.map((value, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-t-[3px] ${
                    index === MONTH_BARS.length - 1
                      ? "bg-gold-500 shadow-[0_0_18px_rgba(245,154,31,0.6)]"
                      : "bg-navy-900/10"
                  }`}
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-ink/10 pt-5">
              <div>
                <p className="font-data text-sm font-semibold text-ink">3.2 kWp</p>
                <p className="text-[11px] text-body">Sistema</p>
              </div>
              <div>
                <p className="font-data text-sm font-semibold text-ink">6</p>
                <p className="text-[11px] text-body">Paneles</p>
              </div>
              <div>
                <p className="font-data text-sm font-semibold text-ink">70%</p>
                <p className="text-[11px] text-body">Cobertura</p>
              </div>
            </div>

            <Link
              href="/calculadora-solar"
              className="mt-6 flex items-center justify-center gap-1.5 rounded-lg bg-cream-100 py-3 text-sm font-semibold text-ink transition-colors hover:bg-cream-200"
            >
              Calculá el tuyo →
            </Link>
          </CornerFrame>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 border-t border-ink/10 pt-8 sm:grid-cols-3">
        {PROOF_STATS.map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-2">
            <span className="font-data text-2xl font-semibold text-ink">
              {stat.value}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
              {stat.unit}
            </span>
            <span className="ml-auto max-w-[10rem] text-right text-xs leading-snug text-body">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
