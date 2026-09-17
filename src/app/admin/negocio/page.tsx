"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SECTORS, ICONS } from "@/lib/admin-sectors";
import { getOrders, ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import { getProjects, PROJECT_STAGES, type Project } from "@/lib/projects";
import { getTeam, type TeamMember } from "@/lib/team";

const sector = SECTORS.find((s) => s.id === "negocio")!;

type ActivityItem = { key: string; date: string; text: string };

export default function AdminNegocioHubPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    Promise.all([getOrders(), getProjects(), getTeam()]).then(([o, p, t]) => {
      setOrders(o);
      setProjects(p);
      setTeam(t);
    });
  }, []);

  const activeProjects = projects.filter((p) => p.status !== "mantenimiento").length;

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
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-body hover:text-ink">
          ← Inicio
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-negocio">Sistema 2 de 3</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{sector.label}</h1>
        <p className="mt-1 text-sm text-body">{sector.tagline} — la operación diaria de BH, más allá de la tienda.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard label="Proyectos activos" value={activeProjects} />
          <StatCard label="Personas en el equipo" value={team.length} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {sector.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-2xl border border-ink/10 bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-negocio/30 hover:shadow-[0_25px_60px_-25px_rgba(29,84,201,0.35)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-negocio/15 text-negocio transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[item.icon]} />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-bold text-ink">{item.label}</h2>
                <p className="mt-1 text-sm text-body">{item.description}</p>
              </div>
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
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-3.5 shadow-sm sm:p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-body sm:text-[11px]">{label}</p>
      <p className="font-data mt-1.5 text-lg font-semibold text-ink sm:text-xl">{value}</p>
    </div>
  );
}
