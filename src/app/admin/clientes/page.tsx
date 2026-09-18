"use client";

import { useEffect, useState } from "react";
import {
  getCustomers,
  createCustomer,
  getInvoiceSignedUrl,
  CUSTOMER_STATUS_TONE,
  type Customer,
} from "@/lib/customers";
import { downloadCSV } from "@/lib/csv-export";
import { pickField } from "@/lib/csv-import";
import ImportButton from "@/components/admin/ImportButton";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import StatusBadge from "@/components/admin/StatusBadge";
import Chip from "@/components/admin/Chip";

const STATUS_LABELS = {
  lead: "Lead",
  cliente: "Cliente",
};

const LEAD_STALE_DAYS = 3;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function isStaleLead(c: Customer) {
  return c.status === "lead" && daysSince(c.createdAt) >= LEAD_STALE_DAYS;
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyStale, setOnlyStale] = useState(false);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  const staleCount = customers.filter(isStaleLead).length;

  const visible = customers.filter(
    (c) =>
      (!onlyStale || isStaleLead(c)) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city.toLowerCase().includes(query.toLowerCase())),
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
        estado: STATUS_LABELS[c.status],
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
        status: "lead",
        source: "Formulario",
      });
    });
    if (imported.length > 0) {
      Promise.all(imported.map((c) => createCustomer(c))).then(() => {
        getCustomers().then(setCustomers);
      });
    }
    return imported.length;
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Clientes</h1>
            <p className="mt-1 text-sm text-body">
              {customers.length} contactos registrados.
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
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — el formulario de "Presupuesto
          Personalizado" del sitio público ya carga acá automáticamente
          cada consulta real, con la factura adjunta si la mandaron.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando clientes…</p>}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="mt-5 w-full rounded-lg border border-ink/10 bg-surface px-4 py-2.5 text-sm text-ink"
        />

        {staleCount > 0 && (
          <div className="mt-3">
            <Chip active={onlyStale} onClick={() => setOnlyStale((v) => !v)} tone="danger">
              Sin atender ({staleCount})
            </Chip>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {visible.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">{customer.name}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isStaleLead(customer) && (
                    <StatusBadge tone="danger">
                      {daysSince(customer.createdAt)}d sin atender
                    </StatusBadge>
                  )}
                  <StatusBadge tone={CUSTOMER_STATUS_TONE[customer.status]}>
                    {STATUS_LABELS[customer.status]}
                  </StatusBadge>
                </div>
              </div>
              <p className="mt-1 text-xs text-body">{customer.city}</p>
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

              {(customer.propertyType || customer.billAmount || customer.kwhMonthly || customer.roofType) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3 text-xs">
                  {customer.propertyType && (
                    <span className="rounded bg-background px-2 py-1 text-body">
                      {customer.propertyType}
                    </span>
                  )}
                  {customer.roofType && (
                    <span className="rounded bg-background px-2 py-1 text-body">
                      Techo: {customer.roofType}
                    </span>
                  )}
                  {customer.billAmount != null && (
                    <span className="font-data rounded bg-background px-2 py-1 text-body">
                      Factura ~${customer.billAmount}
                    </span>
                  )}
                  {customer.kwhMonthly != null && (
                    <span className="font-data rounded bg-background px-2 py-1 text-body">
                      {customer.kwhMonthly} kWh/mes
                    </span>
                  )}
                </div>
              )}

              {customer.message && (
                <p className="mt-3 border-t border-ink/10 pt-3 text-xs italic text-body">
                  &ldquo;{customer.message}&rdquo;
                </p>
              )}

              {customer.invoicePath && <InvoiceLink path={customer.invoicePath} />}
            </div>
          ))}
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-body">
              No se encontraron clientes.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function InvoiceLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  async function openInvoice() {
    setLoading(true);
    const url = await getInvoiceSignedUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={openInvoice}
      disabled={loading}
      className="mt-3 flex cursor-pointer touch-manipulation items-center gap-1.5 border-t border-ink/10 pt-3 text-xs font-semibold text-ink hover:underline disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </svg>
      {loading ? "Abriendo…" : "Ver factura adjunta"}
    </button>
  );
}
