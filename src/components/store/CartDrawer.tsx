"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatUSD, formatARS } from "@/lib/currency";

export default function CartDrawer({ exchangeRate }: { exchangeRate: number }) {
  const { items, isOpen, closeCart, updateQty, removeItem, totalUSD, whatsappCheckoutUrl } =
    useCart();

  if (!isOpen) return null;

  return (
    <div data-sheet="side" className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={closeCart}
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
      />

      <div className="animate-cart-in absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)]">
        <div className="flex items-center justify-between border-b border-ink/10 p-5">
          <h2 className="text-lg font-bold text-ink">Tu carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar"
            className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-100 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="font-semibold text-ink">Tu carrito está vacío</p>
            <p className="text-sm text-body">
              Agregá productos desde la tienda para armar tu pedido.
            </p>
            <Link
              href="/tienda"
              onClick={closeCart}
              className="mt-4 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <ul className="flex flex-col gap-4">
                {items.map(({ product, qty }) => (
                  <li key={product.id} className="flex gap-3">
                    <div
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ${
                        product.images?.[0] ? "bg-white" : `bg-gradient-to-br ${product.gradient}`
                      }`}
                    >
                      {product.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-semibold leading-snug text-ink">
                        {product.name}
                      </p>
                      <p className="font-data mt-0.5 text-xs text-body">
                        {formatUSD(product.priceUSD)} · {formatARS(product.priceARS ?? product.priceUSD * exchangeRate)} c/u
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-ink/10">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, qty - 1)}
                            className="grid h-7 w-7 cursor-pointer touch-manipulation place-items-center text-ink"
                            aria-label="Restar"
                          >
                            −
                          </button>
                          <span className="font-data w-6 text-center text-sm">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, qty + 1)}
                            className="grid h-7 w-7 cursor-pointer touch-manipulation place-items-center text-ink"
                            aria-label="Sumar"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          className="ml-auto text-xs font-medium text-body hover:text-red-500"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-ink/10 p-5">
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-body">Total estimado</span>
                  <span className="font-data text-xl font-extrabold text-ink">
                    {formatUSD(totalUSD)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-body/70">
                    Al dólar blue
                  </span>
                  <span className="font-data text-sm text-body">
                    {formatARS(totalUSD * exchangeRate)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-body">
                El pago y el envío se coordinan directamente con nuestro equipo.
              </p>
              <a
                href={whatsappCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_15px_35px_-15px_rgba(37,211,102,0.6)] transition-transform hover:scale-[1.02]"
              >
                Finalizar pedido por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
