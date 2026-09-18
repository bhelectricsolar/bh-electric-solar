"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getOrders,
  createOrder,
  getOrderItemsWithProduct,
  PAYMENT_METHOD_LABELS,
  PAYMENT_LINE_METHODS,
  type Order,
  type OrderPayment,
  type PaymentMethod,
  type PaymentCurrency,
} from "@/lib/orders";
import { getShippingZones, type ShippingZone } from "@/lib/shipping";
import { getProducts, type Product } from "@/lib/products";
import { getCustomers, createCustomer, type Customer } from "@/lib/customers";
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
import PrintDocument from "@/components/admin/PrintDocument";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type SalePaymentLine = {
  method: Exclude<PaymentMethod, "combinado">;
  currency: PaymentCurrency;
  amount: string;
  notes: string;
};

const EMPTY_PAYMENT_LINE: SalePaymentLine = { method: "efectivo", currency: "ARS", amount: "", notes: "" };

export default function AdminCajaPage() {
  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 sm:px-8 sm:py-10">
          <p className="text-sm text-body">Cargando…</p>
        </section>
      }
    >
      <AdminCajaPageInner />
    </Suspense>
  );
}

function AdminCajaPageInner() {
  const { settings } = useAdminSettings();
  const { member, loading: memberLoading } = useCurrentTeamMember();
  const searchParams = useSearchParams();
  const router = useRouter();
  const wantsQuickSale = searchParams.get("venta") === "1";

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
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [saleOpen, setSaleOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<{ productId: string; qty: number }[]>([]);
  const [saleProductQuery, setSaleProductQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [saleCustomer, setSaleCustomer] = useState({ name: "", phone: "", city: "" });
  const [saveAsNewCustomer, setSaveAsNewCustomer] = useState(false);
  const [salePayments, setSalePayments] = useState<SalePaymentLine[]>([{ ...EMPTY_PAYMENT_LINE }]);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleReceipt, setSaleReceipt] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (memberLoading || !member) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getOpenSessionFor(member.id),
      getCashHistory(member.id),
      getOrders(),
      getProducts(),
      getShippingZones(),
      getCustomers(),
    ])
      .then(([openSession, hist, o, p, z, c]) => {
        setSession(openSession);
        setHistory(hist);
        setOrders(o);
        setProducts(p);
        setZones(z);
        setCustomers(c);
      })
      .catch((err) => {
        console.error("Caja:", err);
        setLoadError("No pudimos cargar tu caja. Puede ser algo momentáneo de la conexión.");
      })
      .finally(() => setLoading(false));
  }, [member, memberLoading, reloadKey]);

  // Venta rápida: si venimos de un acceso directo y la caja ya está
  // abierta, entramos derecho al panel de vender.
  useEffect(() => {
    if (wantsQuickSale && !loading && session && !saleOpen) {
      openSale();
      router.replace("/admin/caja");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsQuickSale, loading, session]);

  function orderTotalUSD(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return 0;
    const items = getOrderItemsWithProduct(order, products);
    const zone = zones.find((z) => z.id === order.shippingZoneId);
    const itemsTotal = items.reduce((s, i) => s + (i.product?.priceUSD ?? 0) * i.qty, 0);
    return itemsTotal + (zone?.priceUSD ?? 0);
  }

  // Cuánto de una venta entró como efectivo físico a esta caja — si se
  // pagó combinado, solo cuenta la parte en efectivo, no el total.
  function orderCashARS(order: Order) {
    if (order.paymentMethod !== "efectivo" && order.paymentMethod !== "combinado") return 0;
    if (order.payments.length === 0) {
      return order.paymentMethod === "efectivo" ? orderTotalUSD(order.id) * settings.exchangeRate : 0;
    }
    return order.payments
      .filter((p) => p.method === "efectivo")
      .reduce((sum, p) => sum + (p.currency === "USD" ? p.amount * settings.exchangeRate : p.amount), 0);
  }

  const today = new Date().toDateString();
  const cashOrdersToday = orders.filter(
    (o) =>
      (o.paymentMethod === "efectivo" || o.paymentMethod === "combinado") &&
      o.soldBy === member?.id &&
      new Date(o.createdAt).toDateString() === today,
  );
  const cashSalesARS = cashOrdersToday.reduce((sum, o) => sum + orderCashARS(o), 0);

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
    if (wantsQuickSale) {
      openSale();
      router.replace("/admin/caja");
    }
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

  const saleMatchingProducts = products.filter((p) =>
    p.name.toLowerCase().includes(saleProductQuery.toLowerCase()),
  );
  const saleTotalUSD = saleItems.reduce(
    (sum, i) => sum + (products.find((p) => p.id === i.productId)?.priceUSD ?? 0) * i.qty,
    0,
  );
  const saleTotalARS = saleTotalUSD * settings.exchangeRate;

  function lineAmountARS(line: SalePaymentLine) {
    const amt = Number(line.amount) || 0;
    return line.currency === "USD" ? amt * settings.exchangeRate : amt;
  }
  const salePaidARS = salePayments.reduce((sum, l) => sum + lineAmountARS(l), 0);
  const saleDiffARS = salePaidARS - saleTotalARS;

  function remainingForLine(idx: number) {
    const others = salePayments
      .filter((_, i) => i !== idx)
      .reduce((sum, l) => sum + lineAmountARS(l), 0);
    const remainingARS = Math.max(0, saleTotalARS - others);
    const line = salePayments[idx];
    return line.currency === "USD" ? remainingARS / settings.exchangeRate : remainingARS;
  }

  function addSaleItem(productId: string) {
    setSaleItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId, qty: 1 }];
    });
  }

  function removeSaleItem(productId: string) {
    setSaleItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function addPaymentLine() {
    setSalePayments((prev) => [...prev, { ...EMPTY_PAYMENT_LINE, method: "cheque", currency: "ARS" }]);
  }

  function removePaymentLine(idx: number) {
    setSalePayments((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePaymentLine(idx: number, patch: Partial<SalePaymentLine>) {
    setSalePayments((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function openSale() {
    setSaleItems([]);
    setSaleProductQuery("");
    setSelectedCustomerId("");
    setSaleCustomer({ name: "", phone: "", city: "" });
    setSaveAsNewCustomer(false);
    setSalePayments([{ ...EMPTY_PAYMENT_LINE }]);
    setSaleOpen(true);
  }

  function pickExistingCustomer(id: string) {
    setSelectedCustomerId(id);
    if (!id) {
      setSaleCustomer({ name: "", phone: "", city: "" });
      return;
    }
    const c = customers.find((c) => c.id === id);
    if (c) {
      setSaleCustomer({ name: c.name, phone: c.phone, city: c.city });
      setSaveAsNewCustomer(false);
    }
  }

  async function registrarVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !member || saleItems.length === 0) return;
    setSaleSaving(true);
    try {
      const payments: OrderPayment[] = salePayments.map((l) => ({
        method: l.method,
        currency: l.currency,
        amount: Number(l.amount) || 0,
        notes: l.notes.trim() || undefined,
      }));
      const isCombined = payments.length > 1;
      const primary = payments[0] ?? { method: "efectivo" as const, currency: "ARS" as const, amount: 0 };
      const changeARS = !isCombined && primary.method === "efectivo" ? saleDiffARS : 0;
      const changeInPrimaryCurrency =
        changeARS > 0 ? (primary.currency === "USD" ? changeARS / settings.exchangeRate : changeARS) : 0;

      const newOrder: Order = {
        id: "V-" + Date.now().toString(36).toUpperCase(),
        customerName: saleCustomer.name.trim() || "Consumidor final",
        customerPhone: saleCustomer.phone,
        customerCity: saleCustomer.city,
        items: saleItems,
        shippingZoneId: "",
        status: "completado",
        paymentMethod: isCombined ? "combinado" : primary.method,
        paymentCurrency: isCombined ? "ARS" : primary.currency,
        amountReceived: isCombined ? undefined : primary.amount || undefined,
        changeGiven: changeInPrimaryCurrency > 0 ? changeInPrimaryCurrency : undefined,
        paymentNotes: isCombined
          ? payments
              .filter((p) => p.notes)
              .map((p) => `${PAYMENT_METHOD_LABELS[p.method]}: ${p.notes}`)
              .join(" · ") || undefined
          : primary.notes,
        payments,
        origin: "manual",
        soldBy: member.id,
        createdAt: new Date().toISOString(),
      };
      await createOrder(newOrder);

      if (saveAsNewCustomer && !selectedCustomerId && saleCustomer.name.trim()) {
        await createCustomer({
          name: saleCustomer.name,
          email: "",
          phone: saleCustomer.phone,
          city: saleCustomer.city,
          status: "cliente",
          source: "Tienda",
        });
        getCustomers().then(setCustomers);
      }

      setOrders((prev) => [newOrder, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          const item = saleItems.find((i) => i.productId === p.id);
          return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
        }),
      );
      setSaleOpen(false);
      setSaleReceipt(newOrder);
    } finally {
      setSaleSaving(false);
    }
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

        {memberLoading ? (
          <p className="mt-5 text-sm text-body">Cargando…</p>
        ) : !member ? (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-surface p-6 shadow-sm">
            <p className="text-sm text-ink">
              Esta sección es la caja individual de cada persona del equipo. Tu
              cuenta no tiene una fila de equipo asignada (por ejemplo, si
              entraste con la cuenta de desarrollador), así que no hay una
              caja propia para mostrar acá.
            </p>
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 shadow-sm">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-4 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-800"
            >
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <p className="mt-5 text-sm text-body">Cargando caja…</p>
        ) : !session ? (
          <form
            onSubmit={abrirCaja}
            className="mt-6 rounded-2xl border border-ink/10 bg-surface p-6 shadow-sm"
          >
            {wantsQuickSale && (
              <div className="mb-4 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2.5 text-xs font-semibold text-gold-600">
                ⚡ Venta rápida: tu caja está cerrada. Abrila para poder vender.
              </div>
            )}
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
              {wantsQuickSale ? "Abrir caja y vender" : "Abrir caja"}
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
                onClick={openSale}
                className="cursor-pointer touch-manipulation rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-navy-950 shadow-sm transition-all hover:shadow-md"
              >
                + Registrar venta
              </button>
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

      {saleOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setSaleOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={registrarVenta}
            className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Registrar venta</h2>
              <button
                type="button"
                onClick={() => setSaleOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Productos</span>
                <input
                  value={saleProductQuery}
                  onChange={(e) => setSaleProductQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
                <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-ink/10">
                  {saleMatchingProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addSaleItem(p.id)}
                      disabled={p.stock <= 0}
                      className="flex w-full cursor-pointer touch-manipulation items-center justify-between gap-2 border-b border-ink/10 px-3 py-2 text-left text-xs last:border-0 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-navy-800 to-navy-950">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-500/70" fill="none" stroke="currentColor" strokeWidth={1.6}>
                              <path d="M4 5h16v14H4V5Zm0 4.7h16M4 14.3h16M9.3 5v14M14.7 5v14" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-ink">{p.name}</span>
                          <span className="block text-[10px] text-body">
                            {p.stock <= 0 ? "Sin stock" : `Stock: ${p.stock}`}
                          </span>
                        </span>
                      </span>
                      <span className="font-data shrink-0 text-body">US$ {p.priceUSD}</span>
                    </button>
                  ))}
                  {saleMatchingProducts.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-body">Sin resultados.</p>
                  )}
                </div>
              </label>

              {saleItems.length > 0 && (
                <div className="rounded-lg border border-ink/10 bg-background p-3">
                  <p className="text-xs font-semibold text-ink">Carrito</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {saleItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <li key={item.productId} className="flex items-center justify-between text-xs">
                          <span className="text-ink">
                            {item.qty}x {product?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSaleItem(item.productId)}
                            className="cursor-pointer touch-manipulation text-red-500 hover:underline"
                          >
                            Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 border-t border-ink/10 pt-2 text-right text-sm font-bold text-ink">
                    Total: US$ {saleTotalUSD}{" "}
                    <span className="font-normal text-body">(~{fmtARS.format(saleTotalARS)})</span>
                  </p>
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-ink">Cliente</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => pickExistingCustomer(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                >
                  <option value="">+ Cliente nuevo / Consumidor final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.city ? ` — ${c.city}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCustomerId ? (
                <p className="rounded-lg bg-background px-3 py-2.5 text-xs text-body">
                  {saleCustomer.name} · {saleCustomer.phone || "sin teléfono"} ·{" "}
                  {saleCustomer.city || "sin ciudad"}
                </p>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink">Nombre</span>
                    <input
                      value={saleCustomer.name}
                      onChange={(e) => setSaleCustomer({ ...saleCustomer, name: e.target.value })}
                      placeholder="Dejalo vacío para Consumidor final"
                      className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink">Teléfono</span>
                      <input
                        value={saleCustomer.phone}
                        onChange={(e) => setSaleCustomer({ ...saleCustomer, phone: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink">Ciudad</span>
                      <input
                        value={saleCustomer.city}
                        onChange={(e) => setSaleCustomer({ ...saleCustomer, city: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                      />
                    </label>
                  </div>

                  {saleCustomer.name.trim() && (
                    <label className="flex items-center gap-2 text-xs text-body">
                      <input
                        type="checkbox"
                        checked={saveAsNewCustomer}
                        onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                      />
                      Guardar como cliente nuevo en mi cartera
                    </label>
                  )}
                </>
              )}

              <div className="flex flex-col gap-3 rounded-lg border border-ink/10 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Formas de pago</span>
                  <button
                    type="button"
                    onClick={addPaymentLine}
                    className="cursor-pointer touch-manipulation text-xs font-semibold text-gold-600 hover:underline"
                  >
                    + Agregar otra
                  </button>
                </div>

                {salePayments.map((line, idx) => (
                  <div key={idx} className="flex flex-col gap-2 rounded-lg border border-ink/10 bg-surface p-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={line.method}
                        onChange={(e) =>
                          updatePaymentLine(idx, { method: e.target.value as SalePaymentLine["method"] })
                        }
                        className="flex-1 rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-xs text-ink"
                      >
                        {PAYMENT_LINE_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {PAYMENT_METHOD_LABELS[m]}
                          </option>
                        ))}
                      </select>
                      {(line.method === "efectivo" || line.method === "transferencia") && (
                        <select
                          value={line.currency}
                          onChange={(e) => updatePaymentLine(idx, { currency: e.target.value as PaymentCurrency })}
                          className="w-24 shrink-0 rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-xs text-ink"
                        >
                          <option value="ARS">Pesos</option>
                          <option value="USD">Dólares</option>
                        </select>
                      )}
                      {salePayments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentLine(idx)}
                          aria-label="Quitar forma de pago"
                          className="shrink-0 cursor-pointer touch-manipulation text-red-500"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={line.amount}
                        onChange={(e) => updatePaymentLine(idx, { amount: e.target.value })}
                        placeholder={`Monto (${line.currency === "USD" ? "US$" : "ARS"})`}
                        className="w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-xs text-ink"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rest = remainingForLine(idx);
                          updatePaymentLine(idx, {
                            amount: line.currency === "USD" ? rest.toFixed(2) : String(Math.round(rest)),
                          });
                        }}
                        className="shrink-0 cursor-pointer touch-manipulation whitespace-nowrap rounded-lg border border-ink/15 bg-background px-2 py-2 text-[10px] font-semibold text-ink"
                      >
                        Usar el resto
                      </button>
                    </div>
                    {line.method !== "efectivo" && (
                      <input
                        value={line.notes}
                        onChange={(e) => updatePaymentLine(idx, { notes: e.target.value })}
                        placeholder={
                          line.method === "cheque"
                            ? "Banco, N° de cheque, fecha..."
                            : line.method === "cuotas"
                              ? "Ej: 3 cuotas sin interés"
                              : "Nota (opcional)"
                        }
                        className="w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-xs text-ink"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-ink/10 pt-2 text-xs">
                  <span className="text-body">Cobrado: {fmtARS.format(salePaidARS)}</span>
                  <span className={`font-bold ${saleDiffARS < 0 ? "text-red-500" : "text-ink"}`}>
                    {saleDiffARS < 0
                      ? `Falta ${fmtARS.format(-saleDiffARS)}`
                      : saleDiffARS > 0
                        ? `Vuelto ${fmtARS.format(saleDiffARS)}`
                        : "Cobrado justo"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saleItems.length === 0 || saleSaving}
              className="sticky bottom-0 mt-6 rounded-lg bg-gold-500 px-5 py-3.5 text-sm font-bold text-navy-950 shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saleSaving ? "Registrando…" : "Registrar venta"}
            </button>
          </form>
        </div>
      )}

      {saleReceipt && (
        <PrintDocument title="Comprobante de venta" onClose={() => setSaleReceipt(null)}>
          {(() => {
            const items = getOrderItemsWithProduct(saleReceipt, products);
            const total = items.reduce((sum, i) => sum + (i.product?.priceUSD ?? 0) * i.qty, 0);
            return (
              <>
                <div>
                  Venta: <b>{saleReceipt.id}</b>
                </div>
                <div>Fecha: {new Date(saleReceipt.createdAt).toLocaleString("es-AR")}</div>
                <div>Cliente: {saleReceipt.customerName}</div>
                <div className="bh-recibo-line" />
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>
                      {item.qty}x {item.product?.name ?? "Producto"}
                    </span>
                    <span>US$ {(item.product?.priceUSD ?? 0) * item.qty}</span>
                  </div>
                ))}
                <div className="bh-recibo-line" />
                <div className="flex justify-between text-base font-bold">
                  <span>TOTAL</span>
                  <span>US$ {total}</span>
                </div>
                {saleReceipt.payments.length > 1 ? (
                  <div className="mt-2">
                    <div>Pago combinado:</div>
                    {saleReceipt.payments.map((p, i) => (
                      <div key={i} className="flex justify-between pl-3">
                        <span>
                          {PAYMENT_METHOD_LABELS[p.method]}
                          {p.notes ? ` (${p.notes})` : ""}
                        </span>
                        <span>
                          {p.currency === "USD" ? "US$" : "$"} {p.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2">
                    Método de pago: {PAYMENT_METHOD_LABELS[saleReceipt.paymentMethod]}
                    {saleReceipt.paymentCurrency === "USD" ? " (dólares)" : " (pesos)"}
                  </div>
                )}
                {saleReceipt.amountReceived != null && (
                  <div>
                    Recibido: {saleReceipt.paymentCurrency === "USD" ? "US$" : "$"}{" "}
                    {saleReceipt.amountReceived}
                  </div>
                )}
                {saleReceipt.changeGiven != null && saleReceipt.changeGiven > 0 && (
                  <div>
                    Vuelto: {saleReceipt.paymentCurrency === "USD" ? "US$" : "$"}{" "}
                    {saleReceipt.changeGiven.toFixed(2)}
                  </div>
                )}
                {saleReceipt.payments.length <= 1 && saleReceipt.paymentNotes && (
                  <div>Nota: {saleReceipt.paymentNotes}</div>
                )}
                <div className="bh-recibo-line" />
                <p className="text-[11px] opacity-75">Conserve este comprobante como constancia de su compra.</p>
              </>
            );
          })()}
        </PrintDocument>
      )}

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

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink">Tipo</span>
              <select
                value={movementDraft.type}
                onChange={(e) =>
                  setMovementDraft({ ...movementDraft, type: e.target.value as CashMovementType })
                }
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </label>

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
