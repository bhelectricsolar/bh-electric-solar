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

// Proyectos de ejemplo — el pipeline real se completa a medida que entran
// cotizaciones desde la calculadora solar y el formulario de contacto.
export const PROJECTS: Project[] = [
  {
    id: "p1",
    customerName: "Cliente de ejemplo 1",
    customerPhone: "+54 9 3754 000001",
    city: "Posadas, Misiones",
    zone: "NEA / Litoral",
    type: "residencial",
    systemKwp: 3.2,
    panelsCount: 6,
    status: "mantenimiento",
    salespersonId: "team-3",
    technicianId: "team-4",
    scheduledDate: "2026-08-20",
    createdAt: "2026-07-30",
  },
  {
    id: "p2",
    customerName: "Cliente de ejemplo 4",
    customerPhone: "+54 9 3754 000004",
    city: "Puerto Iguazú, Misiones",
    zone: "NEA / Litoral",
    type: "residencial",
    systemKwp: 4.8,
    panelsCount: 9,
    status: "instalacion",
    salespersonId: "team-3",
    technicianId: "team-4",
    scheduledDate: "2026-09-22",
    createdAt: "2026-09-10",
  },
  {
    id: "p3",
    customerName: "Cliente de ejemplo 2",
    customerPhone: "+54 9 3754 000002",
    city: "Eldorado, Misiones",
    zone: "NEA / Litoral",
    type: "residencial",
    systemKwp: 2.4,
    panelsCount: 4,
    status: "contrato",
    salespersonId: "team-3",
    technicianId: null,
    scheduledDate: null,
    createdAt: "2026-09-05",
  },
  {
    id: "p4",
    customerName: "Cliente de ejemplo 3",
    customerPhone: "+54 9 3755 000003",
    city: "Oberá, Misiones",
    zone: "NEA / Litoral",
    type: "comercial",
    systemKwp: 12.5,
    panelsCount: 23,
    status: "visita_tecnica",
    salespersonId: "team-2",
    technicianId: null,
    scheduledDate: "2026-09-25",
    createdAt: "2026-09-14",
  },
  {
    id: "p5",
    customerName: "Panadería La Espiga (ejemplo)",
    customerPhone: "+54 9 11 5555 0005",
    city: "CABA",
    zone: "AMBA",
    type: "comercial",
    systemKwp: 8.1,
    panelsCount: 15,
    status: "cotizacion",
    salespersonId: "team-2",
    technicianId: null,
    scheduledDate: null,
    createdAt: "2026-09-15",
  },
];
