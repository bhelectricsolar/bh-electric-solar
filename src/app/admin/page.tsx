"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminSettings } from "@/lib/admin-settings";
import { ICONS } from "@/lib/admin-sectors";
import {
  getOrders,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { getProducts, type Product } from "@/lib/products";
import { getProjects, PROJECT_STAGES, type Project } from "@/lib/projects";
import { getTeam, getDevTeamMemberIds, type TeamMember } from "@/lib/team";
import { getCustomers, type Customer } from "@/lib/customers";
import { getAllOpenSessions, getCashHistory, type CashSession } from "@/lib/caja";
import { useCurrentDeveloper } from "@/lib/current-user";
import { getShippingZones, type ShippingZone } from "@/lib/shipping";
import { useLiveRefresh } from "@/lib/realtime";
import { computeStats, rangeBounds, RANGE_OPTIONS, type Range } from "@/lib/dashboard-stats";
import Chip from "@/components/admin/Chip";
import StatusBadge from "@/components/admin/StatusBadge";

const LEAD_STALE_DAYS = 3;

const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fmtUSD = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtUSD2 = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function AdminPage() {
  const { settings } = useAdminSettings();
  const { developer, loading: devLoading } = useCurrentDeveloper();
  // El desarrollador ve también sus ventas de prueba (con interruptor);
  // el dueño nunca las ve.
  const [showDev, setShowDev] = useState(true);
  const includeDev = !!developer && showDev;
  const [range, setRange] = useState<Range>("hoy");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [openSessions, setOpenSessions] = useState<CashSession[]>([]);
  const [closedSessions, setClosedSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, p, pr, t, c, s, devIds, z, hist] = await Promise.all([
        getOrders(),
        getProducts(),
        getProjects(),
        getTeam(includeDev),
        getCustomers(),
        getAllOpenSessions(includeDev),
        getDevTeamMemberIds(),
        getShippingZones(),
        getCashHistory(),
      ]);
      // Las ventas y cajas de prueba del desarrollador no son del negocio.
      setOrders(includeDev ? o : o.filter((ord) => !devIds.includes(ord.soldBy ?? "")));
      setClosedSessions(includeDev ? hist : hist.filter((h) => !devIds.includes(h.openedBy ?? "")));
      setProducts(p);
      setProjects(pr);
      setTeam(t);
      setCustomers(c);
      setOpenSessions(s);
      setZones(z);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      console.error("Inicio:", err);
      setError("No pudimos actualizar los datos. Se reintenta solo.");
    } finally {
      setLoading(false);
    }
  }, [includeDev]);

  useEffect(() => {
    if (devLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, devLoading]);

  const live = useLiveRefresh(
    [
      "orders",
      "order_items",
      "order_payments",
      "products",
      "customers",
      "cash_sessions",
      "cash_movements",
      "projects",
      "team_members",
    ],
    load,
  );

  const bounds = useMemo(() => rangeBounds(range), [range]);
  const ordersInRange = useMemo(
    () => orders.filter((o) => !bounds.from || new Date(o.createdAt) >= bounds.from),
    [orders, bounds],
  );
  const prevOrders = useMemo(
    () =>
      bounds.prevFrom && bounds.prevTo
        ? orders.filter((o) => {
            const d = new Date(o.createdAt);
            return d >= bounds.prevFrom! && d < bounds.prevTo!;
          })
        : [],
    [orders, bounds],
  );
  const closedInRange = useMemo(
    () => closedSessions.filter((c) => !bounds.from || (c.closedAt && new Date(c.closedAt) >= bounds.from)),
    [closedSessions, bounds],
  );

  const stats = useMemo(
    () =>
      computeStats({
        orders: ordersInRange,
        prevOrders,
        products,
        zones,
        team,
        openSessions,
        closedSessions: closedInRange,
        exchangeRate: settings.exchangeRate,
      }),
    [ordersInRange, prevOrders, products, zones, team, openSessions, closedInRange, settings.exchangeRate],
  );

  const pendingOrders = orders.filter((o) => o.status === "nuevo" || o.status === "en_proceso").length;
  const lowStockProducts = products.filter((p) => p.stock <= settings.lowStockThreshold);
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const activeProjects = projects.filter((p) => p.status !== "mantenimiento").length;
  const clients = customers.filter((c) => c.status === "cliente").length;
  const leads = customers.filter((c) => c.status === "lead");
  const staleLeads = leads.filter(
    (c) => (Date.now() - new Date(c.lastContactedAt ?? c.createdAt).getTime()) / 86400000 >= LEAD_STALE_DAYS,
  );

  const delta =
    stats.prevTotalUSD > 0 ? ((stats.all.totalUSD - stats.prevTotalUSD) / stats.prevTotalUSD) * 100 : null;
  const recent = orders.slice(0, 10);
  const rate = settings.exchangeRate;

  return (
    <section className="px-4 py-5 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold-600">Panel de administración</p>
            <h1 className="mt-1.5 text-2xl font-extrabold text-ink sm:text-3xl">Resumen total</h1>
            <p className="mt-1 text-sm text-body">Todo tu negocio en un solo lugar, en vivo.</p>
          </div>
          <LiveBadge live={live} updatedAt={updatedAt} />
        </div>

        <Link
          href="/admin/caja?venta=1"
          className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-gold-500 px-6 py-5 text-lg font-extrabold text-navy-950 shadow-[0_14px_36px_-10px_rgba(245,154,31,0.65)] transition-all hover:brightness-105 active:scale-[0.99] sm:py-6 sm:text-xl"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS.bag} />
          </svg>
          Vender ahora
          <span className="hidden text-sm font-semibold opacity-75 sm:inline">· registrar una venta directa</span>
        </Link>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-body">Cargando panel…</p>
        ) : (
          <>
            {developer && (
              <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5">
                <Chip active={showDev} onClick={() => setShowDev((v) => !v)}>
                  Incluir mis ventas de prueba
                </Chip>
                <span className="text-[11px] text-body">Solo las ves vos — el dueño no las ve.</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((opt) => (
                <Chip key={opt.value} active={range === opt.value} onClick={() => setRange(opt.value)}>
                  {opt.label}
                </Chip>
              ))}
            </div>

            <Heading>Ventas del período</Heading>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi
                label="Ventas totales"
                value={fmtUSD.format(stats.all.totalUSD)}
                sub={`≈ ${fmtARS.format(stats.all.totalUSD * rate)}`}
                accent
                note={
                  delta == null
                    ? undefined
                    : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}% vs período anterior`
                }
                noteTone={delta == null ? undefined : delta >= 0 ? "good" : "bad"}
              />
              <Kpi
                label="Cobrado"
                value={fmtARS.format(stats.collectedARS)}
                sub="todas las formas de pago"
              />
              <Kpi
                label="Cantidad de ventas"
                value={String(stats.all.orders)}
                sub={`ticket prom. ${fmtUSD.format(stats.all.avgTicketUSD)}`}
              />
              <Kpi
                label="Margen estimado"
                value={fmtUSD.format(stats.all.marginUSD)}
                sub={`≈ ${fmtARS.format(stats.all.marginUSD * rate)}`}
              />
            </div>

            <Heading>Por canal de venta</Heading>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChannelCard title="Local / punto de venta" tone="negocio" data={stats.local} rate={rate} />
              <ChannelCard title="Tienda online" tone="tienda" data={stats.tienda} rate={rate} />
            </div>

            <Heading>Cobros por forma de pago</Heading>
            <Panel>
              {stats.methods.length === 0 ? (
                <Empty>Sin cobros en este período.</Empty>
              ) : (
                <ul className="flex flex-col gap-4">
                  {stats.methods.map((m) => {
                    const share = stats.collectedARS > 0 ? (m.amountARS / stats.collectedARS) * 100 : 0;
                    return (
                      <li key={m.key}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold text-ink">
                            {PAYMENT_METHOD_LABELS[m.method]}
                            {m.currency === "USD" ? " · dólares" : ""}
                            <span className="ml-2 text-xs font-normal text-body">
                              {m.count} pago{m.count > 1 ? "s" : ""}
                            </span>
                          </span>
                          <span className="font-data text-sm font-semibold text-ink">
                            {m.currency === "USD" ? fmtUSD2.format(m.amount) : fmtARS.format(m.amount)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                          <div className="h-full rounded-full bg-gold-500" style={{ width: `${share}%` }} />
                        </div>
                        <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-body">
                          <span>{share.toFixed(0)}% del total</span>
                          {m.currency === "USD" && <span>≈ {fmtARS.format(m.amountARS)}</span>}
                          <span>Local {fmtARS.format(m.byChannel.local)}</span>
                          <span>Tienda {fmtARS.format(m.byChannel.tienda)}</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
              {stats.all.combined > 0 && (
                <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-body">
                  {stats.all.combined} venta{stats.all.combined > 1 ? "s" : ""} con pago combinado (ya
                  desglosadas arriba, línea por línea).
                </p>
              )}
            </Panel>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <Heading>Cuotas por tarjeta y plan</Heading>
                <Panel>
                  {stats.installments.length === 0 ? (
                    <Empty>Sin ventas en cuotas en este período.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {stats.installments.map((i) => (
                        <li key={i.key} className="rounded-lg border border-ink/10 bg-background p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-ink">{i.label}</span>
                            <span className="text-xs text-body">
                              {i.count} venta{i.count > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-body">
                            {i.installments ? `${i.installments} cuotas` : "cuotas"}
                            {i.surchargePct != null ? ` · ${i.surchargePct}% recargo` : ""}
                          </p>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-body">Base {fmtARS.format(i.baseARS)}</span>
                            <span className="font-data font-semibold text-ink">
                              Con recargo {fmtARS.format(i.withSurchargeARS)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

              <div>
                <Heading>Cheques recibidos</Heading>
                <Panel>
                  {stats.cheques.length === 0 ? (
                    <Empty>Sin cheques en este período.</Empty>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-body">
                        {stats.cheques.length} cheque{stats.cheques.length > 1 ? "s" : ""} ·{" "}
                        <b className="text-ink">
                          {fmtARS.format(stats.cheques.reduce((s, c) => s + c.amountARS, 0))}
                        </b>
                      </p>
                      <ul className="flex flex-col gap-2">
                        {stats.cheques.slice(0, 8).map((c, idx) => (
                          <li key={`${c.orderId}-${idx}`} className="rounded-lg border border-ink/10 bg-background p-3 text-xs">
                            <div className="flex justify-between gap-2">
                              <span className="font-semibold text-ink">{c.customer}</span>
                              <span className="font-data font-semibold text-ink">
                                {c.currency === "USD" ? fmtUSD2.format(c.amount) : fmtARS.format(c.amount)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-body">
                              {c.notes || "Sin datos del cheque"} · {new Date(c.date).toLocaleDateString("es-AR")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Panel>
              </div>
            </div>

            <Heading>Cajas</Heading>
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel>
                <p className="text-xs font-bold uppercase tracking-wide text-body">Abiertas ahora ({stats.cashRows.length})</p>
                {stats.cashRows.length === 0 ? (
                  <Empty>No hay cajas abiertas.</Empty>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {stats.cashRows.map((c) => (
                      <li key={c.sessionId} className="rounded-lg border border-ink/10 bg-background p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">{c.name}</span>
                          <StatusBadge tone="done">Abierta</StatusBadge>
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-body">
                          <dt>Monto inicial</dt>
                          <dd className="font-data text-right text-ink">{fmtARS.format(c.opening)}</dd>
                          <dt>Ventas en efectivo hoy</dt>
                          <dd className="font-data text-right text-ink">{fmtARS.format(c.cashSales)}</dd>
                          <dt>Ingresos / egresos</dt>
                          <dd className="font-data text-right text-ink">
                            +{fmtARS.format(c.ingresos)} / -{fmtARS.format(c.egresos)}
                          </dd>
                          <dt className="font-semibold text-ink">Total esperado</dt>
                          <dd className="font-data text-right font-bold text-gold-600">{fmtARS.format(c.expected)}</dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel>
                <p className="text-xs font-bold uppercase tracking-wide text-body">Cierres del período</p>
                <p className="font-data mt-2 text-2xl font-semibold text-ink">{stats.closes.count}</p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    stats.closes.difference === 0
                      ? "text-green-600"
                      : stats.closes.difference > 0
                        ? "text-gold-600"
                        : "text-red-500"
                  }`}
                >
                  {stats.closes.count === 0
                    ? "Todavía no se cerró ninguna caja."
                    : stats.closes.difference === 0
                      ? "Sin diferencias de caja"
                      : stats.closes.difference > 0
                        ? `Sobran ${fmtARS.format(stats.closes.difference)} en total`
                        : `Faltan ${fmtARS.format(-stats.closes.difference)} en total`}
                </p>
              </Panel>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <Heading>Ventas por vendedor</Heading>
                <Panel>
                  {stats.sellers.length === 0 ? (
                    <Empty>Sin ventas en este período.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {stats.sellers.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-ink">
                            {s.name}
                            <span className="ml-2 text-xs text-body">{s.orders} venta{s.orders > 1 ? "s" : ""}</span>
                          </span>
                          <span className="font-data font-semibold text-ink">{fmtUSD.format(s.totalUSD)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
              <div>
                <Heading>Productos más vendidos</Heading>
                <Panel>
                  {stats.topProducts.length === 0 ? (
                    <Empty>Sin ventas en este período.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {stats.topProducts.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-ink">{p.name}</span>
                          <span className="font-data shrink-0 text-xs text-body">
                            {p.units} u. · {fmtUSD.format(p.revenueUSD)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </div>

            <Heading>Estado del negocio</Heading>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi href="/admin/pedidos" label="Pedidos pendientes" value={String(pendingOrders)} tone={pendingOrders > 0 ? "gold" : undefined} />
              <Kpi
                href="/admin/stock"
                label="Poco stock"
                value={String(lowStockProducts.length)}
                sub={outOfStock > 0 ? `${outOfStock} sin stock` : undefined}
                tone={lowStockProducts.length > 0 ? "bad" : undefined}
              />
              <Kpi href="/admin/leads" label="Leads sin atender" value={String(staleLeads.length)} sub={`${leads.length} leads en total`} tone={staleLeads.length > 0 ? "bad" : undefined} />
              <Kpi href="/admin/clientes" label="Clientes" value={String(clients)} />
              <Kpi href="/admin/proyectos" label="Proyectos activos" value={String(activeProjects)} />
              <Kpi
                href="/admin/stock"
                label="Unidades en stock"
                value={String(stats.inventory.units)}
                sub={`costo ${fmtUSD.format(stats.inventory.costValueUSD)}`}
              />
              <Kpi
                label="Valor del inventario"
                value={fmtUSD.format(stats.inventory.saleValueUSD)}
                sub="a precio de venta"
              />
              <Kpi
                href="/admin/caja"
                label="Cajas abiertas"
                value={String(openSessions.length)}
                tone={openSessions.length > 0 ? "good" : undefined}
              />
            </div>

            {lowStockProducts.length > 0 && (
              <Panel className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-body">Productos con poco stock</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {lowStockProducts.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-ink">{p.name}</span>
                      <span className={`font-data shrink-0 text-xs font-semibold ${p.stock <= 0 ? "text-red-500" : "text-gold-600"}`}>
                        {p.stock <= 0 ? "Sin stock" : `${p.stock} u.`}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {staleLeads.length > 0 && (
              <Link
                href="/admin/leads"
                className="mt-3 flex items-center justify-between rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm font-semibold text-gold-600 transition-all hover:bg-gold-500/15"
              >
                <span>
                  {staleLeads.length} lead{staleLeads.length > 1 ? "s" : ""} lleva
                  {staleLeads.length > 1 ? "n" : ""} {LEAD_STALE_DAYS}+ días sin atender
                </span>
                <span>Ver →</span>
              </Link>
            )}

            <Heading>Proyectos por etapa</Heading>
            <Panel>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                {PROJECT_STAGES.map((s) => (
                  <li key={s.value} className="flex items-center justify-between text-sm">
                    <span className="text-body">{s.label}</span>
                    <span className="font-data font-semibold text-ink">
                      {projects.filter((p) => p.status === s.value).length}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Heading>Últimas operaciones</Heading>
            <Panel>
              {recent.length === 0 ? (
                <Empty>Todavía no hay movimientos.</Empty>
              ) : (
                <ul className="flex flex-col">
                  {recent.map((o) => {
                    const total = o.items.reduce(
                      (s, i) => s + (products.find((p) => p.id === i.productId)?.priceUSD ?? 0) * i.qty,
                      0,
                    );
                    const how =
                      o.payments.length > 1
                        ? "Combinado"
                        : PAYMENT_METHOD_LABELS[o.payments[0]?.method ?? o.paymentMethod];
                    return (
                      <li key={o.id} className="flex items-start justify-between gap-3 border-b border-ink/10 py-2.5 text-sm last:border-0">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{o.customerName}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-body">
                            <span>{o.id}</span>
                            <span>{o.origin === "tienda" ? "Tienda online" : "Local"}</span>
                            <span>{how}</span>
                            <span>{new Date(o.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-data font-semibold text-ink">{fmtUSD.format(total)}</p>
                          <p className="mt-0.5 text-[11px] text-body">{ORDER_STATUS_LABELS[o.status as OrderStatus]}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </>
        )}
      </div>
    </section>
  );
}

function LiveBadge({ live, updatedAt }: { live: boolean; updatedAt: Date | null }) {
  return (
    <div className="shrink-0 text-right">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
          live ? "border-green-500/30 bg-green-500/10 text-green-600" : "border-ink/15 bg-surface text-body"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-body"}`} />
        {live ? "En vivo" : "Conectando…"}
      </span>
      {updatedAt && (
        <p className="mt-1 text-[10px] text-body">
          Actualizado {updatedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-[0.12em] text-body">{children}</h2>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-body">{children}</p>;
}

function Kpi({
  href,
  label,
  value,
  sub,
  note,
  noteTone,
  accent,
  tone,
}: {
  href?: string;
  label: string;
  value: string;
  sub?: string;
  note?: string;
  noteTone?: "good" | "bad";
  accent?: boolean;
  tone?: "gold" | "good" | "bad";
}) {
  const valueColor =
    tone === "bad" ? "text-red-500" : tone === "good" ? "text-green-600" : tone === "gold" || accent ? "text-gold-600" : "text-ink";
  const body = (
    <div className="h-full rounded-2xl border border-ink/10 bg-surface p-3.5 shadow-sm transition-all hover:shadow-md sm:p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-body sm:text-[11px]">{label}</p>
      <p className={`font-data mt-1.5 break-words text-lg font-semibold sm:text-xl ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-body">{sub}</p>}
      {note && (
        <p className={`mt-1 text-[11px] font-semibold ${noteTone === "bad" ? "text-red-500" : "text-green-600"}`}>{note}</p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function ChannelCard({
  title,
  tone,
  data,
  rate,
}: {
  title: string;
  tone: "tienda" | "negocio";
  data: ReturnType<typeof computeStats>["all"];
  rate: number;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone === "negocio" ? "bg-negocio" : "bg-tienda"}`} />
        <h3 className="text-sm font-bold text-ink">{title}</h3>
      </div>
      <p className="font-data mt-3 text-2xl font-semibold text-ink">{fmtUSD.format(data.totalUSD)}</p>
      <p className="text-xs text-body">≈ {fmtARS.format(data.totalUSD * rate)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-ink/10 pt-3 text-xs">
        <dt className="text-body">Ventas</dt>
        <dd className="font-data text-right text-ink">{data.orders}</dd>
        <dt className="text-body">Productos</dt>
        <dd className="font-data text-right text-ink">{fmtUSD.format(data.productsUSD)}</dd>
        <dt className="text-body">Envíos</dt>
        <dd className="font-data text-right text-ink">{fmtUSD.format(data.shippingUSD)}</dd>
        <dt className="text-body">Margen estimado</dt>
        <dd className="font-data text-right text-ink">{fmtUSD.format(data.marginUSD)}</dd>
        <dt className="text-body">Ticket promedio</dt>
        <dd className="font-data text-right text-ink">{fmtUSD.format(data.avgTicketUSD)}</dd>
        <dt className="text-body">Con pago combinado</dt>
        <dd className="font-data text-right text-ink">{data.combined}</dd>
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
          <span key={s} className="rounded-full bg-background px-2.5 py-1 text-[11px] text-body">
            {ORDER_STATUS_LABELS[s]} <b className="text-ink">{data.byStatus[s]}</b>
          </span>
        ))}
      </div>
    </Panel>
  );
}
