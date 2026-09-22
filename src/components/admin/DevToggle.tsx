"use client";

// Switch para los paneles violeta de "datos de prueba del developer" (Leads,
// Clientes, Proyectos, Cotizador, Inicio). Antes era un Chip que se veía casi
// igual prendido y apagado y confundía — acá el estado es inconfundible:
// interruptor + la palabra ACTIVADO/DESACTIVADO.
export default function DevToggle({
  active,
  onClick,
  label,
  caption,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  caption?: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5">
      <button
        type="button"
        onClick={onClick}
        role="switch"
        aria-checked={active}
        className="flex cursor-pointer touch-manipulation items-center gap-2.5"
      >
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            active ? "bg-violet-600" : "bg-ink/20"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
              active ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </span>
        <span
          className={`text-[11px] font-extrabold uppercase tracking-wide ${
            active ? "text-violet-700" : "text-body"
          }`}
        >
          {active ? "Activado" : "Desactivado"}
        </span>
      </button>
      <span className="text-xs font-semibold text-ink">{label}</span>
      {caption && <span className="text-[11px] text-body">{caption}</span>}
    </div>
  );
}
