"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getInvoiceSignedUrl,
  type Customer,
} from "@/lib/customers";
import { getDevTeamMemberIds } from "@/lib/team";
import { useCurrentDeveloper } from "@/lib/current-user";
import { downloadCSV } from "@/lib/csv-export";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import StatusBadge from "@/components/admin/StatusBadge";
import Chip from "@/components/admin/Chip";
import DevToggle from "@/components/admin/DevToggle";

const LEAD_STALE_DAYS = 3;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// El reloj de "sin atender" arranca de nuevo cada vez que alguien lo marca
// como atendido — si nunca lo tocaron, cuenta desde que llegó.
function referenceDate(c: Customer) {
  return c.lastContactedAt ?? c.createdAt;
}

function isStale(c: Customer) {
  return daysSince(referenceDate(c)) >= LEAD_STALE_DAYS;
}

export default function AdminLeadsPage() {
  const { developer } = useCurrentDeveloper();
  const [leads, setLeads] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyStale, setOnlyStale] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [attendingId, setAttendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [devIds, setDevIds] = useState<string[]>([]);
  const [showDev, setShowDev] = useState(true);

  // Los leads que cargó el desarrollador probando el formulario público
  // (marcados a mano con "Es de prueba") no son leads reales del negocio.
  const isDevRecord = (c: Customer) => c.isTest || (!!c.createdBy && devIds.includes(c.createdBy));

  function loadAll() {
    return Promise.all([getCustomers(), getDevTeamMemberIds()]).then(([all, ids]) => {
      setDevIds(ids);
      const own = all.filter((c) => c.status === "lead");
      setLeads(developer && showDev ? own : own.filter((c) => !c.isTest && !(c.createdBy && ids.includes(c.createdBy))));
    });
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developer, showDev]);

  async function toggleTest(lead: Customer) {
    const next = !lead.isTest;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, isTest: next } : l)));
    await updateCustomer(lead.id, { isTest: next });
  }

  const staleCount = leads.filter(isStale).length;

  const visible = leads.filter(
    (c) =>
      (!onlyStale || isStale(c)) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city.toLowerCase().includes(query.toLowerCase())),
  );

  function exportCSV() {
    downloadCSV(
      "leads.csv",
      leads.map((c) => ({
        nombre: c.name,
        email: c.email,
        telefono: c.phone,
        ciudad: c.city,
        origen: c.source,
        fecha: c.createdAt,
      })),
    );
  }

  async function convertToClient(id: string) {
    setConvertingId(id);
    try {
      await updateCustomer(id, { status: "cliente" });
      setLeads((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setConvertingId(null);
    }
  }

  async function markAttended(id: string) {
    setAttendingId(id);
    try {
      const now = new Date().toISOString();
      await updateCustomer(id, { lastContactedAt: now });
      setLeads((prev) => prev.map((c) => (c.id === id ? { ...c, lastContactedAt: now } : c)));
    } finally {
      setAttendingId(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteCustomer(id);
    setLeads((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Leads</h1>
            <p className="mt-1 text-sm text-body">
              {leads.length} consultas todavía sin confirmar como cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
          >
            Exportar CSV
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Acá llegan solas las consultas del formulario de &ldquo;Presupuesto
          Personalizado&rdquo; del sitio público, con la factura adjunta si
          la mandaron. Cuando cierres la venta, convertí el lead en cliente
          — no se hace solo.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando leads…</p>}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="mt-5 w-full rounded-lg border border-ink/10 bg-surface px-4 py-2.5 text-sm text-ink"
        />

        {developer && (
          <DevToggle
            active={showDev}
            onClick={() => setShowDev((v) => !v)}
            label="Incluir mis leads de prueba"
            caption="Solo las ves vos — el dueño no las ve."
          />
        )}

        {staleCount > 0 && (
          <div className="mt-3">
            <Chip active={onlyStale} onClick={() => setOnlyStale((v) => !v)} tone="danger">
              Sin atender ({staleCount})
            </Chip>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {visible.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">{lead.name}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isStale(lead) && (
                    <StatusBadge tone="danger">{daysSince(referenceDate(lead))}d sin atender</StatusBadge>
                  )}
                  <StatusBadge tone="gold">Lead</StatusBadge>
                  {isDevRecord(lead) && <StatusBadge tone="danger">Prueba</StatusBadge>}
                </div>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-body">
                {lead.city}
                <Link href={`/admin/cotizador?cliente=${lead.id}`} className="font-semibold text-gold-600 hover:underline">
                  Cotizar sistema solar →
                </Link>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink/10 pt-3 text-xs">
                <div>
                  <p className="text-body">Email</p>
                  <p className="mt-0.5 text-ink">{lead.email}</p>
                </div>
                <div>
                  <p className="text-body">Teléfono</p>
                  <p className="font-data mt-0.5 text-ink">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-body">Origen</p>
                  <p className="mt-0.5 text-ink">{lead.source}</p>
                </div>
                <div>
                  <p className="text-body">Fecha</p>
                  <p className="font-data mt-0.5 text-ink">
                    {new Date(lead.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                {lead.lastContactedAt && (
                  <div>
                    <p className="text-body">Último contacto</p>
                    <p className="font-data mt-0.5 text-ink">
                      {new Date(lead.lastContactedAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}
              </div>

              {(lead.propertyType || lead.billAmount || lead.kwhMonthly || lead.roofType) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3 text-xs">
                  {lead.propertyType && (
                    <span className="rounded bg-background px-2 py-1 text-body">{lead.propertyType}</span>
                  )}
                  {lead.roofType && (
                    <span className="rounded bg-background px-2 py-1 text-body">Techo: {lead.roofType}</span>
                  )}
                  {lead.billAmount != null && (
                    <span className="font-data rounded bg-background px-2 py-1 text-body">
                      Factura ~${lead.billAmount}
                    </span>
                  )}
                  {lead.kwhMonthly != null && (
                    <span className="font-data rounded bg-background px-2 py-1 text-body">
                      {lead.kwhMonthly} kWh/mes
                    </span>
                  )}
                </div>
              )}

              {lead.message && (
                <p className="mt-3 border-t border-ink/10 pt-3 text-xs italic text-body">
                  &ldquo;{lead.message}&rdquo;
                </p>
              )}

              {lead.invoicePath && <InvoiceLink path={lead.invoicePath} />}

              {confirmDeleteId === lead.id ? (
                <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                  <p className="flex-1 text-[11px] font-semibold text-red-500">¿Descartar este lead?</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead.id)}
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
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                  {isStale(lead) && (
                    <button
                      type="button"
                      onClick={() => markAttended(lead.id)}
                      disabled={attendingId === lead.id}
                      className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md disabled:opacity-60"
                    >
                      {attendingId === lead.id ? "Marcando…" : "Marcar como atendido"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => convertToClient(lead.id)}
                    disabled={convertingId === lead.id}
                    className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-gold-500 py-2 text-xs font-bold text-navy-950 shadow-sm hover:shadow-md disabled:opacity-60"
                  >
                    {convertingId === lead.id ? "Convirtiendo…" : "✓ Convertir en cliente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(lead.id)}
                    className="cursor-pointer touch-manipulation rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 shadow-sm hover:shadow-md"
                  >
                    Descartar
                  </button>
                  {developer && (
                    <button
                      type="button"
                      onClick={() => toggleTest(lead)}
                      title="Ocultarlo del dueño: no llegó de un cliente real"
                      className="cursor-pointer touch-manipulation rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 shadow-sm hover:shadow-md"
                    >
                      {lead.isTest ? "Es de prueba ✓" : "Marcar como prueba"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && !loading && (
            <p className="py-10 text-center text-sm text-body">No hay leads con ese filtro.</p>
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
