"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrders, getOrderItemsWithProduct, type Order } from "@/lib/orders";
import { getProducts, type Product } from "@/lib/products";
import { getProjects, PROJECT_STAGES, PROJECT_STAGE_TONE, type Project } from "@/lib/projects";
import { getDevTeamMemberIds } from "@/lib/team";
import { useAdminSettings } from "@/lib/admin-settings";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import StatusBadge from "@/components/admin/StatusBadge";

type Range = "hoy" | "semana" | "mes" | "todo";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "7 días" },
  { value: "mes", label: "30 días" },
  { value: "todo", label: "Todo" },
];

function rangeStart(range: Range): Date | null {
  const d = new Date();
  if (range === "hoy") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "semana") {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "mes") {
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

export default function AdminReportesPage() {
  const { formatPrice } = useAdminSettings();
  const [range, setRange] = useState<Range>("mes");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts(), getProjects(), getDevTeamMemberIds()])
      .then(([o, p, pr, devIds]) => {
        // Las ventas de prueba del desarrollador no cuentan en los reportes
        // reales del negocio.
        setOrders(o.filter((ord) => !devIds.includes(ord.soldBy ?? "")));
        setProducts(p);
        setProjects(pr);
      })
      .finally(() => setLoading(false));
  }, []);

  const desde = rangeStart(range);
  const ordersInRange = useMemo(
    () => orders.filter((o) => !desde || new Date(o.createdAt) >= desde),
    [orders, desde],
  );

  const totalVentas = ordersInRange.reduce((sum, o) => {
    const items = getOrderItemsWithProduct(o, products);
    return sum + items.reduce((s, i) => s + (i.product?.priceUSD ?? 0) * i.qty, 0);
  }, 0);

  const totalCosto = ordersInRange.reduce((sum, o) => {
    const items = getOrderItemsWithProduct(o, products);
    return sum + items.reduce((s, i) => s + (i.product?.costUSD ?? 0) * i.qty, 0);
  }, 0);

  const margen = totalVentas - totalCosto;

  const unitsByProduct = new Map<string, number>();
  ordersInRange.forEach((o) => {
    o.items.forEach((i) => {
      unitsByProduct.set(i.productId, (unitsByProduct.get(i.productId) ?? 0) + i.qty);
    });
  });
  const topProducts = [...unitsByProduct.entries()]
    .map(([productId, qty]) => ({
      product: products.find((p) => p.id === productId),
      qty,
    }))
    .filter((r) => r.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = Math.max(1, ...topProducts.map((r) => r.qty));

  const projectsByStage = PROJECT_STAGES.map((stage) => ({
    ...stage,
    count: projects.filter((p) => p.status === stage.value).length,
  }));

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Reportes</h1>
        <p className="mt-1 text-sm text-body">Ventas, margen y estado del negocio.</p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — calculado sobre tus pedidos y proyectos reales.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Calculando…</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={range === opt.value} onClick={() => setRange(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Ventas" value={formatPrice(totalVentas)} />
          <StatCard label="Cant. de pedidos" value={ordersInRange.length} />
          <StatCard label="Margen estimado" value={formatPrice(margen)} accent />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Top productos vendidos</h2>
            {topProducts.length === 0 ? (
              <p className="mt-6 text-center text-sm text-body">Sin ventas en este período.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {topProducts.map((row) => (
                  <div key={row.product!.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2 text-ink">{row.product!.name}</span>
                      <span className="font-data shrink-0 text-body">{row.qty} u.</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{ width: `${(row.qty / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Proyectos por etapa</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {projectsByStage.map((s) => (
                <li key={s.value} className="flex items-center justify-between text-sm">
                  <StatusBadge tone={PROJECT_STAGE_TONE[s.value]}>{s.label}</StatusBadge>
                  <span className="font-data font-semibold text-ink">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-body">{label}</p>
      <p className={`font-data mt-1.5 text-xl font-semibold ${accent ? "text-gold-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
