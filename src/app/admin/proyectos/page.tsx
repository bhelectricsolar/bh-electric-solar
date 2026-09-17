"use client";

import { useEffect, useState } from "react";
import {
  getProjects,
  updateProject,
  PROJECT_STAGES,
  PROJECT_STAGE_TONE,
  projectStatusMessage,
  type Project,
  type ProjectStatus,
} from "@/lib/projects";
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
          <button
            type="button"
            onClick={exportCSV}
            className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
          >
            Exportar CSV
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — cuando conectemos la calculadora solar y el
          formulario, cada cotización nueva va a crear un proyecto acá
          automáticamente en la etapa &ldquo;Cotización enviada&rdquo;.
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
                    </p>
                  </div>
                  <StatusBadge tone={PROJECT_STAGE_TONE[project.status]}>{stage?.label}</StatusBadge>
                </button>

                {isOpen && (
                  <div className="border-t border-ink/10 p-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        onClick={() =>
                          openWhatsApp(
                            project.customerPhone,
                            projectStatusMessage(project, settings.storeName),
                          )
                        }
                        title={`Avisar por WhatsApp a ${project.customerPhone}`}
                        className="flex cursor-pointer touch-manipulation items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600 shadow-sm transition-all hover:shadow-md"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M12.01 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.01 22C17.53 22 22 17.52 22 12S17.53 2 12.01 2Zm5.4 14.27c-.23.64-1.13 1.18-1.85 1.33-.49.1-1.13.18-3.29-.7-2.76-1.14-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.84 0-1.35.7-2.01.96-2.28.23-.24.5-.3.66-.3h.48c.16 0 .37-.06.58.44l.7 1.68c.06.14.1.3.02.48-.08.18-.12.3-.24.46-.12.16-.26.35-.37.47-.12.13-.25.27-.11.53.14.26.64 1.05 1.37 1.7.94.84 1.73 1.1 1.99 1.23.26.12.42.1.57-.06.16-.16.65-.75.83-1.01.18-.26.36-.22.6-.13.25.09 1.58.75 1.85.88.27.13.45.2.52.31.07.12.07.66-.16 1.31Z" />
                        </svg>
                        Avisar por WhatsApp
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
    </section>
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
