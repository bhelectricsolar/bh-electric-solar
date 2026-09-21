import { BENEFIT_CARDS } from "@/lib/benefitsData";

// Tarjetas fijas: cada una muestra a la vez el problema de hoy y lo que se
// resuelve con energía solar. Sin rotación automática ni elementos que
// cambien solos.
export default function BenefitCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {BENEFIT_CARDS.map((card) => (
        <article
          key={card.title}
          className="premium-card flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(12,26,56,0.35)]"
        >
          <h3 className="text-lg font-extrabold text-ink">{card.title}</h3>

          <div className="mt-4 flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-500">Sin energía solar</p>
              <p className="mt-0.5 text-sm leading-relaxed text-body">{card.problem}</p>
            </div>
          </div>

          <div className="my-4 h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent" />

          <div className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">Con BH Electric Solar</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink">{card.solution}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
