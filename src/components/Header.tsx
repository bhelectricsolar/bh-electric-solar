"use client";

import Link from "next/link";
import { useState } from "react";
import CartButton from "./store/CartButton";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Tienda", href: "/tienda" },
  { label: "Beneficios", href: "/beneficios" },
  { label: "Proyectos", href: "/#proyectos" },
  { label: "Presupuesto Personalizado", href: "/contacto" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 rounded-2xl border border-black/5 bg-white/90 px-5 py-3 shadow-[0_10px_30px_-12px_rgba(16,28,61,0.25)] backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900">
            <svg viewBox="0 0 32 32" className="h-6 w-6">
              <path d="M16 2 29 9v14L16 30 3 23V9Z" fill="none" stroke="#ffb648" strokeWidth="1.4" />
              <path d="M16 2v28M3 9l13 7 13-7M3 23l13-7 13 7" stroke="#ffb648" strokeWidth="1.1" opacity="0.55" />
              <circle cx="16" cy="16" r="3.2" fill="#ffb648" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-navy-900">
              BH Electric Solar
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-600">
              Ingeniería internacional
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-navy-900/80 transition-colors hover:text-navy-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartButton />
          <Link
            href="/calculadora-solar"
            className="hidden rounded-lg bg-navy-900 px-5 py-2.5 text-center text-sm font-semibold leading-tight text-white transition-colors hover:bg-navy-800 sm:block"
          >
            Calcular
            <br />
            Proyecto
          </Link>
          <button
            type="button"
            aria-label={open ? "Cerrar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 cursor-pointer touch-manipulation place-items-center rounded-lg border border-navy-900/10 text-navy-900 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-menu-in mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-[0_30px_60px_-20px_rgba(12,24,48,0.45)] backdrop-blur-xl lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-cream-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/calculadora-solar"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-lg bg-navy-900 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(12,24,48,0.6)]"
          >
            Calcular Proyecto
          </Link>
        </div>
      )}
    </header>
  );
}
