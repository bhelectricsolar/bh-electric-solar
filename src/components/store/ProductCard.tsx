"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { useCart, buildSingleItemWhatsappUrl } from "@/lib/cart-context";
import { formatUSD, formatARS } from "@/lib/currency";

export default function ProductCard({
  product,
  exchangeRate,
}: {
  product: Product;
  exchangeRate: number;
}) {
  const { addItem } = useCart();
  const arsPrice = product.priceARS ?? product.priceUSD * exchangeRate;
  const lowStock = product.stock > 0 && product.stock <= 8;
  const outOfStock = product.stock <= 0;

  return (
    <article className="premium-card group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white transition-all hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_30px_60px_-25px_rgba(245,154,31,0.35)]">
      <Link href={`/tienda/${product.slug}`} className="block">
        <div
          className={`relative flex h-44 items-start justify-between overflow-hidden p-3 transition-transform duration-500 group-hover:scale-[1.03] ${
            product.images?.[0] ? "bg-cream-100" : `bg-gradient-to-br ${product.gradient}`
          }`}
        >
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          )}
          <span className="relative rounded-full bg-navy-950/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {CATEGORY_LABELS[product.category]}
          </span>
          {lowStock && (
            <span className="relative rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              Últimas unidades
            </span>
          )}
          {outOfStock && (
            <span className="relative rounded-full bg-navy-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Sin stock
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="text-base font-bold leading-snug text-ink transition-colors group-hover:text-navy-800">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-body">
          {product.shortDescription}
        </p>

        <div className="mt-4 rounded-xl bg-cream-100 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-data text-xl font-extrabold text-ink">
              {formatUSD(product.priceUSD)}
            </span>
            <span className="font-data text-xs font-medium text-body">
              {formatARS(arsPrice)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-body/70">
            Precio de contado · pesos estimado al dólar blue
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            disabled={outOfStock}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-ink/20"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Agregar
          </button>
          <a
            href={buildSingleItemWhatsappUrl(product, 1)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Comprar por WhatsApp"
            onClick={(e) => outOfStock && e.preventDefault()}
            className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-lg border transition-colors ${
              outOfStock
                ? "pointer-events-none border-ink/10 text-ink/20"
                : "border-[#25D366]/30 bg-[#25D366]/10 text-[#1da851] hover:bg-[#25D366]/20"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.35a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.38 1.3-1.9 1.35-.5.06-1 .27-3.36-.7-2.83-1.16-4.64-4.02-4.78-4.2-.14-.19-1.14-1.51-1.14-2.89s.71-2.05.97-2.33c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.4-.07.63.47.24.57.8 1.98.87 2.12.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.64-.14.26.09 1.66.79 1.95.93.29.14.48.21.55.33.07.12.07.7-.17 1.38z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

const CATEGORY_LABELS: Record<Product["category"], string> = {
  paneles: "Paneles solares",
  inversores: "Inversores",
  baterias: "Baterías",
  estructuras: "Estructuras",
  accesorios: "Accesorios",
};
