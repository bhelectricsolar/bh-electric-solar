"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import FullscreenToggle from "@/components/admin/FullscreenToggle";
import { ICONS, SECTORS, sectorForPath, type Sector } from "@/lib/admin-sectors";
import { useCurrentTeamMember, useCurrentDeveloper, signOut } from "@/lib/current-user";

// Las únicas rutas a las que puede entrar alguien que NO es administrador ni desarrollador.
const RESTRICTED_ALLOWED_PATHS = ["/admin/caja", "/admin/cotizador"];
const RESTRICTED_HOME = "/admin/caja";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { member, loading: memberLoading } = useCurrentTeamMember();
  const { developer, loading: devLoading } = useCurrentDeveloper();
  const pathname = usePathname();
  const router = useRouter();

  const loading = memberLoading || devLoading;
  const isDeveloper = !!developer;
  // El desarrollador tiene acceso total (por encima del dueño) para poder
  // reparar cualquier cosa — nunca queda restringido como un empleado más.
  const isRestricted = !isDeveloper && !!member && member.role !== "admin";

  useEffect(() => {
    if (isRestricted) {
      if (!RESTRICTED_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
        router.replace(RESTRICTED_HOME);
      }
      return;
    }
    // El panel de desarrollador es exclusivo del desarrollador — un admin
    // (el dueño) no debe poder entrar aunque escriba la URL a mano.
    if (!isDeveloper && pathname.startsWith("/admin/developer")) {
      router.replace("/admin");
    }
  }, [isRestricted, isDeveloper, pathname, router]);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <p className="text-sm text-body">Cargando…</p>
      </div>
    );
  }

  if (isRestricted) {
    return <RestrictedShell member={member}>{children}</RestrictedShell>;
  }

  return <FullAdminShell isDeveloper={isDeveloper} developerName={developer?.name}>{children}</FullAdminShell>;
}

function RestrictedShell({
  member,
  children,
}: {
  member: { name: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const roleLabel = member.role === "vendedor" ? "Vendedor" : "Técnico / Instalador";
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-ink/10 bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-navy-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="BH Electric Solar" className="h-full w-full object-contain p-1.5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-ink">{member.name}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-600">
              {roleLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FullscreenToggle compact />
          <button
            type="button"
            onClick={() => signOut()}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="grid h-9 w-9 cursor-pointer touch-manipulation place-items-center rounded-lg border border-ink/15 bg-background text-red-500 shadow-sm hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
            </svg>
          </button>
        </div>
      </header>
      <nav className="flex gap-1 border-b border-ink/10 bg-surface px-3 py-2">
        {RESTRICTED_ALLOWED_PATHS.map((href) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-gold-500 text-navy-950" : "text-ink hover:bg-cream-200"
              }`}
            >
              {href === "/admin/caja" ? "Caja" : "Cotizador solar"}
            </Link>
          );
        })}
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}

const ACCENT_TEXT: Record<Sector["accent"], string> = {
  tienda: "text-tienda",
  negocio: "text-negocio",
};
const ACCENT_BG_SOFT: Record<Sector["accent"], string> = {
  tienda: "bg-tienda/15",
  negocio: "bg-negocio/15",
};
const ACCENT_BG_SOLID: Record<Sector["accent"], string> = {
  tienda: "bg-tienda",
  negocio: "bg-negocio",
};

function FullAdminShell({
  children,
  isDeveloper,
  developerName,
}: {
  children: React.ReactNode;
  isDeveloper?: boolean;
  developerName?: string;
}) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const currentSector = sectorForPath(pathname);
  const isActivePath = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sheetSector = currentSector ?? null;

  // Barra inferior dinámica: en Resumen funciona como selector de sistema
  // (Inicio + los 3 sistemas). Una vez adentro de un sistema, la barra
  // muestra SOLO los menús de ese sistema — "un sistema por pantalla" —
  // en vez de mezclar los 3 a la vez.
  const homeActive = pathname === "/admin";

  const sectorItems = currentSector
    ? currentSector.items.length > 4
      ? currentSector.items.slice(0, 3)
      : currentSector.items
    : [];

  const sectorTabs = currentSector
    ? sectorItems.map((item) => ({
        href: item.href,
        label: item.label,
        icon: ICONS[item.icon],
        active: isActivePath(item.href),
        accentText: ACCENT_TEXT[currentSector.accent],
        accentBg: ACCENT_BG_SOFT[currentSector.accent],
      }))
    : SECTORS.map((sector) => ({
        href: sector.items[0]?.href ?? "/admin",
        label: sector.shortLabel,
        icon: ICONS[sector.icon],
        active: false,
        accentText: ACCENT_TEXT[sector.accent],
        accentBg: ACCENT_BG_SOFT[sector.accent],
      }));

  const needsMore = !!currentSector && currentSector.items.length > 4;
  const bottomBarCols = 1 + sectorTabs.length + (needsMore ? 1 : 0);

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Desktop sidebar — el nav del medio scrollea solo; el logo arriba y
          los botones de abajo (Cerrar sesión incluido) quedan siempre fijos
          y visibles, sin importar cuántos items tenga el menú ni el alto
          de la ventana. */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink/10 bg-surface lg:flex">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5 px-5 pt-5">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-navy-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="BH Electric Solar" className="h-full w-full object-contain p-1.5" />
          </span>
          <span className="text-sm font-bold text-ink">BH Electric Solar</span>
        </Link>

        <nav className="mt-6 min-h-0 flex-1 overflow-y-auto px-5 flex flex-col gap-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
              pathname === "/admin"
                ? "bg-gold-500 text-navy-950 shadow-[0_4px_14px_-2px_rgba(245,154,31,0.5)]"
                : "text-gold-600 hover:bg-gold-500/15"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS.home} />
            </svg>
            Inicio
          </Link>

          <div className="mt-2 flex items-stretch gap-2">
          <Link
            href="/admin/caja?venta=1"
            className="flex flex-1 items-center gap-3 rounded-xl bg-gold-500 px-3.5 py-3 text-sm font-extrabold text-navy-950 shadow-[0_8px_22px_-6px_rgba(245,154,31,0.65)] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS.bag} />
            </svg>
            <span className="flex flex-col leading-tight">
              Vender ahora
              <span className="text-[10px] font-semibold opacity-70">Venta rápida</span>
            </span>
          </Link>
          <Link
            href="/admin/cotizador"
            title="Cotizador solar"
            aria-label="Cotizador solar"
            className="grid w-11 shrink-0 place-items-center rounded-xl border border-gold-500/40 bg-gold-500/10 text-gold-600 transition-all hover:bg-gold-500/20 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS.sun} />
            </svg>
          </Link>
          </div>

          {SECTORS.map((sector, sectorIdx) => (
            <div key={sector.id} className={sectorIdx === 0 ? "mt-6" : "mt-6 border-t border-ink/10 pt-5"}>
              <div
                className={`mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 ${ACCENT_BG_SOFT[sector.accent]} ${
                  sector.accent === "negocio" ? "border-negocio/30" : "border-tienda/30"
                }`}
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${ACCENT_TEXT[sector.accent]}`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[sector.icon]} />
                </svg>
                <span className={`text-xs font-extrabold uppercase tracking-wide ${ACCENT_TEXT[sector.accent]}`}>
                  {sector.label}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {sector.items.map((item) => {
                  const active = isActivePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? `${ACCENT_BG_SOFT[sector.accent]} ${ACCENT_TEXT[sector.accent]}`
                          : "text-ink hover:bg-cream-200"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICONS[item.icon]} />
                      </svg>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {isDeveloper && (
          <div className="mt-5">
            <div className="flex items-center gap-2 px-3 pb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-body">
                {developerName ?? "Desarrollador"}
              </span>
            </div>
            <Link
              href="/admin/developer"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin/developer")
                  ? "bg-violet-500/15 text-violet-600"
                  : "text-ink hover:bg-cream-200"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14" />
              </svg>
              Panel de desarrollador
            </Link>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1 border-t border-ink/10 p-3">
          <button
            type="button"
            onClick={toggle}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            aria-label={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            className="grid h-9 w-9 cursor-pointer touch-manipulation place-items-center rounded-lg text-ink hover:bg-cream-200"
          >
            <ThemeIcon theme={theme} />
          </button>
          <FullscreenToggle compact />
          <button
            type="button"
            onClick={() => signOut()}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="ml-auto grid h-9 w-9 cursor-pointer touch-manipulation place-items-center rounded-lg text-red-500 hover:bg-red-500/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-ink/10 bg-surface px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-navy-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="BH Electric Solar" className="h-full w-full object-contain p-1.5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-ink">BH Admin</span>
            {currentSector && (
              <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${ACCENT_TEXT[currentSector.accent]}`}>
                {currentSector.label}
              </span>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label="Cambiar tema"
          className="grid h-9 w-9 cursor-pointer touch-manipulation place-items-center rounded-lg border border-ink/10 text-ink"
        >
          <ThemeIcon theme={theme} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Venta rápida — flotante en mobile, siempre a mano porque nunca se
          sabe cuándo cae un cliente que quiere comprar ya mismo. */}
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2 lg:hidden">
      <Link
        href="/admin/cotizador"
        aria-label="Cotizador solar"
        className="grid h-11 w-11 cursor-pointer touch-manipulation place-items-center rounded-full border border-gold-500/50 bg-surface text-gold-600 shadow-lg transition-transform active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS.sun} />
        </svg>
      </Link>
      <Link
        href="/admin/caja?venta=1"
        aria-label="Venta rápida"
        className="flex h-14 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-extrabold text-navy-950 shadow-[0_10px_30px_-8px_rgba(245,154,31,0.7)] transition-transform active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS.bag} />
        </svg>
        Vender
      </Link>
      </div>

      {/* Mobile bottom tab bar: en Resumen es el selector de sistema; adentro
          de un sistema muestra solo los menús de ESE sistema. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-ink/10 bg-surface lg:hidden"
        style={{ gridTemplateColumns: `repeat(${bottomBarCols}, minmax(0, 1fr))` }}
      >
        <HomeTab active={homeActive} />
        {sectorTabs.map((tab) => (
          <BottomTab key={tab.href} {...tab} />
        ))}
        {needsMore && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold ${
              moreOpen ? "text-gold-600" : "text-body"
            }`}
          >
            <span
              className={`grid h-8 w-11 place-items-center rounded-full transition-colors ${
                moreOpen ? "bg-gold-500/25" : "bg-transparent"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Más
          </button>
        )}
      </nav>

      {/* "Más" — menú de tarjetas del sistema actual (o los 3 sistemas si estás en Resumen) */}
      {moreOpen && (
        <div data-sheet className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <div className="animate-sheet-in absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-ink/10 bg-surface p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />

            {sheetSector ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ACCENT_BG_SOLID[sheetSector.accent]}`} />
                  <h2 className="text-sm font-bold text-ink">{sheetSector.label}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sheetSector.items.map((item) => (
                    <MenuCard
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      icon={ICONS[item.icon]}
                      accentText={ACCENT_TEXT[sheetSector.accent]}
                      accentBg={ACCENT_BG_SOFT[sheetSector.accent]}
                      onClick={() => setMoreOpen(false)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-sm font-bold text-ink">Los 3 sistemas del admin</h2>
                <div className="grid grid-cols-2 gap-3">
                  {SECTORS.map((sector) => (
                    <MenuCard
                      key={sector.id}
                      href={sector.items[0]?.href ?? "/admin"}
                      label={sector.label}
                      description={sector.tagline}
                      icon={ICONS[sector.icon]}
                      accentText={ACCENT_TEXT[sector.accent]}
                      accentBg={ACCENT_BG_SOFT[sector.accent]}
                      onClick={() => setMoreOpen(false)}
                    />
                  ))}
                </div>
              </>
            )}

            {isDeveloper && (
              <Link
                href="/admin/developer"
                onClick={() => setMoreOpen(false)}
                className="mt-5 flex cursor-pointer touch-manipulation items-center gap-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-3 text-sm font-bold text-violet-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14" />
                </svg>
                Panel de desarrollador
              </Link>
            )}

            <button
              type="button"
              onClick={() => signOut()}
              className="mt-5 flex cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeTab({ active }: { active: boolean }) {
  return (
    <Link
      href="/admin"
      className={`flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold text-gold-600 ${
        active ? "" : "opacity-90"
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-navy-950 shadow-[0_4px_14px_-2px_rgba(245,154,31,0.55)] transition-transform ${
          active ? "scale-110" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS.home} />
        </svg>
      </span>
      Inicio
    </Link>
  );
}

function BottomTab({
  href,
  label,
  icon,
  active,
  accentText,
  accentBg,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  accentText: string;
  accentBg: string;
}) {
  return (
    <Link
      href={href}
      className={`flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold ${
        active ? accentText : "text-body"
      }`}
    >
      <span className={`grid h-8 w-11 place-items-center rounded-full transition-colors ${active ? accentBg : "bg-transparent"}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      {label}
    </Link>
  );
}

function MenuCard({
  href,
  label,
  description,
  icon,
  accentText,
  accentBg,
  onClick,
}: {
  href: string;
  label: string;
  description: string;
  icon: string;
  accentText: string;
  accentBg: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex cursor-pointer touch-manipulation flex-col gap-2 rounded-2xl border border-ink/10 bg-background p-4 shadow-sm transition-all active:scale-[0.97]"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accentBg} ${accentText}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="text-[11px] leading-snug text-body">{description}</span>
    </Link>
  );
}

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
