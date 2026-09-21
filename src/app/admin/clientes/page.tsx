"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
  CUSTOMER_STATUS_TONE,
  type Customer,
} from "@/lib/customers";
import { downloadCSV } from "@/lib/csv-export";
import { pickField } from "@/lib/csv-import";
import ImportButton from "@/components/admin/ImportButton";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import StatusBadge from "@/components/admin/StatusBadge";

const EMPTY_DRAFT = { name: "", email: "", phone: "", city: "" };

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function loadAll() {
    return getCustomers().then((all) => setCustomers(all.filter((c) => c.status === "cliente")));
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  const visible = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.city.toLowerCase().includes(query.toLowerCase()),
  );

  function exportCSV() {
    downloadCSV(
      "clientes.csv",
      customers.map((c) => ({
        nombre: c.name,
        email: c.email,
        telefono: c.phone,
        ciudad: c.city,
        origen: c.source,
        fecha: c.createdAt,
      })),
    );
  }

  function importRows(rows: Record<string, string>[]) {
    const imported: Omit<Customer, "id" | "createdAt">[] = [];
    rows.forEach((row) => {
      const name = pickField(row, ["nombre", "name", "cliente"]);
      if (!name.trim()) return;
      imported.push({
        name,
        email: pickField(row, ["email", "correo"]),
        phone: pickField(row, ["telefono", "phone", "teléfono"]),
        city: pickField(row, ["ciudad", "city"]),
        status: "cliente",
        source: "Manual",
      });
    });
    if (imported.length > 0) {
      Promise.all(imported.map((c) => createCustomer(c))).then(loadAll);
    }
    return imported.length;
  }

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setPanelOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await createCustomer({ ...draft, status: "cliente", source: "Manual" });
    setPanelOpen(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    await deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Clientes</h1>
            <p className="mt-1 text-sm text-body">
              {customers.length} clientes confirmados — carga manual, no incluye leads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ImportButton label="Importar CSV" onRows={importRows} />
            <button
              type="button"
              onClick={exportCSV}
              className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={openNew}
              className="cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
            >
              + Agregar cliente
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Acá solo aparecen clientes confirmados — cargados a mano o
          importados por vos. Las consultas del formulario público quedan
          en <b className="text-ink">Leads</b> hasta que las confirmes como
          venta.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando clientes…</p>}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="mt-5 w-full rounded-lg border border-ink/10 bg-surface px-4 py-2.5 text-sm text-ink"
        />

        <div className="mt-4 flex flex-col gap-3">
          {visible.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">{customer.name}</p>
                <StatusBadge tone={CUSTOMER_STATUS_TONE[customer.status]}>Cliente</StatusBadge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-body">
                {customer.city}
                <Link href={`/admin/cotizador?cliente=${customer.id}`} className="font-semibold text-gold-600 hover:underline">
                  Cotizar sistema solar →
                </Link>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink/10 pt-3 text-xs">
                <div>
                  <p className="text-body">Email</p>
                  <p className="mt-0.5 text-ink">{customer.email}</p>
                </div>
                <div>
                  <p className="text-body">Teléfono</p>
                  <p className="font-data mt-0.5 text-ink">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-body">Origen</p>
                  <p className="mt-0.5 text-ink">{customer.source}</p>
                </div>
                <div>
                  <p className="text-body">Fecha</p>
                  <p className="font-data mt-0.5 text-ink">
                    {new Date(customer.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              {confirmDeleteId === customer.id ? (
                <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                  <p className="flex-1 text-[11px] font-semibold text-red-500">¿Quitar este cliente?</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(customer.id)}
                    className="cursor-pointer touch-manipulation rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="cursor-pointer touch-manipulation rounded-lg bg-cream-200 px-3 py-2 text-xs font-semibold text-ink"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(customer.id)}
                  className="mt-3 w-full cursor-pointer touch-manipulation rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-500 shadow-sm hover:shadow-md"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
          {visible.length === 0 && !loading && (
            <p className="py-10 text-center text-sm text-body">
              Todavía no cargaste clientes — usá &ldquo;+ Agregar cliente&rdquo; o importá un CSV.
            </p>
          )}
        </div>
      </div>

      {panelOpen && (
        <div data-sheet className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={handleSave}
            className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Nuevo cliente</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="Nombre">
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Nombre y apellido"
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
                <Field label="Ciudad">
                  <input
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              className="sticky bottom-0 mt-6 rounded-lg bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Agregar cliente
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
