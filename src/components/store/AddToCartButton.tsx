"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
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
        onClick={handleAdd}
        className="flex-1 rounded-lg bg-navy-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_15px_40px_-12px_rgba(12,24,48,0.55)] transition-all hover:-translate-y-0.5 hover:bg-navy-800"
      >
        {added ? "✓ Agregado al carrito" : "Agregar al carrito"}
      </button>
    </div>
  );
}
