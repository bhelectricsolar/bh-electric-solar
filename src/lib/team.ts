export type TeamRole = "admin" | "vendedor" | "tecnico";

export const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  tecnico: "Técnico / Instalador",
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: "Acceso total: productos, precios, pedidos, equipo y configuración.",
  vendedor: "Carga cotizaciones, hace seguimiento de clientes y ve sus propias ventas.",
  tecnico: "Ve las instalaciones y visitas técnicas asignadas, actualiza su estado.",
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  active: boolean;
  commissionPct?: number; // solo vendedores
  zone?: string; // zona de cobertura, principalmente para vendedores/técnicos
};

// Equipo de ejemplo — se reemplaza por datos reales al conectar Supabase Auth.
export const TEAM: TeamMember[] = [
  {
    id: "team-1",
    name: "Bruno Herrera",
    email: "bruno@bhelectricsolar.com",
    phone: "+54 9 3754 419198",
    role: "admin",
    active: true,
  },
  {
    id: "team-2",
    name: "Camila Fretes",
    email: "camila@bhelectricsolar.com",
    phone: "+54 9 3754 555111",
    role: "vendedor",
    active: true,
    commissionPct: 5,
    zone: "AMBA",
  },
  {
    id: "team-3",
    name: "Lautaro Ibáñez",
    email: "lautaro@bhelectricsolar.com",
    phone: "+54 9 3755 444222",
    role: "vendedor",
    active: true,
    commissionPct: 4,
    zone: "NEA / Litoral",
  },
  {
    id: "team-4",
    name: "Rodrigo Acosta",
    email: "rodrigo@bhelectricsolar.com",
    phone: "+54 9 3754 333999",
    role: "tecnico",
    active: true,
    zone: "NEA / Litoral",
  },
];
