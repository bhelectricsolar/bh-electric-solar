import Link from "next/link";
import { getPublishedProducts, type Product } from "@/lib/products";
import { formatUSD } from "@/lib/currency";

const CHIPS = [
  ["Kits solares", "Todo incluido"],
  ["Paneles", "Desde 100 W"],
  ["Inversores", "On-grid e híbridos"],
  ["Baterías", "Litio y gel"],
] as const;

// Mini hero que lleva a la gente a la tienda: propuesta corta + 3 productos
// reales (kits primero) con foto y precio.
export default async function StoreMiniHero() {
  let featured: Product[] = [];
  try {
    const all = await getPublishedProducts();
    const kits = all.filter((p) => p.category === "kits" && p.images?.[0]);
    const rest = all.filter((p) => p.category !== "kits" && p.images?.[0] && ["paneles", "inversores", "baterias"].includes(p.category));
    featured = [...kits.slice(0, 2), ...rest.slice(0, 1), ...kits.slice(2)].slice(0, 3);
  } catch {
    featured = [];
  }

  return (
    <section className="relative isolate overflow-hidden bg-navy-950 px-4 py-14 text-white sm:py-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#2a4a8a]/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-300">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> Tienda online
          </span>
          <h2 className="balance mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Equipos solares listos para instalar, con envío a todo el país.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70 lg:mx-0">
            Paneles, inversores, baterías y kits completos. Elegí, dejá tus datos y coordinamos el pago y el envío
            con vos.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/tienda"
              className="rounded-xl bg-gold-500 px-7 py-3.5 text-center text-sm font-extrabold text-navy-950 shadow-[0_15px_35px_-12px_rgba(245,154,31,0.7)] transition-all hover:brightness-105 hover:shadow-[0_0_30px_rgba(245,154,31,0.55)]"
            >
              Ir a la tienda →
            </Link>
            <Link
              href="/tienda"
              className="rounded-xl border border-white/25 px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver kits solares
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {CHIPS.map(([t, s]) => (
              <span key={t} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs">
                <b className="text-white">{t}</b> <span className="text-white/60">· {s}</span>
              </span>
            ))}
          </div>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/tienda/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-[0_25px_50px_-25px_rgba(245,154,31,0.5)]"
              >
                <div className="aspect-square overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</p>
                  <p className="font-data mt-1.5 text-base font-extrabold text-gold-400">{formatUSD(p.priceUSD)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
