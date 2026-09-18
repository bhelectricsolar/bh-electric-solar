"use client";

import { useState } from "react";
import NumberField from "@/components/NumberField";
import Link from "next/link";
import {
  REGION_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COVERAGE_OPTIONS,
  calculateSolarSystem,
  type RegionKey,
  type ClientType,
  type SolarResult,
} from "@/lib/solarCalculator";
import { WHATSAPP_NUMBER } from "./WhatsAppFloat";

export default function SolarCalculatorForm() {
  const [region, setRegion] = useState<RegionKey>("amba");
  const [bill, setBill] = useState("");
  const [kwh, setKwh] = useState("");
  const [clientType, setClientType] = useState<ClientType>("residencial");
  const [coverage, setCoverage] = useState(0.7);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolarResult | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const billValue = Number(bill || 0);
    if (!billValue || billValue <= 0) return;

    setLoading(true);
    setResult(null);
    window.setTimeout(() => {
      const calculated = calculateSolarSystem({
        region,
        bill: billValue,
        kwh: Number(kwh || 0),
        clientType,
        coverage,
      });
      setResult(calculated);
      setLoading(false);
    }, 900);
  }

  function handleReset() {
    setBill("");
    setKwh("");
    setRegion("amba");
    setClientType("residencial");
    setCoverage(0.7);
    setResult(null);
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col gap-5 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_25px_60px_-25px_rgba(12,24,48,0.35)] backdrop-blur-md sm:backdrop-blur-xl sm:p-8"
      >
        <div>
          <label className="text-sm font-semibold text-ink">
            Región de instalación
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionKey)}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-body">
            La región ajusta la producción solar mensual estimada por kWp
            instalado.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-ink">
              Monto mensual de factura
            </label>
            <NumberField
              prefix="$ "
              placeholder="Ej: $ 85.000"
              value={bill}
              onValueChange={setBill}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">
              kWh mensuales
            </label>
            <NumberField
              suffix=" kWh"
              placeholder="Ej: 420 kWh"
              value={kwh}
              onValueChange={setKwh}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-ink"
            />
            <p className="mt-1.5 text-xs text-body">
              Si lo tenés en la factura, mejora mucho la estimación.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-ink">
              Tipo de consumo
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as ClientType)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
            >
              {CLIENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">
              Objetivo de cobertura
            </label>
            <select
              value={coverage}
              onChange={(e) => setCoverage(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
            >
              {COVERAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-navy-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Calcular presupuesto estimado
        </button>
        <p className="text-xs text-body">
          Estimación orientativa. Para presupuesto final se revisa factura,
          ubicación, techo, orientación, sombras, estructura, equipos y
          normativa aplicable.
        </p>
      </form>

      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/90 to-cream-100/90 p-6 shadow-[0_25px_60px_-25px_rgba(245,154,31,0.3)] backdrop-blur-md sm:backdrop-blur-xl sm:p-8">
        {!result && !loading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 text-center">
            <h2 className="text-2xl font-extrabold text-ink">
              Tu resultado aparecerá acá.
            </h2>
            <p className="max-w-xs text-sm text-body">
              La calculadora te dará una referencia de potencia recomendada,
              ahorro mensual estimado, producción solar y rango de inversión.
            </p>
          </div>
        )}

        {loading && (
          <div className="grid h-full min-h-[320px] place-items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-900/15 border-t-navy-900" />
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-600">
                Sistema recomendado
              </p>
              <span className="rounded-full bg-cream-200 px-3 py-1 text-[11px] font-semibold text-ink">
                {result.regionLabel}
              </span>
            </div>
            <p className="font-data mt-1 text-4xl font-semibold text-ink">
              {result.systemKwpLabel}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-xs text-body">Ahorro mensual estimado</p>
                <p className="font-data mt-1 text-lg font-semibold text-ink">
                  {result.monthlySavingsLabel}
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-xs text-body">Producción mensual aprox.</p>
                <p className="font-data mt-1 text-lg font-semibold text-ink">
                  {Math.round(result.monthlyProduction)} kWh
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-xs text-body">Paneles estimados</p>
                <p className="font-data mt-1 text-lg font-semibold text-ink">
                  {result.panelCount} paneles
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-xs text-body">Inversión referencial</p>
                <p className="font-data mt-1 text-lg font-semibold text-ink">
                  {result.investmentLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-navy-900 p-5">
              <p className="font-bold text-white">{result.summaryTitle}</p>
              <p className="mt-1 text-sm text-white/70">
                {result.summaryText}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  result.whatsappMessage,
                )}`}
                target="_blank"
                className="flex-1 rounded-lg bg-gold-500 px-5 py-3 text-center text-sm font-semibold text-navy-950"
              >
                Pedir presupuesto por WhatsApp
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-black/10 px-5 py-3 text-sm font-semibold text-ink"
              >
                Calcular nuevamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
