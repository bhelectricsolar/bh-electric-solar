"use client";

import { useEffect, useState } from "react";
import { getOrders, getOrderItemsWithProduct, type Order } from "@/lib/orders";
import { getShippingZones, type ShippingZone } from "@/lib/shipping";
import { getProducts, type Product } from "@/lib/products";
import { useAdminSettings } from "@/lib/admin-settings";
import { useCurrentTeamMember } from "@/lib/current-user";
import {
  sessionMovementsTotal,
  getOpenSessionFor,
  getCashHistory,
  openCashSession,
  addCashMovement,
  closeCashSession,
  type CashMovementType,
  type CashSession,
} from "@/lib/caja";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function AdminCajaPage() {
  const { settings } = useAdminSettings();
  const { member, loading: memberLoading } = useCurrentTeamMember();
  const [session, setSession] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementDraft, setMovementDraft] = useState<{ type: CashMovementType; amount: string; reason: string }>({
    type: "ingreso",
    amount: "",
    reason: "",
  });
  const [closeOpen, setCloseOpen] = useState(false);
  const [countedAmount, setCountedAmount] = useState("");

  useEffect(() => {
    if (memberLoading || !member) return;
    Promise.all([
      getOpenSessionFor(member.id),
      getCashHistory(member.id),
      getOrders(),
      getProducts(),
      getShippingZones(),
    ])
      .then(([openSession, hist, o, p, z]) => {
        setSession(openSession);
        setHistory(hist);
        setOrders(o);
        setProducts(p);
        setZones(z);
      })
      .finally(() => setLoading(false));
  }, [member, memberLoading]);

  function orderTotalUSD(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return 0;
    const items = getOrderItemsWithProduct(order, products);
    const zone = zones.find((z) => z.id === order.shippingZoneId);
    const itemsTotal = items.reduce((s, i) => s + (i.product?.priceUSD ?? 0) * i.qty, 0);
    return itemsTotal + (zone?.priceUSD ?? 0);
  }

  const today = new Date().toDateString();
  const cashOrdersToday = orders.filter(
    (o) =>
      o.paymentMethod === "efectivo" &&
      o.soldBy === member?.id &&
      new Date(o.createdAt).toDateString() === today,
  );
  const cashSalesARS = cashOrdersToday.reduce(
    (sum, o) => sum + orderTotalUSD(o.id) * settings.exchangeRate,
    0,
  );

  const ingresos = session ? sessionMovementsTotal(session, "ingreso") : 0;
  const egresos = session ? sessionMovementsTotal(session, "egreso") : 0;
  const expected = session ? session.openingAmount + cashSalesARS + ingresos - egresos : 0;

  async function abrirCaja(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    const amount = Number(openingAmount) || 0;
    const created = await openCashSession(member.id, amount);
    setSession(created);
    setOpeningAmount("");
  }

  async function agregarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const amount = Number(movementDraft.amount) || 0;
    if (amount <= 0) return;
    const reason = movementDraft.reason || (movementDraft.type === "ingreso" ? "Ingreso" : "Egreso");
    const movement = await addCashMovement(session.id, { type: movementDraft.type, amount, reason });
    setSession((prev) => (prev ? { ...prev, movements: [movement, ...prev.movements] } : prev));
    setMovementDraft({ type: "ingreso", amount: "", reason: "" });
    setMovementOpen(false);
  }

  async function cerrarCaja(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const counted = Number(countedAmount) || 0;
    await closeCashSession(session.id, { countedAmount: counted, expectedAmount: expected });
    const closed: CashSession = {
      ...session,
      closedAt: new Date().toISOString(),
      countedAmount: counted,
      expectedAmount: expected,
    };
    setHistory((prev) => [closed, ...prev]);
    setSession(null);
    setCountedAmount("");
    setCloseOpen(false);
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
          {member ? `Caja de ${member.name.split(" ")[0]}` : "Mi caja"}
        </h1>
        <p className="mt-1 text-sm text-body">
          Tu apertura, movimientos y cierre — siempre en pesos argentinos. Cada persona tiene la suya.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — la caja queda guardada de verdad.
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-body">Cargando caja…</p>
        ) : !session ? (
          <form
            onSubmit={abrirCaja}
            className="mt-6 rounded-2xl border border-ink/10 bg-surface p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-ink">Abrir caja</h2>
            <p className="mt-1 text-sm text-body">
              Ingresá el monto inicial en efectivo con el que arrancás el día.
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink">Monto inicial (ARS)</span>
              <input
                required
                type="number"
                min={0}
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="50000"
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
              />
            </label>
            <button
              type="submit"
              className="mt-4 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
            >
              Abrir caja
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Monto inicial" value={fmtARS.format(session.openingAmount)} />
              <StatCard label="Ventas efectivo hoy" value={fmtARS.format(cashSalesARS)} />
              <StatCard label="Ingresos / egresos" value={`+${fmtARS.format(ingresos)} / -${fmtARS.format(egresos)}`} />
              <StatCard label="Total esperado" value={fmtARS.format(expected)} accent />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMovementOpen(true)}
                className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
              >
                + Registrar movimiento
              </button>
              <button
                type="button"
                onClick={() => setCloseOpen(true)}
                className="cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
              >
                Cerrar caja
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-bold text-ink">Movimientos de hoy</h2>
              {session.movements.length === 0 ? (
                <p className="mt-4 text-sm text-body">Todavía no hay movimientos manuales.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {session.movements.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className={m.type === "ingreso" ? "text-green-600" : "text-red-500"}>
                          {m.type === "ingreso" ? "Ingreso" : "Egreso"}
                        </span>
                        <span className="text-body"> · {m.reason}</span>
                      </div>
                      <span className="font-data font-semibold text-ink">
                        {m.type === "ingreso" ? "+" : "-"}
                        {fmtARS.format(m.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {history.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-ink">Historial de cierres</h2>
            <div className="mt-3 flex flex-col gap-2">
              {history.map((h) => {
                const diff = (h.countedAmount ?? 0) - (h.expectedAmount ?? 0);
                return (
                  <div key={h.id} className="rounded-xl border border-ink/10 bg-surface p-4 text-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-body">
                        {h.closedAt && new Date(h.closedAt).toLocaleString("es-AR")}
                      </span>
                      <span
                        className={`font-data font-semibold ${diff === 0 ? "text-green-600" : diff > 0 ? "text-gold-600" : "text-red-500"}`}
                      >
                        {diff === 0 ? "Sin diferencia" : diff > 0 ? `Sobran ${fmtARS.format(diff)}` : `Faltan ${fmtARS.format(-diff)}`}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-body">
                      Esperado {fmtARS.format(h.expectedAmount ?? 0)} · Contado {fmtARS.format(h.countedAmount ?? 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {movementOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMovementOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={agregarMovimiento}
            className="animate-sheet-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-6 sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <h2 className="text-lg font-bold text-ink">Registrar movimiento</h2>

            <div className="mt-4 flex gap-2">
              {(["ingreso", "egreso"] as CashMovementType[]).map((type) => (
                <Chip
                  key={type}
                  active={movementDraft.type === type}
                  onClick={() => setMovementDraft({ ...movementDraft, type })}
                  tone={type === "ingreso" ? "done" : "danger"}
                >
                  {type === "ingreso" ? "Ingreso" : "Egreso"}
                </Chip>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink">Monto (ARS)</span>
              <input
                required
                type="number"
                min={0}
                value={movementDraft.amount}
                onChange={(e) => setMovementDraft({ ...movementDraft, amount: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink">Motivo</span>
              <input
                value={movementDraft.reason}
                onChange={(e) => setMovementDraft({ ...movementDraft, reason: e.target.value })}
                placeholder="Ej: Pago a proveedor, retiro de efectivo..."
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
              />
            </label>

            <button
              type="submit"
              className="mt-6 w-full cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
            >
              Registrar
            </button>
          </form>
        </div>
      )}

      {closeOpen && session && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setCloseOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={cerrarCaja}
            className="animate-sheet-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-6 sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <h2 className="text-lg font-bold text-ink">Cerrar caja</h2>
            <p className="mt-1 text-sm text-body">
              Total esperado: <b className="text-ink">{fmtARS.format(expected)}</b>
            </p>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink">Monto contado (ARS)</span>
              <input
                required
                type="number"
                min={0}
                value={countedAmount}
                onChange={(e) => setCountedAmount(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
              />
            </label>

            {countedAmount && (
              <p className="mt-3 text-sm text-body">
                Diferencia:{" "}
                <b className={Number(countedAmount) - expected === 0 ? "text-green-600" : Number(countedAmount) - expected > 0 ? "text-gold-600" : "text-red-500"}>
                  {fmtARS.format(Number(countedAmount) - expected)}
                </b>
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
            >
              Confirmar cierre
            </button>
          </form>
        </div>
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
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-body">{label}</p>
      <p className={`font-data mt-1.5 text-lg font-semibold ${accent ? "text-gold-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
