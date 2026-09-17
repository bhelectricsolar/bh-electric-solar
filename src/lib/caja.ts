import { createClient } from "./supabase/client";

const supabase = createClient();

export type CashMovementType = "ingreso" | "egreso";

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  at: string;
};

export type CashSession = {
  id: string;
  openedBy: string | null;
  openedAt: string;
  openingAmount: number;
  movements: CashMovement[];
  closedAt: string | null;
  countedAmount: number | null;
  expectedAmount: number | null;
};

export function sessionMovementsTotal(session: CashSession, type: CashMovementType) {
  return session.movements
    .filter((m) => m.type === type)
    .reduce((sum, m) => sum + m.amount, 0);
}

type SessionRow = {
  id: string;
  opened_by: string | null;
  opened_at: string;
  opening_amount: number;
  closed_at: string | null;
  counted_amount: number | null;
  expected_amount: number | null;
};

type MovementRow = {
  id: number;
  session_id: string;
  type: CashMovementType;
  amount: number;
  reason: string | null;
  at: string;
};

function fromRows(row: SessionRow, movements: MovementRow[]): CashSession {
  return {
    id: row.id,
    openedBy: row.opened_by,
    openedAt: row.opened_at,
    openingAmount: Number(row.opening_amount),
    movements: movements
      .filter((m) => m.session_id === row.id)
      .map((m) => ({
        id: String(m.id),
        type: m.type,
        amount: Number(m.amount),
        reason: m.reason ?? "",
        at: m.at,
      })),
    closedAt: row.closed_at,
    countedAmount: row.counted_amount != null ? Number(row.counted_amount) : null,
    expectedAmount: row.expected_amount != null ? Number(row.expected_amount) : null,
  };
}

// La caja de una persona puntual (la usa cada vendedor/técnico para la suya).
export async function getOpenSessionFor(teamMemberId: string): Promise<CashSession | null> {
  const { data: session, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("opened_by", teamMemberId)
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;
  const { data: movements, error: movError } = await supabase
    .from("cash_movements")
    .select("*")
    .eq("session_id", session.id)
    .order("at", { ascending: false });
  if (movError) throw movError;
  return fromRows(session, movements ?? []);
}

// Todas las cajas abiertas ahora mismo, de cualquier persona (para el dueño).
export async function getAllOpenSessions(): Promise<CashSession[]> {
  const { data: sessions, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .is("closed_at", null)
    .order("opened_at", { ascending: false });
  if (error) throw error;
  return (sessions ?? []).map((s) => fromRows(s, []));
}

export async function getCashHistory(teamMemberId?: string): Promise<CashSession[]> {
  let query = supabase
    .from("cash_sessions")
    .select("*")
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false });
  if (teamMemberId) query = query.eq("opened_by", teamMemberId);
  const { data: sessions, error } = await query;
  if (error) throw error;
  return (sessions ?? []).map((s) => fromRows(s, []));
}

export async function openCashSession(teamMemberId: string, openingAmount: number): Promise<CashSession> {
  const { data, error } = await supabase
    .from("cash_sessions")
    .insert({ opened_by: teamMemberId, opening_amount: openingAmount })
    .select()
    .single();
  if (error) throw error;
  return fromRows(data, []);
}

export async function addCashMovement(
  sessionId: string,
  movement: { type: CashMovementType; amount: number; reason: string },
): Promise<CashMovement> {
  const { data, error } = await supabase
    .from("cash_movements")
    .insert({ session_id: sessionId, type: movement.type, amount: movement.amount, reason: movement.reason })
    .select()
    .single();
  if (error) throw error;
  return { id: String(data.id), type: data.type, amount: Number(data.amount), reason: data.reason ?? "", at: data.at };
}

export async function closeCashSession(
  sessionId: string,
  patch: { countedAmount: number; expectedAmount: number },
) {
  const { error } = await supabase
    .from("cash_sessions")
    .update({
      closed_at: new Date().toISOString(),
      counted_amount: patch.countedAmount,
      expected_amount: patch.expectedAmount,
    })
    .eq("id", sessionId);
  if (error) throw error;
}
