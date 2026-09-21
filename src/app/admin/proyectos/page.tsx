"use client";

import { useEffect, useState } from "react";
import {
  createProject,
  getProjects,
  updateProject,
  PROJECT_STAGES,
  PROJECT_STAGE_TONE,
  projectStatusMessage,
  type Project,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/projects";
import { createProjectFromQuote, getSolarQuotes, type SolarQuote } from "@/lib/solar-quotes";
import { getCustomers, type Customer } from "@/lib/customers";
import { useCurrentTeamMember } from "@/lib/current-user";
import { PROVINCES } from "@/lib/solar-quote";
import NumberField from "@/components/NumberField";
import ConsumptionHistory, { CurrencyToggle, formatMoney, type Cur } from "@/components/admin/ConsumptionHistory";
import { getTeam, type TeamMember } from "@/lib/team";
import { downloadCSV } from "@/lib/csv-export";
import { openWhatsApp } from "@/lib/whatsapp";
import { useAdminSettings } from "@/lib/admin-settings";
import PrintDocument from "@/components/admin/PrintDocument";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminProyectosPage() {
  const { settings } = useAdminSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<ProjectStatus | "todos">("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reciboProject, setReciboProject] = useState<Project | null>(null);
  const [conformidadProject, setConformidadProject] = useState<Project | null>(null);
  const { member } = useCurrentTeamMember();
  const [newOpen, setNewOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<SolarQuote[]>([]);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {});
    getSolarQuotes().then(setQuotes).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([getProjects(), getTeam()])
      .then(([p, t]) => {
        setProjects(p);
        setTeam(t);
      })
      .finally(() => setLoading(false));
  }, []);

  function personName(id: string | null) {
    if (!id) return "Sin asignar";
    return team.find((m) => m.id === id)?.name ?? "Sin asignar";
  }

  const visible = projects.filter(
    (p) => stageFilter === "todos" || p.status === stageFilter,
  );

  const totalKwp = projects.reduce((sum, p) => sum + p.systemKwp, 0);
  const activeCount = projects.filter((p) => p.status !== "mantenimiento").length;

  async function updateStatus(id: string, status: ProjectStatus) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await updateProject(id, { status });
  }

  async function updateField(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await updateProject(id, patch);
  }

  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  // Genera el PDF completo del proyecto; en celular se comparte como archivo.
  async function openPdf(project: Project, mode: "download" | "share") {
    setPdfBusy(project.id);
    try {
      const { buildProjectPdf } = await import("@/lib/project-pdf");
      const blob = await buildProjectPdf({
        project,
        quote: quotes.find((q) => q.projectId === project.id),
        store: { name: settings.storeName, whatsapp: settings.whatsapp, email: settings.email },
        exchangeRate: settings.exchangeRate,
        salesperson: personName(project.salespersonId),
        technician: personName(project.technicianId),
      });
      const fileName = `Proyecto solar - ${project.customerName}.pdf`.replace(/[\\/:*?"<>|]/g, "");
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: fileName, text: `Proyecto solar de ${settings.storeName}` });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      if (mode === "share" && project.customerPhone.trim()) {
        openWhatsApp(
          project.customerPhone,
          `Hola ${project.customerName.split(" ")[0]}! Te comparto el PDF de tu proyecto solar (te lo adjunto en este chat).`,
        );
      }
    } catch (e) {
      console.error("PDF del proyecto:", e);
      alert("No se pudo generar el PDF. Reintentá.");
    } finally {
      setPdfBusy(null);
    }
  }

  async function addFromQuote(q: SolarQuote, phone?: string) {
    const project = await createProjectFromQuote(q, customers.find((c) => c.id === q.customerId), member?.id ?? null, phone);
    setProjects((prev) => [project, ...prev]);
    setQuotes((prev) => prev.map((x) => (x.id === q.id ? { ...x, projectId: project.id } : x)));
    setNewOpen(false);
    setExpandedId(project.id);
  }

  async function addManual(data: Parameters<typeof createProject>[0]) {
    const project = await createProject(data);
    setProjects((prev) => [project, ...prev]);
    setNewOpen(false);
    setExpandedId(project.id);
  }

  function exportCSV() {
    downloadCSV(
      "proyectos.csv",
      projects.map((p) => ({
        proyecto: p.id,
        cliente: p.customerName,
        ciudad: p.city,
        kwp: p.systemKwp,
        paneles: p.panelsCount,
        etapa: PROJECT_STAGES.find((s) => s.value === p.status)?.label ?? p.status,
        vendedor: personName(p.salespersonId),
        tecnico: personName(p.technicianId),
        fecha_programada: p.scheduledDate ?? "",
      })),
    );
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Proyectos</h1>
            <p className="mt-1 text-sm text-body">
              Seguimiento de cotización a instalación — pensado para el rubro solar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="flex-1 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md sm:flex-none"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md sm:flex-none"
            >
              + Nuevo proyecto
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Creá un proyecto con <b className="text-ink">+ Nuevo proyecto</b>, ya sea desde una cotización solar
          guardada o cargándolo a mano. Siempre empieza en la etapa &ldquo;Cotización enviada&rdquo;.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando proyectos…</p>}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Proyectos activos" value={activeCount} />
          <StatCard label="kWp instalados / cotizados" value={`${totalKwp.toFixed(1)} kWp`} />
          <StatCard
            label="Por instalar"
            value={projects.filter((p) => p.status === "instalacion").length}
            accent
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 overflow-x-auto pb-1">
          <Chip active={stageFilter === "todos"} onClick={() => setStageFilter("todos")}>
            Todos ({projects.length})
          </Chip>
          {PROJECT_STAGES.map((stage) => (
            <Chip
              key={stage.value}
              active={stageFilter === stage.value}
              onClick={() => setStageFilter(stage.value)}
              tone={PROJECT_STAGE_TONE[stage.value]}
            >
              {stage.label} ({projects.filter((p) => p.status === stage.value).length})
            </Chip>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {visible.map((project) => {
            const isOpen = expandedId === project.id;
            const stage = PROJECT_STAGES.find((s) => s.value === project.status);
            return (
              <div key={project.id} className="rounded-2xl border border-ink/10 bg-surface shadow-sm transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : project.id)}
                  className="flex w-full cursor-pointer touch-manipulation flex-wrap items-center justify-between gap-3 p-5 text-left"
                >
                  <div>
                    <p className="font-semibold text-ink">{project.customerName}</p>
                    <p className="text-xs text-body">
                      {project.city} · {project.systemKwp} kWp · {project.panelsCount} paneles
                      {project.budgetUSD ? ` · ${fmtUSD.format(project.budgetUSD)}` : ""}
                    </p>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 max-w-xl text-xs text-body/80">{project.description}</p>
                    )}
                  </div>
                  <StatusBadge tone={PROJECT_STAGE_TONE[project.status]}>{stage?.label}</StatusBadge>
                </button>

                {isOpen && (
                  <div className="border-t border-ink/10 p-5">
                    <ProjectDetail
                      project={project}
                      quote={quotes.find((q) => q.projectId === project.id)}
                      onSave={(patch) => updateField(project.id, patch)}
                    />

                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                      <InfoField label="Tipo" value={project.type === "residencial" ? "Residencial" : "Comercial"} />
                      <InfoField label="Zona" value={project.zone} />
                      <InfoField label="Vendedor" value={personName(project.salespersonId)} />
                      <InfoField label="Técnico asignado" value={personName(project.technicianId)} />
                    </div>

                    <label className="mt-4 block">
                      <span className="text-xs font-semibold text-ink">Fecha programada</span>
                      <input
                        type="date"
                        value={project.scheduledDate ?? ""}
                        onChange={(e) =>
                          updateField(project.id, { scheduledDate: e.target.value || null })
                        }
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                      />
                    </label>

                    <div className="mt-4">
                      <span className="text-xs font-semibold text-body">
                        Avanzar etapa:
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {PROJECT_STAGES.map((s) => (
                          <Chip
                            key={s.value}
                            active={project.status === s.value}
                            onClick={() => updateStatus(project.id, s.value)}
                            tone={PROJECT_STAGE_TONE[s.value]}
                            title={s.hint}
                          >
                            {s.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                      <button
                        type="button"
                        onClick={() => openPdf(project, "download")}
                        disabled={pdfBusy === project.id}
                        className="flex cursor-pointer touch-manipulation items-center gap-2 rounded-lg bg-navy-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md disabled:opacity-60"
                      >
                        {pdfBusy === project.id ? "Generando PDF…" : "Descargar PDF completo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openPdf(project, "share")}
                        disabled={pdfBusy === project.id}
                        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                      >
                        Compartir PDF
                      </button>
                      <button
                        type="button"
                        disabled={!project.customerPhone.trim()}
                        onClick={() =>
                          openWhatsApp(
                            project.customerPhone,
                            projectStatusMessage(project, settings.storeName),
                          )
                        }
                        title={
                          project.customerPhone.trim()
                            ? `Avisar por WhatsApp a ${project.customerPhone}`
                            : "Cargá el WhatsApp del cliente para poder avisarle"
                        }
                        className="flex cursor-pointer touch-manipulation items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600 shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M12.01 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.01 22C17.53 22 22 17.52 22 12S17.53 2 12.01 2Zm5.4 14.27c-.23.64-1.13 1.18-1.85 1.33-.49.1-1.13.18-3.29-.7-2.76-1.14-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.84 0-1.35.7-2.01.96-2.28.23-.24.5-.3.66-.3h.48c.16 0 .37-.06.58.44l.7 1.68c.06.14.1.3.02.48-.08.18-.12.3-.24.46-.12.16-.26.35-.37.47-.12.13-.25.27-.11.53.14.26.64 1.05 1.37 1.7.94.84 1.73 1.1 1.99 1.23.26.12.42.1.57-.06.16-.16.65-.75.83-1.01.18-.26.36-.22.6-.13.25.09 1.58.75 1.85.88.27.13.45.2.52.31.07.12.07.66-.16 1.31Z" />
                        </svg>
                        {project.customerPhone.trim() ? "Avisar por WhatsApp" : "Falta el WhatsApp del cliente"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReciboProject(project)}
                        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
                      >
                        Imprimir comprobante
                      </button>
                      <button
                        type="button"
                        onClick={() => setConformidadProject(project)}
                        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
                      >
                        Imprimir conformidad de instalación
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-body">
              No hay proyectos en esta etapa.
            </p>
          )}
        </div>
      </div>

      {reciboProject && (
        <PrintDocument title="Comprobante de proyecto" onClose={() => setReciboProject(null)}>
          <div>
            Proyecto: <b>{reciboProject.id}</b>
          </div>
          <div>Fecha: {new Date(reciboProject.createdAt).toLocaleDateString("es-AR")}</div>
          <div>Cliente: {reciboProject.customerName}</div>
          <div>Ubicación: {reciboProject.city}</div>
          <div className="bh-recibo-line" />
          <div>Sistema: {reciboProject.systemKwp} kWp — {reciboProject.panelsCount} paneles</div>
          <div>
            Tipo: {reciboProject.type === "residencial" ? "Residencial" : "Comercial"}
          </div>
          <div>
            Etapa actual: {PROJECT_STAGES.find((s) => s.value === reciboProject.status)?.label}
          </div>
          {reciboProject.scheduledDate && (
            <div>
              Fecha programada:{" "}
              {new Date(reciboProject.scheduledDate).toLocaleDateString("es-AR")}
            </div>
          )}
          <div className="bh-recibo-line" />
          <p className="text-[11px] opacity-75">
            Conserve este comprobante como referencia de su proyecto de
            instalación solar.
          </p>
        </PrintDocument>
      )}

      {conformidadProject && (
        <PrintDocument title="Conformidad de instalación" onClose={() => setConformidadProject(null)}>
          <div className="mb-2 text-center text-sm font-bold tracking-wide">
            CONFORMIDAD DE INSTALACIÓN
          </div>
          <div>
            Proyecto: <b>{conformidadProject.id}</b> — Fecha:{" "}
            {new Date().toLocaleDateString("es-AR")}
          </div>
          <div>Cliente: {conformidadProject.customerName}</div>
          <div>Ubicación: {conformidadProject.city}</div>
          <div className="bh-recibo-line" />
          <div>
            Sistema instalado: {conformidadProject.systemKwp} kWp —{" "}
            {conformidadProject.panelsCount} paneles
          </div>
          <div className="bh-recibo-line" />
          <p className="text-[10.5px] leading-relaxed opacity-80">
            El cliente declara conformidad con la instalación del sistema
            solar detallado arriba, realizada por {settings.storeName}, y
            confirma haber recibido las indicaciones básicas de
            funcionamiento y mantenimiento del sistema.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 text-center text-xs">
            <div>
              <div className="border-t border-black/40 pt-1">Firma</div>
            </div>
            <div>
              <div className="border-t border-black/40 pt-1">Aclaración y DNI</div>
            </div>
          </div>
        </PrintDocument>
      )}

      {newOpen && (
        <NewProjectSheet
          onClose={() => setNewOpen(false)}
          quotes={quotes.filter((q) => !q.projectId)}
          customers={customers}
          team={team}
          defaultSalesperson={member?.id ?? ""}
          onFromQuote={addFromQuote}
          onManual={addManual}
        />
      )}
    </section>
  );
}

const fmtUSD = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

// Detalle entendible del proyecto: alcance, presupuesto y, si viene de una
// cotización solar, los equipos, la producción y el gráfico de consumo.
function ProjectDetail({
  project,
  quote,
  onSave,
}: {
  project: Project;
  quote: SolarQuote | undefined;
  onSave: (patch: Partial<Project>) => void;
}) {
  const [desc, setDesc] = useState(project.description);
  const [name, setName] = useState(project.customerName);
  const [phone, setPhone] = useState(project.customerPhone);
  const [budget, setBudget] = useState(project.budgetUSD != null ? String(project.budgetUSD) : "");
  const [sheet, setSheet] = useState(false);
  const [cur, setCur] = useState<Cur>("USD");
  const r = quote?.results;
  const { settings } = useAdminSettings();
  const rate = quote?.inputs.exchangeRate ?? settings.exchangeRate ?? 1450;
  const money = (usd: number) => formatMoney(usd, cur, rate);
  const bom = (r?.bom ?? []).filter((l) => l.included);
  const dirty =
    desc !== project.description || (budget === "" ? null : Number(budget)) !== project.budgetUSD;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-ink/10 bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-body">Cliente</p>
        {!project.customerPhone.trim() && (
          <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-500">
            Falta el WhatsApp del cliente. Cargalo acá para poder avisarle cómo avanza su proyecto y enviarle el PDF.
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-ink">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-ink">WhatsApp / teléfono</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="Ej: +54 9 3754 123456"
              className="mt-1.5 w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>
        </div>
        {(name !== project.customerName || phone !== project.customerPhone) && (
          <button
            type="button"
            onClick={() => onSave({ customerName: name.trim() || project.customerName, customerPhone: phone.trim() })}
            className="mt-3 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white"
          >
            Guardar
          </button>
        )}
      </div>

      <div className="rounded-xl border border-ink/10 bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-body">Alcance y presupuesto</p>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink">Descripción del proyecto</span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Qué se va a instalar, dónde y con qué equipos."
            className="mt-1.5 w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink">Presupuesto total (USD)</span>
          <NumberField
            decimals
            prefix="US$ "
            value={budget}
            onValueChange={setBudget}
            className="mt-1.5 w-full rounded-lg border border-ink/10 bg-surface px-3 py-2.5 text-sm text-ink"
          />
          {Number(budget) > 0 && (
            <span className="font-data mt-1 block text-[11px] text-body">
              ≈ {formatMoney(Number(budget), "ARS", rate)} (dólar a {new Intl.NumberFormat("es-AR").format(rate)})
            </span>
          )}
        </label>
        {dirty && (
          <button
            type="button"
            onClick={() => onSave({ description: desc, budgetUSD: budget === "" ? null : Number(budget) })}
            className="mt-3 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white"
          >
            Guardar
          </button>
        )}
      </div>

      {quote && r ? (
        <div className="rounded-xl border border-ink/10 bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-body">Sistema cotizado</p>
            <CurrencyToggle cur={cur} onChange={setCur} />
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="rounded-lg border border-ink/15 bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
            >
              Ver la cotización completa
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
            <SpecItem label="Tipo de sistema" value={r.systemType ? { ongrid: "On-grid", hibrido: "Híbrido", offgrid: "Off-grid" }[r.systemType] : "—"} />
            <SpecItem label="Potencia" value={`${nf1.format(quote.systemKwp)} kWp`} />
            <SpecItem label="Paneles" value={`${quote.panels} × ${quote.inputs.panelW} W`} />
            {r.inverterKw ? <SpecItem label="Inversor" value={`${r.inverterKw} kW`} /> : null}
            {r.batteryKwh ? <SpecItem label="Baterías" value={`${nf1.format(r.batteryKwh)} kWh`} /> : null}
            <SpecItem label="Producción" value={`${Math.round(quote.monthlyProduction)} kWh/mes`} />
            <SpecItem label="Cobertura" value={`${Math.round(quote.coveragePct)} %`} />
            <SpecItem
              label="Ahorro mensual"
              value={new Intl.NumberFormat("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(cur === "ARS" ? quote.monthlySavings : quote.monthlySavings / rate)}
            />
            <SpecItem label="Retorno" value={quote.paybackYears != null ? `${nf1.format(quote.paybackYears)} años` : "—"} />
          </dl>

          {bom.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-ink">Equipos y materiales</p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-ink/10 bg-surface">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 text-left text-[10px] uppercase tracking-wide text-body">
                      <th className="px-3 py-2 font-semibold">Ítem</th>
                      <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                      <th className="px-3 py-2 text-right font-semibold">Precio</th>
                      <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.map((l) => (
                      <tr key={l.id} className="border-b border-ink/5 last:border-0">
                        <td className="px-3 py-2 text-ink">{l.name}</td>
                        <td className="font-data px-3 py-2 text-right text-ink">{l.qty}</td>
                        <td className="font-data px-3 py-2 text-right text-body">{money(l.unitPriceUSD)}</td>
                        <td className="font-data px-3 py-2 text-right text-ink">{money(l.qty * l.unitPriceUSD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-right text-xs font-bold text-ink">Total: {money(quote.costUSD)}</p>
            </div>
          )}

          <div className="mt-4">
            <ConsumptionHistory
              history={quote.inputs.history}
              monthlyProduction={quote.monthlyProduction}
              pricePerKwh={quote.inputs.pricePerKwh}
              exchangeRate={rate}
              cur={cur}
              onCurChange={setCur}
            />
            {quote.inputs.chartImageUrl && (
              <details className="mt-3 rounded-lg border border-ink/10 bg-surface p-3">
                <summary className="cursor-pointer text-xs font-semibold text-ink">Ver el gráfico original de la factura</summary>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={quote.inputs.chartImageUrl}
                  alt="Gráfico de consumo"
                  className="mt-2 max-h-64 w-full rounded-lg border border-ink/10 bg-white object-contain"
                />
              </details>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-ink/15 p-3 text-xs text-body">
          Este proyecto no tiene una cotización solar asociada. Si querés ver los equipos y la producción estimada,
          armá la cotización en Cotizador solar y convertila en proyecto.
        </p>
      )}

      {sheet && quote && (
        <PrintDocument title="Cotización solar" onClose={() => setSheet(false)}>
          <pre className="whitespace-pre-wrap text-[12px] leading-relaxed">{quote.summary}</pre>
          {quote.inputs.chartImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.inputs.chartImageUrl} alt="Gráfico de consumo" className="mt-4 w-full rounded border border-black/10" />
          )}
        </PrintDocument>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-body">{label}</dt>
      <dd className="font-data mt-0.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

const SHEET_INPUT = "mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink";

function NewProjectSheet({
  onClose,
  quotes,
  customers,
  team,
  defaultSalesperson,
  onFromQuote,
  onManual,
}: {
  onClose: () => void;
  quotes: SolarQuote[];
  customers: Customer[];
  team: TeamMember[];
  defaultSalesperson: string;
  onFromQuote: (q: SolarQuote, phone?: string) => Promise<void>;
  onManual: (d: Parameters<typeof createProject>[0]) => Promise<void>;
}) {
  const [tab, setTab] = useState<"cotizacion" | "manual">(quotes.length > 0 ? "cotizacion" : "manual");
  const [askPhone, setAskPhone] = useState<{ q: SolarQuote; value: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    zone: "Misiones",
    type: "residencial" as ProjectType,
    kwp: "",
    panels: "",
    budget: "",
    description: "",
    salesperson: defaultSalesperson,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      console.error("Nuevo proyecto:", e);
      setError("No se pudo crear el proyecto. Reintentá.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-sheet className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 cursor-pointer bg-navy-950/60" />
      <div className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-surface p-5 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none">
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" />
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">Nuevo proyecto</h2>
          <button type="button" onClick={onClose} className="rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-semibold text-ink">
            Cerrar
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Chip active={tab === "cotizacion"} onClick={() => setTab("cotizacion")}>
            Desde una cotización ({quotes.length})
          </Chip>
          <Chip active={tab === "manual"} onClick={() => setTab("manual")}>
            Cargar a mano
          </Chip>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {tab === "cotizacion" ? (
            askPhone ? (
              <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-4">
                <p className="text-sm font-bold text-ink">
                  ¿A qué WhatsApp le avisamos a {askPhone.q.clientName || "el cliente"}?
                </p>
                <p className="mt-1 text-xs text-body">Lo usamos para informarle cómo avanza su proyecto y enviarle el PDF.</p>
                <input
                  value={askPhone.value}
                  onChange={(e) => setAskPhone({ q: askPhone.q, value: e.target.value })}
                  inputMode="tel"
                  autoFocus
                  placeholder="Ej: +54 9 3754 123456"
                  className={SHEET_INPUT}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy != null || askPhone.value.replace(/\D/g, "").length < 8}
                    onClick={() => run(askPhone.q.id, () => onFromQuote(askPhone.q, askPhone.value))}
                    className="flex-1 rounded-lg bg-navy-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busy ? "Creando…" : "Crear proyecto"}
                  </button>
                  <button type="button" onClick={() => setAskPhone(null)} className="rounded-lg border border-ink/15 px-4 py-3 text-xs font-semibold text-body">
                    Volver
                  </button>
                </div>
              </div>
            ) : quotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-body">
                No hay cotizaciones solares sin proyecto. Armá una en Cotizador solar o cargá el proyecto a mano.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {quotes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={busy != null}
                    onClick={() => {
                      const known = q.inputs.clientPhone || customers.find((c) => c.id === q.customerId)?.phone || "";
                      if (known) run(q.id, () => onFromQuote(q));
                      else setAskPhone({ q, value: "" });
                    }}
                    className="flex cursor-pointer flex-col rounded-xl border border-ink/10 bg-background p-3 text-left shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                  >
                    <span className="font-semibold text-ink">{q.clientName || "Sin nombre"}</span>
                    <span className="text-xs text-body">
                      {new Date(q.createdAt).toLocaleDateString("es-AR")} · {q.province} · {q.systemKwp.toFixed(2)} kWp ·{" "}
                      {q.panels} paneles
                    </span>
                    <span className="mt-1 text-[11px] font-bold text-gold-600">
                      {busy === q.id ? "Creando…" : "Tocá para crear el proyecto"}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 8) return;
                run("manual", () =>
                  onManual({
                    customerName: form.name.trim(),
                    customerPhone: form.phone.trim(),
                    city: form.city.trim(),
                    zone: form.zone,
                    type: form.type,
                    systemKwp: Number(form.kwp) || 0,
                    panelsCount: Number(form.panels) || 0,
                    salespersonId: form.salesperson || null,
                    budgetUSD: form.budget ? Number(form.budget) : null,
                    description: form.description.trim(),
                  }),
                );
              }}
              className="flex flex-col gap-3"
            >
              <label className="block">
                <span className="text-xs font-semibold text-ink">Elegir un cliente existente (opcional)</span>
                <select
                  className={SHEET_INPUT}
                  defaultValue=""
                  onChange={(e) => {
                    const c = customers.find((x) => x.id === e.target.value);
                    if (c) set({ name: c.name, phone: c.phone, city: c.city });
                  }}
                >
                  <option value="">— Escribir los datos —</option>
                  {customers
                    .filter((c) => c.status === "cliente")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Nombre del cliente</span>
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={SHEET_INPUT} required />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">WhatsApp / teléfono *</span>
                  <input
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    inputMode="tel"
                    required
                    placeholder="Para avisarle por WhatsApp"
                    className={SHEET_INPUT}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">Ciudad / dirección</span>
                  <input value={form.city} onChange={(e) => set({ city: e.target.value })} className={SHEET_INPUT} />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">Provincia</span>
                  <select value={form.zone} onChange={(e) => set({ zone: e.target.value })} className={SHEET_INPUT}>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">Tipo</span>
                  <select value={form.type} onChange={(e) => set({ type: e.target.value as ProjectType })} className={SHEET_INPUT}>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">Potencia</span>
                  <NumberField decimals suffix=" kWp" value={form.kwp} onValueChange={(v) => set({ kwp: v })} className={SHEET_INPUT} />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-semibold text-ink">Paneles</span>
                  <NumberField value={form.panels} onValueChange={(v) => set({ panels: v })} className={SHEET_INPUT} />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Presupuesto (USD)</span>
                <NumberField decimals prefix="US$ " value={form.budget} onValueChange={(v) => set({ budget: v })} className={SHEET_INPUT} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Descripción / alcance</span>
                <textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={3}
                  placeholder="Ej: Sistema on-grid de 5 kWp para vivienda, techo de chapa, 10 paneles de 550 W."
                  className={SHEET_INPUT}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Vendedor</span>
                <select value={form.salesperson} onChange={(e) => set({ salesperson: e.target.value })} className={SHEET_INPUT}>
                  <option value="">Sin asignar</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={busy != null || !form.name.trim() || form.phone.replace(/\D/g, "").length < 8}
                className="rounded-lg bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
              >
                {busy === "manual" ? "Creando…" : "Crear proyecto"}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-body">{label}</p>
      <p className={`font-data mt-1.5 text-xl font-semibold ${accent ? "text-gold-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-body">{label}</p>
      <p className="mt-0.5 text-ink">{value}</p>
    </div>
  );
}
