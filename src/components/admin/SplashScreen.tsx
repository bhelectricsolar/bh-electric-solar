// Pantalla de carga de la app: se ve desde el primer instante (ya viene en
// el HTML que arma el servidor, sin esperar a que cargue el JS) así nunca
// hay un flash de pantalla blanca al abrir la app.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[#0c1a38]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(245,154,31,0.22),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-5">
        <span className="bh-splash-pulse relative grid h-24 w-24 place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="BH Electric Solar" className="h-full w-full object-contain drop-shadow-[0_0_24px_rgba(245,154,31,0.55)]" />
        </span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold tracking-wide text-white">BH Electric Solar</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">Cargando…</span>
        </div>
      </div>
    </div>
  );
}
