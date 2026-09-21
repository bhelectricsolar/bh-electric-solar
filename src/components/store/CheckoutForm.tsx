"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatARS, formatUSD } from "@/lib/currency";
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias";
import { WHATSAPP_NUMBER } from "@/components/WhatsAppFloat";
import {
  submitStoreOrder,
  type PublicShippingZone,
  type StoreOrderResult,
} from "@/lib/store-checkout";

const SAVED_KEY = "bh-checkout-v1";

type Form = {
  name: string;
  email: string;
  phone: string;
  doc: string;
  method: "retiro" | "envio";
  province: string;
  city: string;
  address: string;
  postal: string;
  notes: string;
};

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  doc: "",
  method: "envio",
  province: "",
  city: "",
  address: "",
  postal: "",
  notes: "",
};

const INPUT =
  "mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-3 text-base text-ink shadow-sm placeholder:text-body/50 focus:border-navy-900 focus:outline-none sm:text-sm";

export default function CheckoutForm({
  zones,
  exchangeRate,
  storeName,
}: {
  zones: PublicShippingZone[];
  exchangeRate: number;
  storeName: string;
}) {
  const { items, totalUSD, clearCart, updateQty, removeItem } = useCart();
  const [form, setForm] = useState<Form>(EMPTY);
  const [remember, setRemember] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<(StoreOrderResult & { name: string; method: string }) | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Datos guardados de una compra anterior: el cliente no vuelve a escribirlos.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw), notes: "" }));
    } catch {
      // sin almacenamiento: se completa a mano
    }
    setHydrated(true);
  }, []);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  // La zona sale sola de la provincia elegida.
  const zone = useMemo(
    () => (form.method === "envio" ? zones.find((z) => z.provincesList.includes(form.province)) : undefined),
    [zones, form.method, form.province],
  );
  const shippingUSD = form.method === "envio" ? (zone?.priceUSD ?? 0) : 0;
  const totalWithShipping = totalUSD + shippingUSD;
  const phoneOk = form.phone.replace(/\D/g, "").length >= 8;
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const deliveryOk =
    form.method === "retiro" ||
    (!!zone && form.address.trim().length >= 4 && form.city.trim().length >= 2);
  const canSubmit =
    items.length > 0 && form.name.trim().length >= 2 && phoneOk && emailOk && deliveryOk && accepted && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitStoreOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        doc: form.doc.trim(),
        shippingMethod: form.method,
        shippingZoneId: zone?.id ?? "",
        province: form.province,
        city: form.city.trim(),
        address: form.address.trim(),
        postal: form.postal.trim(),
        notes: form.notes.trim(),
        items: items.map((i) => ({ id: i.product.id, qty: i.qty })),
      });
      try {
        if (remember) {
          const { notes: _notes, ...keep } = form;
          void _notes;
          window.localStorage.setItem(SAVED_KEY, JSON.stringify(keep));
        } else window.localStorage.removeItem(SAVED_KEY);
      } catch {
        // ignorar
      }
      setDone({ ...result, name: form.name.trim(), method: form.method });
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Pedido:", err);
      const msg = (err as { message?: string })?.message ?? "";
      setError(
        /no está disponible/i.test(msg)
          ? "Alguno de los productos del carrito ya no está disponible. Revisá el carrito e intentá de nuevo."
          : "No pudimos registrar el pedido. Revisá los datos e intentá de nuevo, o escribinos por WhatsApp.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `Hola ${storeName}! Hice el pedido ${done.id} desde la tienda. Quiero coordinar el pago.`,
    )}`;
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-[0_30px_70px_-30px_rgba(12,26,56,0.35)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-ink">¡Recibimos tu pedido, {done.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-sm text-body">
          Tu número de pedido es <b className="font-data text-ink">{done.id}</b>. Guardalo por cualquier consulta.
        </p>
        <div className="mt-5 rounded-2xl bg-cream-100 p-4 text-left text-sm">
          <div className="flex justify-between text-body">
            <span>Productos</span>
            <span className="font-data text-ink">{formatUSD(done.subtotalUSD)}</span>
          </div>
          <div className="mt-1 flex justify-between text-body">
            <span>{done.method === "envio" ? "Envío" : "Retiro en el local"}</span>
            <span className="font-data text-ink">{done.method === "envio" ? formatUSD(done.shippingUSD) : "Sin costo"}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-2">
            <span className="font-semibold text-ink">Total</span>
            <span className="text-right">
              <span className="font-data block text-lg font-extrabold text-ink">{formatUSD(done.totalUSD)}</span>
              <span className="font-data text-xs text-body">{formatARS(done.totalUSD * exchangeRate)}</span>
            </span>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4 text-left text-sm text-ink">
          <p className="font-bold">¿Qué sigue?</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-body">
            <li>Un asesor te contacta para confirmar disponibilidad.</li>
            <li>Coordinamos la forma de pago (todavía no se paga desde la página).</li>
            <li>{done.method === "envio" ? "Despachamos tu pedido a la dirección indicada." : "Te avisamos cuando puedas retirarlo."}</li>
          </ol>
        </div>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-[0_15px_35px_-15px_rgba(37,211,102,0.6)]"
        >
          Coordinar el pago por WhatsApp
        </a>
        <Link href="/tienda" className="mt-3 inline-block text-sm font-semibold text-navy-900 hover:underline">
          Seguir mirando la tienda
        </Link>
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-ink">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-body">Elegí productos en la tienda para armar tu pedido.</p>
        <Link href="/tienda" className="mt-5 inline-flex rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Section n={1} title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre y apellido *" className="sm:col-span-2">
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" required className={INPUT} />
            </Field>
            <Field label="Email *">
              <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" required className={INPUT} />
            </Field>
            <Field label="WhatsApp / teléfono *">
              <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="Ej: +54 9 3754 123456" required className={INPUT} />
            </Field>
            <Field label="DNI o CUIT (para la factura)" className="sm:col-span-2">
              <input value={form.doc} onChange={(e) => set({ doc: e.target.value })} inputMode="numeric" className={INPUT} />
            </Field>
          </div>
        </Section>

        <Section n={2} title="Entrega">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["envio", "Envío a domicilio", "Lo llevamos a tu dirección"],
                ["retiro", "Retiro en el local", "Sin costo, coordinamos el día"],
              ] as const
            ).map(([value, title, sub]) => (
              <button
                key={value}
                type="button"
                onClick={() => set({ method: value })}
                className={`cursor-pointer touch-manipulation rounded-2xl border p-4 text-left transition-all ${
                  form.method === value
                    ? "border-navy-900 bg-navy-900/[0.04] shadow-[0_0_0_2px_rgba(12,26,56,0.9)]"
                    : "border-ink/15 bg-white hover:border-navy-900/40"
                }`}
              >
                <span className="block text-sm font-bold text-ink">{title}</span>
                <span className="mt-0.5 block text-xs text-body">{sub}</span>
              </button>
            ))}
          </div>

          {form.method === "envio" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Provincia *">
                <select value={form.province} onChange={(e) => set({ province: e.target.value })} required className={INPUT}>
                  <option value="">Elegí tu provincia</option>
                  {PROVINCIAS_ARGENTINA.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad / localidad *">
                <input value={form.city} onChange={(e) => set({ city: e.target.value })} autoComplete="address-level2" required className={INPUT} />
              </Field>
              <Field label="Dirección (calle y número) *" className="sm:col-span-2">
                <input value={form.address} onChange={(e) => set({ address: e.target.value })} autoComplete="street-address" required className={INPUT} />
              </Field>
              <Field label="Código postal">
                <input value={form.postal} onChange={(e) => set({ postal: e.target.value })} autoComplete="postal-code" inputMode="numeric" className={INPUT} />
              </Field>
              <div className="flex items-end">
                {form.province ? (
                  zone ? (
                    <p className="w-full rounded-xl bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-700">
                      <b>{zone.region}</b>: envío {formatUSD(zone.priceUSD)}
                      {zone.etaDays ? ` · llega en ${zone.etaDays}` : ""}
                    </p>
                  ) : (
                    <p className="w-full rounded-xl bg-red-500/10 px-3.5 py-3 text-sm text-red-600">
                      Todavía no tenemos envío a esa provincia. Escribinos y lo resolvemos.
                    </p>
                  )
                ) : null}
              </div>
            </div>
          )}
        </Section>

        <Section n={3} title="Notas del pedido (opcional)">
          <textarea
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            rows={3}
            placeholder="Horarios de entrega, referencias de la dirección, dudas sobre los equipos…"
            className={INPUT}
          />
        </Section>
      </div>

      <aside className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_25px_60px_-30px_rgba(12,26,56,0.4)] lg:sticky lg:top-28">
        <h2 className="text-lg font-extrabold text-ink">Resumen del pedido</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {items.map(({ product, qty }) => (
            <li key={product.id} className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-white">
                {product.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt="" className="h-full w-full object-contain p-1" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-ink">{product.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border border-ink/10">
                    <button type="button" onClick={() => updateQty(product.id, qty - 1)} className="grid h-7 w-7 place-items-center text-ink" aria-label="Restar">
                      −
                    </button>
                    <span className="font-data w-6 text-center text-sm">{qty}</span>
                    <button type="button" onClick={() => updateQty(product.id, qty + 1)} className="grid h-7 w-7 place-items-center text-ink" aria-label="Sumar">
                      +
                    </button>
                  </div>
                  <span className="font-data text-sm font-semibold text-ink">{formatUSD(product.priceUSD * qty)}</span>
                </div>
                <button type="button" onClick={() => removeItem(product.id)} className="mt-1 text-[11px] text-body hover:text-red-500">
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between text-body">
            <span>Subtotal</span>
            <span className="font-data text-ink">{formatUSD(totalUSD)}</span>
          </div>
          <div className="flex justify-between text-body">
            <span>{form.method === "envio" ? "Envío" : "Retiro en el local"}</span>
            <span className="font-data text-ink">
              {form.method === "retiro" ? "Sin costo" : zone ? formatUSD(shippingUSD) : "Elegí provincia"}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
            <span className="font-bold text-ink">Total</span>
            <span className="text-right">
              <span className="font-data block text-2xl font-extrabold text-ink">{formatUSD(totalWithShipping)}</span>
              <span className="font-data text-xs text-body">{formatARS(totalWithShipping * exchangeRate)} al dólar blue</span>
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-xs leading-relaxed text-ink">
          <b>Pago:</b> por ahora no se paga desde la página. Al confirmar, un asesor te contacta para coordinar
          transferencia, tarjeta u otra forma de pago.
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-body">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
          Guardar mis datos en este dispositivo para la próxima compra.
        </label>
        <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-xs text-body">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Acepto los{" "}
            <Link href="/terminos-y-condiciones" target="_blank" className="font-semibold text-navy-900 underline">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/politica-de-privacidad" target="_blank" className="font-semibold text-navy-900 underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        {error && <p className="mt-3 rounded-lg bg-red-500/10 p-2.5 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full cursor-pointer touch-manipulation rounded-xl bg-navy-900 px-5 py-4 text-sm font-bold text-white shadow-[0_15px_35px_-15px_rgba(12,26,56,0.7)] transition-all hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Enviando pedido…" : "Confirmar pedido"}
        </button>
        {!canSubmit && items.length > 0 && !busy && (
          <p className="mt-2 text-center text-[11px] text-body">
            Completá tus datos, la entrega y aceptá los términos para confirmar.
          </p>
        )}
      </aside>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-3 text-lg font-extrabold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-xs text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
