import { createClient } from "./supabase/client";

const supabase = createClient();

export type ProjectStatus =
  | "cotizacion"
  | "visita_tecnica"
  | "contrato"
  | "instalacion"
  | "habilitacion"
  | "mantenimiento";

export const PROJECT_STAGES: { value: ProjectStatus; label: string; hint: string }[] = [
  { value: "cotizacion", label: "Cotización enviada", hint: "Presupuesto enviado al cliente" },
  { value: "visita_tecnica", label: "Visita técnica", hint: "Relevamiento del techo/predio" },
  { value: "contrato", label: "Contrato firmado", hint: "Seña o contrato confirmado" },
  { value: "instalacion", label: "Instalación programada", hint: "Equipo y fecha asignados" },
  { value: "habilitacion", label: "Habilitación / conexión a red", hint: "Trámite con la distribuidora" },
  { value: "mantenimiento", label: "En mantenimiento", hint: "Sistema instalado y operativo" },
];

export const PROJECT_STAGE_TONE: Record<ProjectStatus, import("@/components/admin/StatusBadge").StatusTone> = {
  cotizacion: "gold",
  visita_tecnica: "negocio",
  contrato: "negocio",
  instalacion: "negocio",
  habilitacion: "negocio",
  mantenimiento: "done",
};

export type ProjectType = "residencial" | "comercial";

export type Project = {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string;
  zone: string;
  type: ProjectType;
  systemKwp: number;
  panelsCount: number;
  status: ProjectStatus;
  salespersonId: string | null;
  technicianId: string | null;
  scheduledDate: string | null;
  createdAt: string;
  notes?: string;
};

type ProjectRow = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  city: string | null;
  zone: string | null;
  type: ProjectType;
  system_kwp: number;
  panels_count: number;
  status: ProjectStatus;
  salesperson_id: string | null;
  technician_id: string | null;
  scheduled_date: string | null;
  created_at: string;
};

function fromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? "",
    city: row.city ?? "",
    zone: row.zone ?? "",
    type: row.type,
    systemKwp: Number(row.system_kwp),
    panelsCount: row.panels_count,
    status: row.status,
    salespersonId: row.salesperson_id,
    technicianId: row.technician_id,
    scheduledDate: row.scheduled_date,
    createdAt: row.created_at,
  };
}

export function projectStatusMessage(project: Project, storeName: string) {
  const firstName = project.customerName.split(" ")[0];
  switch (project.status) {
    case "cotizacion":
      return `Hola ${firstName}! Te escribimos de ${storeName} por tu cotización de ${project.systemKwp} kWp. ¿Tenés alguna consulta antes de avanzar?`;
    case "visita_tecnica":
      return `Hola ${firstName}! Te confirmamos la visita técnica para relevar el lugar de instalación${project.scheduledDate ? ` el ${new Date(project.scheduledDate).toLocaleDateString("es-AR")}` : ""}. ¡Nos vemos pronto!`;
    case "contrato":
      return `Hola ${firstName}! Contrato confirmado para tu sistema de ${project.systemKwp} kWp. Ya estamos coordinando la instalación.`;
    case "instalacion":
      return `Hola ${firstName}! Tu instalación está programada${project.scheduledDate ? ` para el ${new Date(project.scheduledDate).toLocaleDateString("es-AR")}` : ""}. El equipo de ${storeName} va a estar en el lugar según lo acordado.`;
    case "habilitacion":
      return `Hola ${firstName}! Tu sistema ya está instalado. Estamos gestionando la habilitación y conexión a red con la distribuidora — te avisamos en cuanto esté lista.`;
    case "mantenimiento":
      return `Hola ${firstName}! Tu sistema solar de ${project.systemKwp} kWp está instalado y operativo. Cualquier consulta de mantenimiento, escribinos por acá.`;
    default:
      return `Hola ${firstName}! Te escribimos de ${storeName} por tu proyecto.`;
  }
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateProject(id: string, patch: Partial<Project>) {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.scheduledDate !== undefined) row.scheduled_date = patch.scheduledDate;
  if (patch.salespersonId !== undefined) row.salesperson_id = patch.salespersonId;
  if (patch.technicianId !== undefined) row.technician_id = patch.technicianId;
  const { error } = await supabase.from("projects").update(row).eq("id", id);
  if (error) throw error;
}
