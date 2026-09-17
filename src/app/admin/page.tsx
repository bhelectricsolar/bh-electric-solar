"use client";

import Link from "next/link";
import { useAdminSettings } from "@/lib/admin-settings";
import {
  SECTORS,
  ICONS,
  ACCENT_TEXT,
  ACCENT_BG_SOFT,
  ACCENT_SHADOW,
  ACCENT_GLOW,
} from "@/lib/admin-sectors";

export default function AdminPage() {
  const { settings } = useAdminSettings();

  return (
    <section className="flex min-h-full flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold-600">
            Panel de administración
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Hola, {settings.storeName} 👋
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-body">
            ¿Qué querés administrar hoy? Elegí uno de los tres sistemas para
            empezar.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {SECTORS.map((sector) => (
            <Link
              key={sector.id}
              href={sector.items[0]?.href ?? "/admin"}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-ink/10 bg-surface p-7 shadow-md transition-all hover:-translate-y-1.5 ${ACCENT_SHADOW[sector.accent]}`}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${ACCENT_GLOW[sector.accent]}`}
              />

              <span
                className={`relative grid h-16 w-16 place-items-center rounded-2xl ${ACCENT_BG_SOFT[sector.accent]} ${ACCENT_TEXT[sector.accent]} transition-transform duration-300 group-hover:scale-105`}
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[sector.icon]} />
                </svg>
              </span>

              <div className="relative">
                <h2 className="text-xl font-extrabold text-ink">{sector.label}</h2>
                <p className="mt-1 text-sm text-body">{sector.tagline}</p>
              </div>

              <div className="relative flex flex-wrap gap-1.5">
                {sector.items.slice(0, 4).map((item) => (
                  <span
                    key={item.href}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ACCENT_BG_SOFT[sector.accent]} ${ACCENT_TEXT[sector.accent]}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICONS[item.icon]} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <span className={`relative mt-1 flex items-center gap-1.5 text-sm font-bold ${ACCENT_TEXT[sector.accent]}`}>
                Entrar
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
