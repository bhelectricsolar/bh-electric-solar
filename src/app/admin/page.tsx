"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminSettings } from "@/lib/admin-settings";
import { SECTORS, ICONS, ACCENT_TEXT, ACCENT_BG_SOFT } from "@/lib/admin-sectors";
import { getOrders, ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import { getProducts, type Product } from "@/lib/products";
import { getProjects, PROJECT_STAGES, type Project } from "@/lib/projects";
import { getTeam, type TeamMember } from "@/lib/team";
import { getCustomers, type Customer } from "@/lib/customers";
import { getAllOpenSessions, type CashSession } from "@/lib/caja";

const LEAD_STALE_DAYS = 3;

type ActivityItem = { key: string; date: string; text: string };

export default function AdminPage() {
  const { settings, formatPrice } = useAdminSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openSessions, setOpenSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts(), getProjects(), getTeam(), getCustomers(), getAllOpenSessions()])
      .then(([o, p, pr, t, c, s]) => {
        setOrders(o);
        setProducts(p);
        setProjects(pr);
        setTeam(t);
        setCustomers(c);
        setOpenSessions(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const newOrders = orders.filter((o) => o.status === "nuevo" || o.status === "en_proceso").length;
  const lowStock = products.filter((p) => p.stock <= settings.lowStockThreshold).length;
  const activeProjects = projects.filter((p) => p.status !== "mantenimiento").length;

  const today = new Date().toDateString();
  const salesTodayUSD = orders
    .filter((o) => new Date(o.createdAt).toDateString() === today)
    .reduce(
      (sum, o) =>
        sum +
        o.items.reduce((s, item) => {
          const product = products.find((p) => p.id === item.productId);
          return s + (product?.priceUSD ?? 0) * item.qty;
        }, 0),
      0,
    );

  const staleLeads = customers.filter((c) => {
    if (c.status !== "lead") return false;
    const days = (Date.now() - new Date(c.createdAt).getTime()) / 86400000;
    return days >= LEAD_STALE_DAYS;
  });

  const activity: ActivityItem[] = [
    ...orders.map((o) => ({
      key: `order-${o.id}`,
      date: o.createdAt,
      text: `Pedido ${o.id} · ${o.customerName} — ${ORDER_STATUS_LABELS[o.status]}`,
    })),
    ...projects.map((p) => ({
      key: `project-${p.id}`,
      date: p.createdAt,
      text: `Proyecto ${p.id} · ${p.customerName} — ${PROJECT_STAGES.find((s) => s.value === p.status)?.label}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold-600">
          Panel de administración
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
          Hola, {settings.storeName} 👋
        </h1>
        <p className="mt-1 text-sm text-body">Esto es lo que necesita tu atención hoy.</p>

        {loading ? (
          <p className="mt-6 text-sm text-body">Cargando panel…</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                href="/admin/pedidos"
                label="Pedidos pendientes"
                value={newOrders}
                accent={newOrders > 0}
              />
              <StatCard label="Ventas de hoy" value={formatPrice(salesTodayUSD)} />
              <StatCard
                href="/admin/stock"
                label="Productos con poco stock"
                value={lowStock}
                accent={lowStock > 0}
                tone="danger"
              />
              <StatCard
                href="/admin/caja"
                label="Cajas abiertas ahora"
                value={openSessions.length}
                accent={openSessions.length > 0}
                tone="done"
              />
              <StatCard
                href="/admin/clientes"
                label="Leads sin atender"
                value={staleLeads.length}
                accent={staleLeads.length > 0}
                tone="danger"
              />
              <StatCard href="/admin/proyectos" label="Proyectos activos" value={activeProjects} />
            </div>

            {openSessions.length > 0 && (
              <p className="mt-3 text-xs text-body">
                Caja abierta:{" "}
                {openSessions
                  .map((s) => team.find((m) => m.id === s.openedBy)?.name.split(" ")[0] ?? "—")
                  .join(", ")}
              </p>
            )}

            {staleLeads.length > 0 && (
              <Link
                href="/admin/clientes"
                className="mt-4 flex items-center justify-between rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm font-semibold text-gold-600 transition-all hover:bg-gold-500/15"
              >
                <span>
                  {staleLeads.length} lead{staleLeads.length > 1 ? "s" : ""} lleva
                  {staleLeads.length > 1 ? "n" : ""} {LEAD_STALE_DAYS}+ días sin atender
                </span>
                <span>Ver →</span>
              </Link>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {SECTORS.map((sector) => (
                <Link
                  key={sector.id}
                  href={sector.items[0]?.href ?? "/admin"}
                  className="group flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ACCENT_BG_SOFT[sector.accent]} ${ACCENT_TEXT[sector.accent]}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICONS[sector.icon]} />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-ink">{sector.label}</h2>
                    <p className="mt-0.5 text-xs text-body">{sector.tagline}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-body transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-bold text-ink">Actividad reciente</h2>
              {activity.length === 0 ? (
                <p className="mt-4 text-sm text-body">Todavía no hay movimientos.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {activity.map((a) => (
                    <li key={a.key} className="flex items-center justify-between gap-3 border-b border-ink/10 pb-2 text-sm last:border-0 last:pb-0">
                      <span className="text-ink">{a.text}</span>
                      <span className="font-data shrink-0 text-xs text-body">
                        {new Date(a.date).toLocaleDateString("es-AR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StatCard({
  href,
  label,
  value,
  accent,
  tone = "gold",
}: {
  href?: string;
  label: string;
  value: string | number;
  accent?: boolean;
  tone?: "gold" | "danger" | "done";
}) {
  const toneClass = accent
    ? tone === "danger"
      ? "text-red-500"
      : tone === "done"
        ? "text-green-600"
        : "text-gold-600"
    : "text-ink";

  const content = (
    <div className="rounded-2xl border border-ink/10 bg-surface p-3.5 shadow-sm transition-all hover:shadow-md sm:p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-body sm:text-[11px]">{label}</p>
      <p className={`font-data mt-1.5 text-lg font-semibold sm:text-xl ${toneClass}`}>{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
