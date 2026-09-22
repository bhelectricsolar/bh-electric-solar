"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart, buildSingleItemWhatsappUrl } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, closeCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [going, setGoing] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  // Va directo al pedido con este producto ya cargado, sin pasar por el carrito.
  function handleBuyNow() {
    setGoing(true);
    addItem(product, qty);
    closeCart();
    router.push("/tienda/checkout");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex items-center justify-center rounded-lg border border-ink/10">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-12 w-12 cursor-pointer touch-manipulation place-items-center text-lg text-ink"
            aria-label="Restar cantidad"
          >
            −
          </button>
          <span className="font-data w-10 text-center text-base">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="grid h-12 w-12 cursor-pointer touch-manipulation place-items-center text-lg text-ink"
            aria-label="Sumar cantidad"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock || going}
          className="flex-1 rounded-lg bg-gold-500 px-6 py-3.5 text-sm font-bold text-navy-950 shadow-[0_15px_40px_-12px_rgba(245,154,31,0.5)] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-ink/20 disabled:text-ink/30 disabled:shadow-none"
        >
          {going ? "Yendo al pedido…" : "Comprar ahora"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="rounded-lg border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
      >
        {added ? "✓ Agregado al carrito" : "Agregar al carrito"}
      </button>
      <a
        href={buildSingleItemWhatsappUrl(product, qty)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => outOfStock && e.preventDefault()}
        className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold transition-all ${
          outOfStock
            ? "pointer-events-none bg-ink/10 text-ink/30"
            : "bg-[#25D366] text-white shadow-[0_15px_35px_-15px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 hover:brightness-105"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.35a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.38 1.3-1.9 1.35-.5.06-1 .27-3.36-.7-2.83-1.16-4.64-4.02-4.78-4.2-.14-.19-1.14-1.51-1.14-2.89s.71-2.05.97-2.33c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.4-.07.63.47.24.57.8 1.98.87 2.12.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.64-.14.26.09 1.66.79 1.95.93.29.14.48.21.55.33.07.12.07.7-.17 1.38z" />
        </svg>
        Comprar ahora por WhatsApp
      </a>
    </div>
  );
}
