"use client";

import { useEffect, useState } from "react";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  updateOrderPaid,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  ORDER_ORIGIN_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_LINE_METHODS,
  getOrderItemsWithProduct,
  orderStatusMessage,
  orderPaymentMessage,
  type Order,
  type OrderOrigin,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/orders";
import { getProducts, type Product } from "@/lib/products";
import { getShippingZones, type ShippingZone } from "@/lib/shipping";
import { getDevTeamMemberIds } from "@/lib/team";
import { useAdminSettings } from "@/lib/admin-settings";
import { useCurrentTeamMember } from "@/lib/current-user";
import { downloadCSV } from "@/lib/csv-export";
import { openWhatsApp } from "@/lib/whatsapp";
import PrintDocument from "@/components/admin/PrintDocument";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusSelect from "@/components/admin/StatusSelect";

type OriginFilter = "todos" | OrderOrigin | "pendientes";

const EMPTY_MANUAL = {
  customerName: "",
  customerPhone: "",
  customerCity: "",
  shippingZoneId: "",
  paymentMethod: "efectivo" as PaymentMethod,
};

export default function AdminPedidosPage() {
  const { formatPrice, settings } = useAdminSettings();
  const { member } = useCurrentTeamMember();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reciboOrder, setReciboOrder] = useState<Order | null>(null);
  const [originFilter, setOriginFilter] = useState<OriginFilter>("todos");

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL);
  const [manualItems, setManualItems] = useState<{ productId: string; qty: number }[]>([]);
  const [productQuery, setProductQuery] = useState("");

  useEffect(() => {
    Promise.all([getOrders(), getProducts(), getShippingZones(), getDevTeamMemberIds()])
      .then(([o, p, z, devIds]) => {
        // Las ventas de prueba del desarrollador no son pedidos reales del
        // negocio — no deben aparecer acá.
        setOrders(o.filter((ord) => !devIds.includes(ord.soldBy ?? "")));
        setProducts(p);
        setZones(z);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = orders.filter((o) =>
    originFilter === "todos" ? true : originFilter === "pendientes" ? !o.paid : o.origin === originFilter,
  );

  async function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await updateOrderStatus(id, status);
  }

  // Recién acá el pedido pasa a sumar en los resúmenes de ventas.
  async function markPaid(id: string, paid: boolean) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paid } : o)));
    await updateOrderPaid(id, paid);
  }

  function orderTotal(order: Order) {
    const items = getOrderItemsWithProduct(order, products);
    const zone = zones.find((z) => z.id === order.shippingZoneId);
    const itemsTotal = items.reduce(
      (sum, i) => sum + (i.product?.priceUSD ?? 0) * i.qty,
      0,
    );
    return itemsTotal + (zone?.priceUSD ?? 0);
  }

  function exportCSV() {
    downloadCSV(
      "pedidos.csv",
      orders.map((o) => ({
        pedido: o.id,
        origen: ORDER_ORIGIN_LABELS[o.origin],
        cliente: o.customerName,
        ciudad: o.customerCity,
        total_usd: orderTotal(o),
        estado: ORDER_STATUS_LABELS[o.status],
        fecha: o.createdAt,
      })),
    );
  }

  function addManualItem(productId: string) {
    setManualItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId, qty: 1 }];
    });
  }

  function removeManualItem(productId: string) {
    setManualItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function openManual() {
    setManualForm({ ...EMPTY_MANUAL, shippingZoneId: zones[0]?.id ?? "" });
    setManualItems([]);
    setProductQuery("");
    setManualOpen(true);
  }

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!manualForm.customerName.trim() || manualItems.length === 0) return;
    const newOrder: Order = {
      id: "P-" + Date.now().toString(36).toUpperCase(),
      customerName: manualForm.customerName,
      customerPhone: manualForm.customerPhone,
      customerCity: manualForm.customerCity,
      items: manualItems,
      shippingZoneId: manualForm.shippingZoneId,
      status: "nuevo",
      paymentMethod: manualForm.paymentMethod,
      paymentCurrency: "ARS",
      payments: [],
      origin: "manual",
      soldBy: member?.id ?? null,
      createdAt: new Date().toISOString(),
      paid: true,
    };
    await createOrder(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    setManualOpen(false);
  }

  const matchingProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productQuery.toLowerCase()),
  );

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Pedidos</h1>
            <p className="mt-1 text-sm text-body">
              {orders.length} pedidos en total.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={openManual}
              className="cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
            >
              + Pedido interno
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase. Los pedidos de la tienda llegan solos por
          WhatsApp. Los pedidos internos son ventas que cargás vos acá (en
          el local, por teléfono, etc.) — ambos comparten el mismo
          seguimiento de estado.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando pedidos…</p>}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <Chip active={originFilter === "todos"} onClick={() => setOriginFilter("todos")}>
            Todos ({orders.length})
          </Chip>
          <Chip active={originFilter === "tienda"} onClick={() => setOriginFilter("tienda")} tone="gold">
            De la tienda ({orders.filter((o) => o.origin === "tienda").length})
          </Chip>
          <Chip active={originFilter === "manual"} onClick={() => setOriginFilter("manual")} tone="negocio">
            Cargados en el admin ({orders.filter((o) => o.origin === "manual").length})
          </Chip>
          {orders.some((o) => !o.paid) && (
            <Chip active={originFilter === "pendientes"} onClick={() => setOriginFilter("pendientes")} tone="danger">
              Pago pendiente ({orders.filter((o) => !o.paid).length})
            </Chip>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {visible.map((order) => {
            const items = getOrderItemsWithProduct(order, products);
            const zone = zones.find((z) => z.id === order.shippingZoneId);
            const isOpen = expandedId === order.id;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-ink/10 bg-surface shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  className="flex w-full cursor-pointer touch-manipulation flex-wrap items-center justify-between gap-3 p-5 text-left"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-data text-sm font-bold text-ink">{order.id}</p>
                      <StatusBadge tone={order.origin === "tienda" ? "gold" : "negocio"}>
                        {ORDER_ORIGIN_LABELS[order.origin]}
                      </StatusBadge>
                      {!order.paid && <StatusBadge tone="danger">Pago pendiente</StatusBadge>}
                    </div>
                    <p className="mt-1 text-xs text-body">
                      {order.customerName} · {order.customerCity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-data text-sm font-semibold text-ink">
                      {formatPrice(orderTotal(order))}
                    </span>
                    <StatusBadge tone={ORDER_STATUS_TONE[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </StatusBadge>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-ink/10 p-5">
                    {!order.paid && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                        <div>
                          <p className="text-sm font-bold text-red-600">Pago pendiente</p>
                          <p className="mt-0.5 text-xs text-body">
                            Todavía no cuenta en los resúmenes de ventas. Marcalo pagado apenas confirmes el cobro.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markPaid(order.id, true)}
                          className="shrink-0 cursor-pointer touch-manipulation rounded-lg bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md"
                        >
                          Marcar como pagado
                        </button>
                      </div>
                    )}
                    {(order.customerEmail || order.customerAddress || order.notes || order.customerPhone) && (
                      <div className="mb-4 rounded-xl border border-ink/10 bg-background p-4 text-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-body">Datos del cliente</p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="col-span-2 sm:col-span-1"><dt className="text-[11px] text-body">Nombre</dt><dd className="truncate font-semibold text-ink">{order.customerName}</dd></div>
                          {order.customerPhone && <div><dt className="text-[11px] text-body">WhatsApp / teléfono</dt><dd className="truncate font-semibold text-ink">{order.customerPhone}</dd></div>}
                          {order.customerEmail && <div className="col-span-2 sm:col-span-1"><dt className="text-[11px] text-body">Email</dt><dd className="break-all font-semibold text-ink">{order.customerEmail}</dd></div>}
                          {order.customerDoc && <div><dt className="text-[11px] text-body">DNI / CUIT</dt><dd className="truncate font-semibold text-ink">{order.customerDoc}</dd></div>}
                          {order.shippingMethod && (
                            <div><dt className="text-[11px] text-body">Entrega</dt><dd className="truncate font-semibold text-ink">{order.shippingMethod === "envio" ? "Envío a domicilio" : "Retiro en el local"}</dd></div>
                          )}
                          {order.customerAddress && (
                            <div className="col-span-2">
                              <dt className="text-[11px] text-body">Dirección de entrega</dt>
                              <dd className="font-semibold text-ink">
                                {[order.customerAddress, order.customerCity, order.customerProvince, order.customerPostal && `CP ${order.customerPostal}`].filter(Boolean).join(", ")}
                              </dd>
                            </div>
                          )}
                          {order.notes && (
                            <div className="col-span-2"><dt className="text-[11px] text-body">Notas del cliente</dt><dd className="text-ink">{order.notes}</dd></div>
                          )}
                        </dl>
                      </div>
                    )}
                    <ul className="flex flex-col gap-2.5 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex items-center justify-between gap-3 text-body"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink/10 ${
                                item.product?.images?.[0] ? "bg-white" : `bg-gradient-to-br ${item.product?.gradient ?? ""}`
                              }`}
                            >
                              {item.product?.images?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              )}
                            </div>
                            <span className="truncate">
                              {item.product?.name ?? "Producto"} x{item.qty}
                            </span>
                          </div>
                          <span className="font-data shrink-0 text-ink">
                            {formatPrice((item.product?.priceUSD ?? 0) * item.qty)}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3 border-t border-ink/10 pt-2 text-body">
                        <span className="shrink-0">Envío ({zone?.region})</span>
                        <span className="font-data shrink-0 text-ink">
                          {formatPrice(zone?.priceUSD ?? 0)}
                        </span>
                      </li>
                      {order.payments.length > 1 ? (
                        <li className="flex flex-col gap-1 text-body">
                          <span>Pago combinado:</span>
                          <ul className="flex flex-col gap-1 pl-3">
                            {order.payments.map((p, i) => (
                              <li key={i} className="flex justify-between">
                                <span>
                                  {PAYMENT_METHOD_LABELS[p.method]}
                                  {p.notes ? ` — ${p.notes}` : ""}
                                </span>
                                <span className="font-data text-ink">
                                  {p.currency === "USD" ? "US$" : "$"} {p.amount}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <li className="flex justify-between gap-3 text-body">
                          <span className="shrink-0">Método de pago</span>
                          <span className="text-right text-ink">
                            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                            {order.paymentCurrency === "USD" ? " (dólares)" : ""}
                          </span>
                        </li>
                      )}
                      {order.changeGiven != null && order.changeGiven > 0 && (
                        <li className="flex justify-between gap-3 text-body">
                          <span className="shrink-0">Vuelto</span>
                          <span className="font-data shrink-0 text-ink">
                            {order.paymentCurrency === "USD" ? "US$" : "$"} {order.changeGiven.toFixed(2)}
                          </span>
                        </li>
                      )}
                      {order.payments.length <= 1 && order.paymentNotes && (
                        <li className="text-body">
                          <span className="text-xs">Nota de pago</span>
                          <p className="mt-0.5 text-ink">{order.paymentNotes}</p>
                        </li>
                      )}
                    </ul>

                    <div className="mt-4">
                      <StatusSelect
                        label="Estado del pedido"
                        value={order.status}
                        onChange={(status) => updateStatus(order.id, status)}
                        options={(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({
                          value: status,
                          label: ORDER_STATUS_LABELS[status],
                          tone: ORDER_STATUS_TONE[status],
                        }))}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink/10 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(order.customerPhone, orderStatusMessage(order, settings.storeName))
                        }
                        title={`Avisar por WhatsApp a ${order.customerPhone}`}
                        className="flex cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight text-green-600 shadow-sm transition-all hover:shadow-md sm:text-xs"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
                          <path d="M12.01 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.01 22C17.53 22 22 17.52 22 12S17.53 2 12.01 2Zm5.4 14.27c-.23.64-1.13 1.18-1.85 1.33-.49.1-1.13.18-3.29-.7-2.76-1.14-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.84 0-1.35.7-2.01.96-2.28.23-.24.5-.3.66-.3h.48c.16 0 .37-.06.58.44l.7 1.68c.06.14.1.3.02.48-.08.18-.12.3-.24.46-.12.16-.26.35-.37.47-.12.13-.25.27-.11.53.14.26.64 1.05 1.37 1.7.94.84 1.73 1.1 1.99 1.23.26.12.42.1.57-.06.16-.16.65-.75.83-1.01.18-.26.36-.22.6-.13.25.09 1.58.75 1.85.88.27.13.45.2.52.31.07.12.07.66-.16 1.31Z" />
                        </svg>
                        Avisar por WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => openWhatsApp(order.customerPhone, orderPaymentMessage(order, settings.storeName))}
                        title={`Preguntarle a ${order.customerName.split(" ")[0]} cómo quiere pagar`}
                        className="flex cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight text-gold-600 shadow-sm transition-all hover:shadow-md sm:text-xs"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                          <path d="M2.5 9.5h19" />
                        </svg>
                        Coordinar el pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setReciboOrder(order)}
                        className="col-span-2 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2.5 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
                      >
                        Imprimir comprobante
                      </button>
                      {order.paid && order.origin === "tienda" && (
                        <button
                          type="button"
                          onClick={() => markPaid(order.id, false)}
                          className="col-span-2 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2.5 text-xs font-semibold text-body shadow-sm transition-all hover:shadow-md"
                        >
                          Marcar como no pagado
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-body">No hay pedidos con ese filtro.</p>
          )}
        </div>
      </div>

      {manualOpen && (
        <div data-sheet className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setManualOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={handleManualSubmit}
            className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Nuevo pedido interno</h2>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="Cliente">
                <input
                  required
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="Nombre del cliente"
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <input
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
                <Field label="Ciudad">
                  <input
                    value={manualForm.customerCity}
                    onChange={(e) => setManualForm({ ...manualForm, customerCity: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
              </div>

              <Field label="Zona de envío">
                <select
                  value={manualForm.shippingZoneId}
                  onChange={(e) => setManualForm({ ...manualForm, shippingZoneId: e.target.value })}
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.region}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Método de pago">
                <div className="flex gap-2">
                  {PAYMENT_LINE_METHODS.map((method) => (
                    <Chip
                      key={method}
                      active={manualForm.paymentMethod === method}
                      onClick={() => setManualForm({ ...manualForm, paymentMethod: method })}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Productos (del inventario interno)">
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-ink/10">
                  {matchingProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addManualItem(p.id)}
                      className="flex w-full cursor-pointer touch-manipulation items-center justify-between border-b border-ink/10 px-3 py-2 text-left text-xs last:border-0 hover:bg-cream-200"
                    >
                      <span className="text-ink">{p.name}</span>
                      <span className="font-data text-body">{formatPrice(p.priceUSD)}</span>
                    </button>
                  ))}
                  {matchingProducts.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-body">Sin resultados.</p>
                  )}
                </div>
              </Field>

              {manualItems.length > 0 && (
                <div className="rounded-lg border border-ink/10 bg-background p-3">
                  <p className="text-xs font-semibold text-ink">Carrito del pedido</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {manualItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <li key={item.productId} className="flex items-center justify-between text-xs">
                          <span className="text-ink">
                            {item.qty}x {product?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeManualItem(item.productId)}
                            className="cursor-pointer touch-manipulation text-red-500 hover:underline"
                          >
                            Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={manualItems.length === 0 || !manualForm.customerName.trim()}
              className="sticky bottom-0 mt-6 rounded-lg bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              Crear pedido interno
            </button>
          </form>
        </div>
      )}

      {reciboOrder && (
        <PrintDocument title="Comprobante de pedido" onClose={() => setReciboOrder(null)}>
          {(() => {
            const items = getOrderItemsWithProduct(reciboOrder, products);
            const zone = zones.find((z) => z.id === reciboOrder.shippingZoneId);
            const itemsTotal = items.reduce(
              (sum, i) => sum + (i.product?.priceUSD ?? 0) * i.qty,
              0,
            );
            const total = itemsTotal + (zone?.priceUSD ?? 0);
            return (
              <>
                <div>
                  Pedido: <b>{reciboOrder.id}</b>
                </div>
                <div>Fecha: {new Date(reciboOrder.createdAt).toLocaleDateString("es-AR")}</div>
                <div>Cliente: {reciboOrder.customerName}</div>
                <div>Ciudad: {reciboOrder.customerCity}</div>
                <div className="bh-recibo-line" />
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>
                      {item.qty}x {item.product?.name ?? "Producto"}
                    </span>
                    <span>{formatPrice((item.product?.priceUSD ?? 0) * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Envío ({zone?.region})</span>
                  <span>{formatPrice(zone?.priceUSD ?? 0)}</span>
                </div>
                <div className="bh-recibo-line" />
                <div className="flex justify-between text-base font-bold">
                  <span>TOTAL</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="mt-2">Método de pago: {PAYMENT_METHOD_LABELS[reciboOrder.paymentMethod]}</div>
                <div className="bh-recibo-line" />
                <p className="text-[11px] opacity-75">Conserve este comprobante como constancia de su compra.</p>
              </>
            );
          })()}
        </PrintDocument>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
