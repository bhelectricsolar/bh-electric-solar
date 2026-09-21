"use client";

import { useState } from "react";
import { historyCoverage, summarizeHistory, type HistoryPeriod } from "@/lib/solar-quote";

export type Cur = "USD" | "ARS";

const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export function formatMoney(usd: number, cur: Cur, rate: number) {
  return cur === "USD"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd)
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(usd * rate);
}

export function CurrencyToggle({ cur, onChange }: { cur: Cur; onChange: (c: Cur) => void }) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 bg-surface p-0.5 text-[11px] font-bold shadow-sm" role="group" aria-label="Moneda">
      {(["USD", "ARS"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`cursor-pointer touch-manipulation rounded-full px-3 py-1 transition-all ${
            cur === c ? "bg-navy-900 text-white shadow" : "text-body hover:text-ink"
          }`}
        >
          {c === "USD" ? "US$ Dólares" : "$ Pesos"}
        </button>
      ))}
    </div>
  );
}

// Historial de consumo: gráfico propio (no la foto de la factura) con cada
// valor en números, promedio, máximo y mínimo, y el gasto en dólares o pesos.
export default function ConsumptionHistory({
  history,
  monthlyProduction,
  pricePerKwh,
  exchangeRate,
  cur: curProp,
  onCurChange,
}: {
  history: HistoryPeriod[] | undefined;
  monthlyProduction?: number;
  pricePerKwh: number; // pesos por kWh
  exchangeRate: number; // pesos por dólar
  cur?: Cur;
  onCurChange?: (c: Cur) => void;
}) {
  const [curLocal, setCurLocal] = useState<Cur>("USD");
  const cur = curProp ?? curLocal;
  const setCur = onCurChange ?? setCurLocal;
  const stats = summarizeHistory(history);
  if (!stats) return null;

  const rate = exchangeRate > 0 ? exchangeRate : 1;
  // el gasto se calcula en pesos (precio del kWh) y se pasa a dólares si hace falta
  const money = (kwh: number) =>
    cur === "USD"
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((kwh * pricePerKwh) / rate)
      : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(kwh * pricePerKwh);

  const avg = stats.avgMonthlyKwh;
  const prod = monthlyProduction && monthlyProduction > 0 ? monthlyProduction : 0;
  const top = Math.max(stats.maxMonthlyKwh, prod) * 1.12;
  const cov = prod ? historyCoverage(stats, prod, pricePerKwh) : null;
  const savingsMonthly =
    cov && (cur === "USD" ? cov.avgMonthlySavingsARS / rate : cov.avgMonthlySavingsARS);
  const fmtSavings = (v: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-gradient-to-r from-navy-900 to-navy-800 px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300">Historial de consumo</p>
          <p className="text-sm font-bold">
            {stats.periods} períodos · {stats.rows[0].label} → {stats.rows[stats.rows.length - 1].label}
          </p>
        </div>
        {!onCurChange && <CurrencyToggle cur={cur} onChange={setCur} />}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <Kpi label="Promedio mensual" value={`${nf.format(avg)} kWh`} sub={money(avg)} accent />
        <Kpi label={`Máximo · ${stats.maxLabel}`} value={`${nf.format(stats.maxMonthlyKwh)} kWh`} sub={money(stats.maxMonthlyKwh)} />
        <Kpi label={`Mínimo · ${stats.minLabel}`} value={`${nf.format(stats.minMonthlyKwh)} kWh`} sub={money(stats.minMonthlyKwh)} />
        <Kpi label="Consumo anual estimado" value={`${nf.format(avg * 12)} kWh`} sub={`${money(avg * 12)} / año`} />
      </div>

      <div className="px-3 pb-1">
        <div className="relative h-44">
          <div className="absolute inset-x-0 bottom-0 top-4 flex items-end gap-[3px]">
            {stats.rows.map((r, i) => {
              const isMax = r.monthlyKwh === stats.maxMonthlyKwh;
              const isMin = r.monthlyKwh === stats.minMonthlyKwh;
              const above = r.monthlyKwh > avg;
              return (
                <div
                  key={i}
                  className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  title={`${r.label}: ${nf.format(r.monthlyKwh)} kWh · ${money(r.monthlyKwh)}`}
                >
                  <span className="font-data mb-0.5 text-[8px] font-bold leading-none text-ink sm:text-[10px]">
                    {nf.format(r.monthlyKwh)}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${
                      isMax
                        ? "bg-gradient-to-t from-gold-600 to-gold-400"
                        : isMin
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                          : above
                            ? "bg-gradient-to-t from-negocio to-negocio/60"
                            : "bg-gradient-to-t from-negocio/70 to-negocio/35"
                    }`}
                    style={{ height: `${(r.monthlyKwh / top) * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          {/* líneas de promedio y producción, sobre la misma escala que las barras */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-4">
            <div className="absolute inset-x-0 border-t-2 border-dashed border-ink/40" style={{ bottom: `${(avg / top) * 100}%` }} />
            {prod > 0 && (
              <div className="absolute inset-x-0 border-t-2 border-gold-500" style={{ bottom: `${(prod / top) * 100}%` }} />
            )}
          </div>
        </div>
        <div className="flex gap-[3px] pb-2">
          {stats.rows.map((r, i) => (
            <span
              key={i}
              className={`font-data min-w-0 flex-1 text-center text-[8px] text-body sm:text-[10px] ${
                stats.rows.length > 9 && i % 2 === 1 ? "max-sm:invisible" : ""
              }`}
            >
              {r.label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-3 text-[10px] text-body">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0 w-4 border-t-2 border-dashed border-ink/40" /> Promedio {nf.format(avg)} kWh
          </span>
          {prod > 0 && (
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-0 w-4 border-t-2 border-gold-500" /> Producción del sistema {nf.format(prod)} kWh/mes
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-sm bg-gold-500" /> Máximo
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> Mínimo
          </span>
        </div>
      </div>

      {cov && savingsMonthly != null && (
        <div className="grid grid-cols-1 gap-2 border-t border-ink/10 bg-background p-3 sm:grid-cols-3">
          <Kpi label="Cobertura del historial" value={`${nf.format(cov.annualCoveragePct)} %`} sub="del consumo lo cubre el sistema" />
          <Kpi label="Ahorro mensual promedio" value={fmtSavings(savingsMonthly)} sub={`${fmtSavings(savingsMonthly * 12)} por año`} accent />
          <Kpi
            label="Meses con excedente"
            value={`${cov.surplusPeriods} de ${stats.periods}`}
            sub="produce más de lo que consume"
          />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-ink/10 bg-surface p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-body">{label}</p>
      <p className={`font-data mt-1 text-lg font-extrabold leading-tight ${accent ? "text-gold-600" : "text-ink"}`}>{value}</p>
      {sub && <p className="font-data mt-0.5 text-[11px] text-body">{sub}</p>}
    </div>
  );
}
