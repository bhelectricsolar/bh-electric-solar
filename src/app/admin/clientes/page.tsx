"use client";

import { useEffect, useState } from "react";
import { getCustomers, createCustomer, CUSTOMER_STATUS_TONE, type Customer } from "@/lib/customers";
import { downloadCSV } from "@/lib/csv-export";
import { pickField } from "@/lib/csv-import";
import ImportButton from "@/components/admin/ImportButton";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import StatusBadge from "@/components/admin/StatusBadge";

const STATUS_LABELS = {
  lead: "Lead",
  cliente: "Cliente",
};

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
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
          Conectado a Supabase. Cuando conectemos el formulario de contacto
          y la calculadora a esta misma base, cada consulta real va a
          aparecer acá automáticamente.
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
                <StatusBadge tone={CUSTOMER_STATUS_TONE[customer.status]}>
                  {STATUS_LABELS[customer.status]}
                </StatusBadge>
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
