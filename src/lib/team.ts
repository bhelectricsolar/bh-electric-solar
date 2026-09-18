import { createClient } from "./supabase/client";

const supabase = createClient();

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
  username?: string; // usuario de acceso al sistema, si ya lo tiene asignado
};

type TeamMemberRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: TeamRole;
  active: boolean;
  commission_pct: number | null;
  zone: string | null;
  username: string | null;
};

function fromRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role,
    active: row.active,
    commissionPct: row.commission_pct != null ? Number(row.commission_pct) : undefined,
    zone: row.zone ?? undefined,
    username: row.username ?? undefined,
  };
}

export async function getTeam(): Promise<TeamMember[]> {
  // Las cuentas de desarrollador (sandbox de prueba) no son parte del
  // equipo real del dueño — nunca deben aparecer acá.
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_dev_account", false)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getDevTeamMemberIds(): Promise<string[]> {
  const { data, error } = await supabase.from("team_members").select("id").eq("is_dev_account", true);
  if (error) throw error;
  return (data ?? []).map((r) => r.id as string);
}

export async function createTeamMember(member: Omit<TeamMember, "id">) {
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      active: member.active,
      commission_pct: member.commissionPct ?? null,
      zone: member.zone ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateTeamMember(id: string, patch: Partial<TeamMember>) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.commissionPct !== undefined) row.commission_pct = patch.commissionPct;
  if (patch.zone !== undefined) row.zone = patch.zone;
  const { error } = await supabase.from("team_members").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}
