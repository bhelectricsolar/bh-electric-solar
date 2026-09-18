"use client";

import { useEffect, useState } from "react";
import {
  getOrders,
  createOrder,
  getOrderItemsWithProduct,
  PAYMENT_METHOD_LABELS,
  type Order,
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
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [saleOpen, setSaleOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<{ productId: string; qty: number }[]>([]);
  const [saleProductQuery, setSaleProductQuery] = useState("");
  const [saleCustomerQuery, setSaleCustomerQuery] = useState("");
  const [saleCustomer, setSaleCustomer] = useState({ name: "", phone: "", city: "" });
  const [saveAsNewCustomer, setSaveAsNewCustomer] = useState(false);
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>("efectivo");
  const [salePaymentCurrency, setSalePaymentCurrency] = useState<PaymentCurrency>("ARS");
  const [saleAmountReceived, setSaleAmountReceived] = useState("");
  const [salePaymentNotes, setSalePaymentNotes] = useState("");
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleReceipt, setSaleReceipt] = useState<Order | null>(null);

  useEffect(() => {
    if (memberLoading || !member) return;
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

  const saleMatchingProducts = products.filter((p) =>
    p.name.toLowerCase().includes(saleProductQuery.toLowerCase()),
  );
  const saleMatchingCustomers = saleCustomerQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(saleCustomerQuery.toLowerCase()))
    : [];
  const saleTotalUSD = saleItems.reduce(
    (sum, i) => sum + (products.find((p) => p.id === i.productId)?.priceUSD ?? 0) * i.qty,
    0,
  );
  const saleTotalInCurrency =
    salePaymentCurrency === "USD" ? saleTotalUSD : saleTotalUSD * settings.exchangeRate;
  const saleChange =
    salePaymentMethod === "efectivo" && saleAmountReceived
      ? Number(saleAmountReceived) - saleTotalInCurrency
      : null;

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

  function pickSaleCustomer(customer: Customer) {
    setSaleCustomer({ name: customer.name, phone: customer.phone, city: customer.city });
    setSaleCustomerQuery("");
    setSaveAsNewCustomer(false);
  }

  function openSale() {
    setSaleItems([]);
    setSaleProductQuery("");
    setSaleCustomerQuery("");
    setSaleCustomer({ name: "", phone: "", city: "" });
    setSaveAsNewCustomer(false);
    setSalePaymentMethod("efectivo");
    setSalePaymentCurrency("ARS");
    setSaleAmountReceived("");
    setSalePaymentNotes("");
    setSaleOpen(true);
  }

  async function registrarVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !member || saleItems.length === 0) return;
    setSaleSaving(true);
    try {
      const newOrder: Order = {
        id: "V-" + Date.now().toString(36).toUpperCase(),
        customerName: saleCustomer.name.trim() || "Consumidor final",
        customerPhone: saleCustomer.phone,
        customerCity: saleCustomer.city,
        items: saleItems,
        shippingZoneId: "",
        status: "completado",
        paymentMethod: salePaymentMethod,
        paymentCurrency: salePaymentCurrency,
        amountReceived: saleAmountReceived ? Number(saleAmountReceived) : undefined,
        changeGiven: saleChange != null && saleChange > 0 ? saleChange : undefined,
        paymentNotes: salePaymentNotes || undefined,
        origin: "manual",
        soldBy: member.id,
        createdAt: new Date().toISOString(),
      };
      await createOrder(newOrder);

      if (saveAsNewCustomer && saleCustomer.name.trim()) {
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
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-ink/10">
                  {saleMatchingProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addSaleItem(p.id)}
                      disabled={p.stock <= 0}
                      className="flex w-full cursor-pointer touch-manipulation items-center justify-between border-b border-ink/10 px-3 py-2 text-left text-xs last:border-0 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="text-ink">
                        {p.name} {p.stock <= 0 && "(sin stock)"}
                      </span>
                      <span className="font-data text-body">US$ {p.priceUSD}</span>
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
                    Total: US$ {saleTotalUSD}
                  </p>
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-ink">Cliente</span>
                <input
                  value={saleCustomer.name}
                  onChange={(e) => {
                    setSaleCustomer({ ...saleCustomer, name: e.target.value });
                    setSaleCustomerQuery(e.target.value);
                  }}
                  placeholder="Nombre (dejalo vacío para Consumidor final)"
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
                {saleMatchingCustomers.length > 0 && (
                  <div className="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-ink/10">
                    {saleMatchingCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickSaleCustomer(c)}
                        className="flex w-full cursor-pointer touch-manipulation flex-col border-b border-ink/10 px-3 py-2 text-left text-xs last:border-0 hover:bg-cream-200"
                      >
                        <span className="text-ink">{c.name}</span>
                        <span className="text-body">{c.city || c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
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

              <label className="block">
                <span className="text-xs font-semibold text-ink">Método de pago</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                    <Chip
                      key={method}
                      active={salePaymentMethod === method}
                      onClick={() => setSalePaymentMethod(method)}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </Chip>
                  ))}
                </div>
              </label>

              {(salePaymentMethod === "efectivo" || salePaymentMethod === "transferencia") && (
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Moneda</span>
                  <div className="mt-1.5 flex gap-2">
                    {(["ARS", "USD"] as PaymentCurrency[]).map((cur) => (
                      <Chip
                        key={cur}
                        active={salePaymentCurrency === cur}
                        onClick={() => setSalePaymentCurrency(cur)}
                      >
                        {cur === "ARS" ? "Pesos" : "Dólares"}
                      </Chip>
                    ))}
                  </div>
                </label>
              )}

              {saleItems.length > 0 && (
                <div className="rounded-lg border border-ink/10 bg-background p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-body">Total a cobrar</span>
                    <span className="font-data font-bold text-ink">
                      {salePaymentCurrency === "USD"
                        ? `US$ ${saleTotalInCurrency.toFixed(2)}`
                        : fmtARS.format(saleTotalInCurrency)}
                    </span>
                  </div>
                </div>
              )}

              {salePaymentMethod === "efectivo" && (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink">
                      Monto recibido ({salePaymentCurrency === "USD" ? "US$" : "ARS"})
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={saleAmountReceived}
                      onChange={(e) => setSaleAmountReceived(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                    />
                  </label>
                  {saleChange != null && (
                    <p className={`text-sm font-bold ${saleChange < 0 ? "text-red-500" : "text-ink"}`}>
                      {saleChange < 0
                        ? `Falta ${salePaymentCurrency === "USD" ? "US$" : "$"} ${Math.abs(saleChange).toFixed(2)}`
                        : `Vuelto: ${salePaymentCurrency === "USD" ? "US$" : "$"} ${saleChange.toFixed(2)}`}
                    </p>
                  )}
                </>
              )}

              {(salePaymentMethod === "cheque" || salePaymentMethod === "cuotas") && (
                <label className="block">
                  <span className="text-xs font-semibold text-ink">
                    {salePaymentMethod === "cheque" ? "Datos del cheque" : "Detalle de las cuotas"}
                  </span>
                  <input
                    value={salePaymentNotes}
                    onChange={(e) => setSalePaymentNotes(e.target.value)}
                    placeholder={
                      salePaymentMethod === "cheque"
                        ? "Ej: Banco, N° de cheque, fecha"
                        : "Ej: 3 cuotas sin interés con tarjeta"
                    }
                    className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </label>
              )}
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
                <div className="mt-2">
                  Método de pago: {PAYMENT_METHOD_LABELS[saleReceipt.paymentMethod]}
                  {saleReceipt.paymentCurrency === "USD" ? " (dólares)" : " (pesos)"}
                </div>
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
                {saleReceipt.paymentNotes && <div>Nota: {saleReceipt.paymentNotes}</div>}
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
