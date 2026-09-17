"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { formatUSD } from "@/lib/currency";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_15px_35px_-25px_rgba(12,24,48,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(245,154,31,0.3)]">
      <Link href={`/tienda/${product.slug}`} className="block">
        <div
          className={`flex h-40 items-end justify-end overflow-hidden bg-gradient-to-br p-3 transition-transform duration-500 group-hover:scale-105 ${product.gradient}`}
        >
          {product.stock <= 8 && (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              Últimas unidades
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="text-base font-bold leading-snug text-ink">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 text-sm leading-relaxed text-body">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-data text-lg font-semibold text-ink">
            {formatUSD(product.priceUSD)}
          </span>
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
