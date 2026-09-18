"use client";

import { useState } from "react";
import NumberField from "@/components/NumberField";
import { submitContactForm } from "@/lib/customers";

const PROPERTY_TYPES = [
  "Seleccionar",
  "Casa / hogar",
  "Comercio",
  "Empresa / oficina",
  "Industria / fábrica",
  "Campo",
];

const ROOF_TYPES = [
  "No estoy seguro",
  "Chapa",
  "Teja",
  "Losa / hormigón",
  "Fibrocemento",
];

const EMPTY_FORM = {
  name: "",
  whatsapp: "",
  email: "",
  city: "",
  propertyType: "",
  billAmount: "",
  kwhMonthly: "",
  roofType: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitContactForm({ ...form, invoiceFile });
      setSubmitted(true);
    } catch {
      setError("No pudimos enviar tu solicitud. Probá de nuevo en unos minutos o escribinos por WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-[0_10px_30px_-18px_rgba(16,28,61,0.3)] sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-100 text-gold-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink">
          ¡Solicitud enviada!
        </h2>
        <p className="mt-2 text-sm text-body">
          Nuestro equipo va a revisar tu consulta y se va a contactar a la
          brevedad.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-white/60 bg-white/85 p-6 shadow-[0_25px_60px_-25px_rgba(12,24,48,0.3)] backdrop-blur-md sm:backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-ink">
            Nombre y apellido
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Juan Perez"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">WhatsApp</label>
          <input
            required
            type="tel"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="Ej: +54 9 11 0000 0000"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="tuemail@ejemplo.com"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Ciudad / Provincia
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Ej: Posadas, Misiones"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Tipo de propiedad
          </label>
          <select
            value={form.propertyType}
            onChange={(e) => set("propertyType", e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type === "Seleccionar" ? "" : type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Monto aproximado de factura
          </label>
          <NumberField
            prefix="$ "
            value={form.billAmount}
            onValueChange={(v) => set("billAmount", v)}
            placeholder="Ej: $ 85.000"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Consumo mensual en kWh
          </label>
          <NumberField
            suffix=" kWh"
            value={form.kwhMonthly}
            onValueChange={(v) => set("kwhMonthly", v)}
            placeholder="Ej: 420 kWh"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Tipo de techo
          </label>
          <select
            value={form.roofType}
            onChange={(e) => set("roofType", e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
          >
            {ROOF_TYPES.map((type) => (
              <option key={type} value={type === "No estoy seguro" ? "" : type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Contanos más</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Contanos si buscás ahorro, respaldo, instalación industrial, ampliación futura o una visita técnica."
          className="mt-2 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">
          Adjuntar factura eléctrica
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-black/15 px-4 py-4">
          <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-ink">
            Seleccionar archivo
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-xs text-body">
            {invoiceFile?.name ?? "Ningún archivo seleccionado"}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-body">
          Formatos permitidos: PDF, JPG, PNG o WEBP. Tamaño máximo recomendado:
          8 MB.
        </p>
      </div>

      <label className="flex items-start gap-3 text-xs text-body">
        <input required type="checkbox" className="mt-0.5" />
        Acepto que BH Electric Solar use estos datos para responder mi
        consulta y preparar una propuesta personalizada.
      </label>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-navy-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar solicitud personalizada"}
      </button>
    </form>
  );
}
