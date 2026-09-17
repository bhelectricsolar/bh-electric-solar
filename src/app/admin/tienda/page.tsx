"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SECTORS, ICONS } from "@/lib/admin-sectors";
import { getProducts, type Product } from "@/lib/products";
import { getOrders, type Order } from "@/lib/orders";
import { useAdminSettings } from "@/lib/admin-settings";

const sector = SECTORS.find((s) => s.id === "tienda")!;

export default function AdminTiendaHubPage() {
  const { settings, formatPrice } = useAdminSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    Promise.all([getProducts(), getOrders()]).then(([p, o]) => {
      setProducts(p);
      setOrders(o);
    });
  }, []);

  const lowStock = products.filter((p) => p.stock <= settings.lowStockThreshold).length;
  const newOrders = orders.filter((o) => o.status === "nuevo").length;

  const today = new Date().toDateString();
  const salesTodayUSD = orders.filter((o) => new Date(o.createdAt).toDateString() === today).reduce(
    (sum, o) =>
      sum +
      o.items.reduce((s, item) => {
        const product = products.find((p) => p.id === item.productId);
        return s + (product?.priceUSD ?? 0) * item.qty;
      }, 0),
    0,
  );

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-body hover:text-ink">
          ← Inicio
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-tienda">Sistema 1 de 3</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{sector.label}</h1>
        <p className="mt-1 text-sm text-body">{sector.tagline} — todo lo que ve el cliente en la tienda.</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Ventas hoy" value={formatPrice(salesTodayUSD)} />
          <StatCard label="Pedidos nuevos" value={newOrders} accent={newOrders > 0} />
          <StatCard label="Poco stock" value={lowStock} accent={lowStock > 0} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {sector.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-2xl border border-ink/10 bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-tienda/30 hover:shadow-[0_25px_60px_-25px_rgba(179,105,10,0.35)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-tienda/15 text-tienda transition-transform group-hover:scale-105">
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
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-3.5 shadow-sm sm:p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-body sm:text-[11px]">{label}</p>
      <p className={`font-data mt-1.5 text-lg font-semibold sm:text-xl ${accent ? "text-tienda" : "text-ink"}`}>{value}</p>
    </div>
  );
}
