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
