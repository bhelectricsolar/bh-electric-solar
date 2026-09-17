"use client";

import { useCart } from "@/lib/cart-context";

export default function CartButton() {
  const { totalItems, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label="Ver carrito"
      className="relative grid h-10 w-10 shrink-0 cursor-pointer touch-manipulation place-items-center rounded-lg border border-navy-900/10 text-navy-900 transition-colors hover:border-navy-900/30"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
        <path d="M2.5 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6" />
      </svg>
      {totalItems > 0 && (
        <span className="font-data absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
          {totalItems}
        </span>
      )}
    </button>
  );
}
