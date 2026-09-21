"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import NumberField from "@/components/NumberField";
import PrintDocument from "@/components/admin/PrintDocument";
import { readBarChart, type Region } from "@/lib/chart-ocr";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import StatusBadge from "@/components/admin/StatusBadge";
import Chip from "@/components/admin/Chip";
import { useAdminSettings } from "@/lib/admin-settings";
import { useCurrentTeamMember } from "@/lib/current-user";
import { getCustomers, type Customer } from "@/lib/customers";
import { getProjects, type Project } from "@/lib/projects";
import {
  createSolarQuote,
  deleteSolarQuote,
  getSolarQuotes,
  type SolarQuote,
} from "@/lib/solar-quotes";
import {
  DEFAULT_BILLING_DAYS,
  DEFAULT_COVERAGE_PCT,
  DEFAULT_PANEL_W,
  DEFAULT_PERFORMANCE_RATIO,
  DEFAULT_PRICE_PER_KWH,
  DEFAULT_PROVINCE,
  PROVINCES,
  buildQuoteSummary,
  calculateQuote,
  historyCoverage,
  parseArNumber,
  parseInvoiceText,
  summarizeHistory,
  validateInputs,
  type HistoryPeriod,
  type QuoteInputs,
  type SizingBasis,
} from "@/lib/solar-quote";

const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fmtUSD = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const nf = (n: number, d = 0) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const INPUT = "w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink";

type Form = {
  kwh: string;
  days: string;
  totalBill: string;
  province: string;
  panelW: string;
  pr: string;
  coverage: string;
  clientName: string;
  address: string;
  customerId: string;
  projectId: string;
};

const EMPTY_FORM: Form = {
  kwh: "",
  days: String(DEFAULT_BILLING_DAYS),
  totalBill: "",
  province: DEFAULT_PROVINCE,
  panelW: String(DEFAULT_PANEL_W),
  pr: String(DEFAULT_PERFORMANCE_RATIO),
  coverage: String(DEFAULT_COVERAGE_PCT),
  clientName: "",
  address: "",
  customerId: "",
  projectId: "",
};

// Prepara la foto para el OCR: la achica si es enorme (las fotos de celular
// pesan varios MB) y la dibuja en un canvas. Todo pasa en este dispositivo.
async function prepareCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("formato"));
      el.src = url;
    });
    const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function CotizadorPage() {
  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 sm:px-8 sm:py-10">
          <p className="text-sm text-body">Cargando…</p>
        </section>
      }
    >
      <CotizadorInner />
    </Suspense>
  );
}

function CotizadorInner() {
  const { settings } = useAdminSettings();
  const { member } = useCurrentTeamMember();
  const searchParams = useSearchParams();
  const customerParam = searchParams.get("cliente");

  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [priceOverride, setPriceOverride] = useState<string | null>(null);
  const [hspOverride, setHspOverride] = useState<string | null>(null);
  const [costOverride, setCostOverride] = useState<string | null>(null);
  const [rateOverride, setRateOverride] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<SolarQuote[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string | null>(customerParam);

  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrInfo, setOcrInfo] = useState<{
    distribuidora: string | null;
    missing: string[];
    financing: boolean;
    energyPrice: number | null;
  } | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [fromPhoto, setFromPhoto] = useState(false);
  const [priceFromEnergy, setPriceFromEnergy] = useState(false);

  const [chartCanvas, setChartCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectingChart, setSelectingChart] = useState(false);
  const [chartReading, setChartReading] = useState(false);
  const [chartProgress, setChartProgress] = useState(0);
  const [chartMsg, setChartMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPeriod[]>([]);
  const [basisChoice, setBasisChoice] = useState<SizingBasis>("historial");
  const [histText, setHistText] = useState("");
  const [histDays, setHistDays] = useState("30");
  const [histEnd, setHistEnd] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<{ title: string; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const appliedParam = useRef(false);

  const reloadQuotes = useCallback(() => getSolarQuotes().then(setQuotes).catch((e) => console.error("Cotizaciones:", e)), []);

  useEffect(() => {
    getCustomers().then(setCustomers).catch((e) => console.error(e));
    getProjects().then(setProjects).catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadQuotes();
  }, [reloadQuotes]);

  // Viene desde un lead/cliente ("Cotizar"): precarga sus datos.
  useEffect(() => {
    if (appliedParam.current || !customerParam || customers.length === 0) return;
    const c = customers.find((x) => x.id === customerParam);
    if (!c) return;
    appliedParam.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF((prev) => ({ ...prev, customerId: c.id, clientName: c.name, address: c.city }));
    if (c.kwhMonthly) setF((prev) => ({ ...prev, kwh: String(Math.round(c.kwhMonthly! * 2)), days: "60" }));
  }, [customerParam, customers]);

  const setField = (patch: Partial<Form>) => {
    setF((prev) => ({ ...prev, ...patch }));
    setSavedId(null);
  };

  const kwhNum = Number(f.kwh) || 0;
  const billNum = Number(f.totalBill) || 0;
  const priceStr =
    priceOverride ??
    (billNum > 0 && kwhNum > 0 ? String(Math.round((billNum / kwhNum) * 100) / 100) : String(DEFAULT_PRICE_PER_KWH));
  const hspStr = hspOverride ?? String(settings.hspTable[f.province] ?? 4.5);
  const costStr = costOverride ?? String(settings.installCostPerWp);
  const rateStr = rateOverride ?? String(settings.exchangeRate);

  const histStats = useMemo(() => summarizeHistory(history), [history]);
  const useHistory = basisChoice === "historial" && !!histStats;

  const inputs: QuoteInputs = useMemo(
    () => ({
      // Con historial se dimensiona con el promedio de todos los períodos;
      // si no, con la última factura.
      kwh: useHistory ? histStats!.totalKwh : kwhNum,
      days: useHistory ? histStats!.totalDays : Number(f.days) || 0,
      ...(histStats
        ? { history, basis: (useHistory ? "historial" : "factura") as SizingBasis, billKwh: kwhNum, billDays: Number(f.days) || 0 }
        : {}),
      totalBill: billNum > 0 ? billNum : null,
      pricePerKwh: Number(priceStr) || 0,
      province: f.province,
      hsp: Number(hspStr) || 0,
      panelW: Number(f.panelW) || 0,
      performanceRatio: Number(f.pr) || 0,
      coveragePct: Number(f.coverage) || 0,
      costPerWp: Number(costStr) || 0,
      exchangeRate: Number(rateStr) || 0,
    }),
    [kwhNum, billNum, f.days, priceStr, f.province, hspStr, f.panelW, f.pr, f.coverage, costStr, rateStr, history, histStats, useHistory],
  );

  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const results = useMemo(() => calculateQuote(inputs), [inputs]);
  const summary = useMemo(
    () => (results ? buildQuoteSummary({ inputs, results, clientName: f.clientName, address: f.address }) : ""),
    [inputs, results, f.clientName, f.address],
  );

  // Lectura gratuita: el OCR corre en este dispositivo (sin API ni costo).
  // Es de "mejor esfuerzo" y por eso siempre se pide confirmar los datos.
  async function readInvoice(file: File) {
    setReading(true);
    setProgress(0);
    setOcrError(null);
    setOcrInfo(null);
    try {
      let canvas: HTMLCanvasElement;
      try {
        canvas = await prepareCanvas(file);
        setChartCanvas(canvas);
      } catch {
        throw new Error("No se pudo abrir la imagen. Probá con una foto en JPG o PNG.");
      }
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      let text = "";
      try {
        const { data } = await worker.recognize(canvas);
        text = data.text;
      } finally {
        await worker.terminate();
      }

      const parsed = parseInvoiceText(text);
      const missing: string[] = [];
      const patch: Partial<Form> = {};
      if (parsed.kwh) patch.kwh = String(parsed.kwh);
      else missing.push("kWh");
      if (parsed.days) patch.days = String(parsed.days);
      else missing.push("días del período");
      if (parsed.total) patch.totalBill = String(parsed.total);
      else missing.push("monto total");
      // El precio del kWh sale del monto total, como siempre. Si la factura
      // trae financiación, solo avisamos (y ofrecemos el precio de energía).
      setPriceOverride(null);
      setPriceFromEnergy(false);
      if (parsed.province) {
        patch.province = parsed.province;
        setHspOverride(null);
      } else missing.push("provincia (elegila a mano)");
      setField(patch);
      setFromPhoto(true);
      setNeedsConfirm(true);
      setOcrInfo({
        distribuidora: parsed.distribuidora,
        missing,
        financing: parsed.hasFinancing,
        energyPrice:
          parsed.energyTotal && parsed.kwh ? Math.round((parsed.energyTotal / parsed.kwh) * 100) / 100 : null,
      });
    } catch (e) {
      setOcrError(
        (e as Error).message.startsWith("No se pudo abrir")
          ? (e as Error).message
          : "No se pudo leer la foto (revisá la conexión, la primera vez descarga el idioma). Cargá los datos a mano.",
      );
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  // Pega los kWh del gráfico de la factura (del más viejo al más nuevo).
  function applyPaste(textOverride?: string) {
    // "?" = período que no se pudo leer (queda en 0 para completarlo a mano)
    const nums = ((textOverride ?? histText).match(/\d[\d.,]*|\?/g) ?? [])
      .map((t) => (t === "?" ? 0 : parseArNumber(t)))
      .filter((n): n is number => n != null && n >= 0 && n < 100000);
    if (nums.length === 0) return;
    const [y, m] = histEnd.split("-").map(Number);
    const perDays = Number(histDays) || 30;
    const rows: HistoryPeriod[] = nums.map((kwh, idx) => {
      const d = new Date(y, m - 1 - (nums.length - 1 - idx), 1);
      return {
        label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`,
        kwh,
        days: perDays,
        included: true,
      };
    });
    // Si el último dato es el de la factura y es un período parcial, usa sus días reales.
    const last = rows[rows.length - 1];
    const billDays = Number(f.days) || 0;
    if (last.kwh === kwhNum && billDays > 0 && billDays < perDays) last.days = billDays;
    setHistory(rows);
    setBasisChoice("historial");
    setSavedId(null);
  }

  async function loadChartPhoto(file: File) {
    setChartMsg(null);
    try {
      setChartCanvas(await prepareCanvas(file));
      setSelectingChart(true);
    } catch {
      setChartMsg("No se pudo abrir la imagen. Probá con una foto en JPG o PNG.");
    }
  }

  async function readChart(region: Region) {
    if (!chartCanvas) return;
    setChartReading(true);
    setChartProgress(0);
    setChartMsg(null);
    try {
      const r = await readBarChart(chartCanvas, region, setChartProgress);
      if (r.read === 0) {
        setChartMsg("No se pudo leer ningún valor. Probá marcando solo la parte con las barras y sus números, o pegalos a mano.");
        return;
      }
      const text = r.values.map((v) => v ?? "?").join(" ");
      setHistText(text);
      applyPaste(text);
      setSelectingChart(false);
      setChartMsg(
        `Leí ${r.read} de ${r.total} períodos${r.read < r.total ? ": los marcados en rojo no se pudieron leer, completalos mirando el gráfico" : ""}. Revisá que estén todos (puede faltar alguno al principio o al final) y corregí lo que haga falta.`,
      );
    } catch (e) {
      console.error("Gráfico:", e);
      setChartMsg("No se pudo leer el gráfico (revisá la conexión). Pegá los valores a mano.");
    } finally {
      setChartReading(false);
    }
  }

  function updateRow(idx: number, patch: Partial<HistoryPeriod>) {
    setHistory((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setSavedId(null);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setSaveError("No se pudo copiar. Seleccioná el texto a mano.");
    }
  }

  async function save() {
    if (!results) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await createSolarQuote({
        createdBy: member?.id ?? null,
        customerId: f.customerId || null,
        projectId: f.projectId || null,
        clientName: f.clientName.trim(),
        address: f.address.trim(),
        inputs,
        results,
        summary,
        fromInvoicePhoto: fromPhoto,
      });
      setSavedId(saved.id);
      await reloadQuotes();
    } catch (e) {
      console.error("Guardar cotización:", e);
      setSaveError("No se pudo guardar la cotización. Reintentá.");
    } finally {
      setSaving(false);
    }
  }

  function loadQuote(q: SolarQuote) {
    setF({
      kwh: String(q.inputs.billKwh ?? q.inputs.kwh),
      days: String(q.inputs.billDays ?? q.inputs.days),
      totalBill: q.inputs.totalBill ? String(q.inputs.totalBill) : "",
      province: q.inputs.province,
      panelW: String(q.inputs.panelW),
      pr: String(q.inputs.performanceRatio),
      coverage: String(q.inputs.coveragePct),
      clientName: q.clientName,
      address: q.address,
      customerId: q.customerId ?? "",
      projectId: q.projectId ?? "",
    });
    setHistory(q.inputs.history ?? []);
    setBasisChoice(q.inputs.basis ?? "historial");
    setPriceOverride(String(q.inputs.pricePerKwh));
    setHspOverride(String(q.inputs.hsp));
    setCostOverride(String(q.inputs.costPerWp));
    setRateOverride(String(q.inputs.exchangeRate));
    setNeedsConfirm(false);
    setFromPhoto(q.fromInvoicePhoto);
    setSavedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newQuote() {
    setF(EMPTY_FORM);
    setHistory([]);
    setHistText("");
    setBasisChoice("historial");
    setPriceOverride(null);
    setHspOverride(null);
    setCostOverride(null);
    setRateOverride(null);
    setNeedsConfirm(false);
    setFromPhoto(false);
    setOcrInfo(null);
    setOcrError(null);
    setSavedId(null);
  }

  const visibleQuotes = customerFilter ? quotes.filter((q) => q.customerId === customerFilter) : quotes;

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Cotizador solar</h1>
            <p className="mt-1 text-sm text-body">
              Dimensioná el sistema y armá la cotización a partir de la factura de luz del cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={newQuote}
            className="self-start rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md sm:self-auto"
          >
            Nueva cotización
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <Card title="1 · Factura de luz">
              <p className="text-xs text-body">
                Cargá los datos a mano en los pasos siguientes, o sacale una foto a la factura para autocompletarlos.
                La lectura es gratuita y se hace en este equipo, pero puede fallar: siempre revisá los datos.
              </p>
              {(["camera", "file"] as const).map((kind) => (
                <input
                  key={kind}
                  ref={kind === "camera" ? cameraRef : fileRef}
                  id={`factura-${kind}`}
                  type="file"
                  accept="image/*"
                  {...(kind === "camera" ? { capture: "environment" as const } : {})}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) readInvoice(file);
                  }}
                />
              ))}
              <div className={`mt-3 grid grid-cols-2 gap-2 ${reading ? "pointer-events-none opacity-60" : ""}`}>
                <label
                  htmlFor="factura-camera"
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gold-500/50 bg-gold-500/10 px-3 py-3 text-sm font-bold text-gold-600 transition-all hover:bg-gold-500/15"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-2h6.6l1.2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  Sacar foto
                </label>
                <label
                  htmlFor="factura-file"
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 bg-background px-3 py-3 text-sm font-bold text-ink transition-all hover:border-gold-500/50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path d="m21 16-5-5-8 8" />
                  </svg>
                  Elegir imagen
                </label>
              </div>
              {reading && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-ink">
                    Leyendo la factura… {progress > 0 ? `${progress}%` : "preparando (la primera vez tarda un poco más)"}
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${Math.max(progress, 4)}%` }} />
                  </div>
                </div>
              )}
              {ocrError && (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">{ocrError}</p>
              )}
              {ocrInfo && (
                <p className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-600">
                  Datos leídos de la foto{ocrInfo.distribuidora ? ` (${ocrInfo.distribuidora})` : ""}.
                  {ocrInfo.missing.length > 0 && <> No se detectó: {ocrInfo.missing.join(", ")}.</>} Revisalos antes
                  de calcular.
                </p>
              )}
              {ocrInfo?.financing && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                  <p className="font-bold">⚠ Esta factura incluye cuotas, intereses o planes de financiación.</p>
                  <p className="mt-1">
                    El monto total los suma, y eso infla el precio del kWh (y el ahorro estimado), porque los paneles
                    no ahorran esos conceptos. Revisá el precio del kWh en el paso 2.
                  </p>
                  {ocrInfo.energyPrice != null && (
                    <button
                      type="button"
                      onClick={() => {
                        setPriceOverride(String(ocrInfo.energyPrice));
                        setPriceFromEnergy(true);
                        setSavedId(null);
                      }}
                      className="mt-2 rounded-md border border-red-500/40 bg-background px-3 py-1.5 font-semibold text-red-600 hover:bg-red-500/10"
                    >
                      Usar el precio de la energía sola (≈ $ {nf(ocrInfo.energyPrice, 2)}/kWh)
                    </button>
                  )}
                </div>
              )}
            </Card>

            <Card title="2 · Última factura">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Consumo facturado (kWh)">
                  <NumberField
                    suffix=" kWh"
                    value={f.kwh}
                    onValueChange={(v) => setField({ kwh: v })}
                    placeholder="Ej: 600 kWh"
                    className={INPUT}
                  />
                </Field>
                <Field label="Días del período">
                  <NumberField suffix=" días" value={f.days} onValueChange={(v) => setField({ days: v })} className={INPUT} />
                </Field>
                <Field label="Monto total facturado (opcional)">
                  <NumberField
                    prefix="$ "
                    decimals
                    value={f.totalBill}
                    onValueChange={(v) => {
                      setField({ totalBill: v });
                      setPriceOverride(null);
                      setPriceFromEnergy(false);
                    }}
                    placeholder="$ 0"
                    className={INPUT}
                  />
                </Field>
                <Field label="Precio del kWh ($/kWh)">
                  <NumberField
                    prefix="$ "
                    decimals
                    value={priceStr}
                    onValueChange={(v) => {
                      setPriceOverride(v);
                      setPriceFromEnergy(false);
                      setSavedId(null);
                    }}
                    className={INPUT}
                  />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-body">
                {priceFromEnergy
                  ? "Precio calculado con el subtotal de energía eléctrica de la factura (sin cuotas, intereses ni tasas)."
                  : priceOverride == null && billNum > 0 && kwhNum > 0
                  ? "El precio del kWh se calcula solo con el monto total (incluye impuestos, cuotas e intereses: revisalo)."
                  : priceOverride == null
                    ? "Valor de referencia hasta cargar la factura — ajustalo."
                    : "Precio cargado a mano."}
              </p>
            </Card>

            <Card title="3 · Historial de consumo (recomendado)">
              <p className="text-xs text-body">
                Los ingenieros dimensionan con el consumo promedio, no con una sola factura. Copiá los kWh del gráfico
                de la factura (del más viejo al más nuevo) y pegalos acá.
              </p>
              <div className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3">
                <p className="text-xs font-bold text-gold-600">Leer el gráfico de la factura con la foto</p>
                <p className="mt-1 text-[11px] text-body">
                  Marcá el gráfico de barras en la foto y se completan los kWh de cada período. Lo que no se pueda
                  leer queda en rojo para completarlo a mano.
                </p>
                {chartCanvas ? (
                  <button
                    type="button"
                    onClick={() => setSelectingChart((v) => !v)}
                    className="mt-2 rounded-lg bg-gold-500 px-3.5 py-2 text-xs font-bold text-navy-950 shadow-sm transition-all hover:shadow-md"
                  >
                    {selectingChart ? "Ocultar la foto" : "Marcar el gráfico en la foto"}
                  </button>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["chart-camera", "chart-file"] as const).map((id) => (
                      <label
                        key={id}
                        htmlFor={id}
                        className="rounded-lg border border-gold-500/50 bg-background px-3.5 py-2 text-xs font-bold text-gold-600 transition-all hover:shadow-md"
                      >
                        {id === "chart-camera" ? "Sacar foto" : "Elegir imagen"}
                        <input
                          id={id}
                          type="file"
                          accept="image/*"
                          {...(id === "chart-camera" ? { capture: "environment" as const } : {})}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) loadChartPhoto(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}
                {selectingChart && chartCanvas && (
                  <RegionPicker
                    canvas={chartCanvas}
                    busy={chartReading}
                    progress={chartProgress}
                    onConfirm={readChart}
                  />
                )}
                {chartMsg && <p className="mt-2 text-[11px] font-semibold text-ink">{chartMsg}</p>}
              </div>

              <textarea
                value={histText}
                onChange={(e) => setHistText(e.target.value)}
                rows={2}
                placeholder="O pegalos a mano, del más viejo al más nuevo. Ej: 548 753 510 464 447 412 561 574 654 564 669 770 1122 1048 287 (usá ? si no lo sabés)"
                className={`${INPUT} mt-3 resize-none`}
              />
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Field label="Mes del último dato">
                  <input type="month" value={histEnd} onChange={(e) => setHistEnd(e.target.value)} className={INPUT} />
                </Field>
                <Field label="Días por período">
                  <NumberField suffix=" días" value={histDays} onValueChange={setHistDays} className={INPUT} />
                </Field>
              </div>
              <p className="mt-1 text-[11px] text-body">30 días si la factura es mensual, 60 si es bimestral.</p>
              <button
                type="button"
                onClick={() => applyPaste()}
                disabled={!histText.trim()}
                className="mt-3 rounded-lg border border-ink/15 bg-background px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                Cargar historial
              </button>

              {history.length > 0 && (
                <>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-body">
                      {history.filter((h) => h.included).length} de {history.length} períodos incluidos
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setHistory([]);
                        setSavedId(null);
                      }}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      Borrar historial
                    </button>
                  </div>
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-ink/10">
                    {history.map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 border-b border-ink/10 px-2.5 py-1.5 last:border-0 ${row.included ? "" : "opacity-45"}`}
                      >
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) => updateRow(idx, { included: e.target.checked })}
                          aria-label={`Incluir ${row.label}`}
                          className="h-4 w-4 shrink-0"
                        />
                        <span className="font-data w-12 shrink-0 text-xs text-body">{row.label}</span>
                        <NumberField
                          suffix=" kWh"
                          value={row.kwh || ""}
                          placeholder="falta dato"
                          onValueChange={(v) => updateRow(idx, { kwh: Number(v) || 0 })}
                          className={`w-full min-w-0 rounded-md border bg-background px-2 py-1.5 text-xs text-ink ${row.kwh > 0 ? "border-ink/10" : "border-red-500/60 bg-red-500/5"}`}
                        />
                        <NumberField
                          suffix=" d"
                          value={row.days}
                          onValueChange={(v) => updateRow(idx, { days: Number(v) || 0 })}
                          className="w-16 shrink-0 rounded-md border border-ink/10 bg-background px-2 py-1.5 text-xs text-ink"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-body">
                    Tildá o destildá cada período (ej: sacá uno incompleto o atípico) y corregí los días si alguno es
                    parcial.
                  </p>
                  <Field label="Dimensionar según">
                    <select
                      value={basisChoice}
                      onChange={(e) => {
                        setBasisChoice(e.target.value as SizingBasis);
                        setSavedId(null);
                      }}
                      className={INPUT}
                    >
                      <option value="historial">Promedio del historial (recomendado)</option>
                      <option value="factura">Solo la última factura</option>
                    </select>
                  </Field>
                </>
              )}
            </Card>

            <Card title="4 · Zona y sistema">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Provincia / zona">
                  <select
                    value={f.province}
                    onChange={(e) => {
                      setField({ province: e.target.value });
                      setHspOverride(null);
                    }}
                    className={INPUT}
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="HSP (horas sol pico)">
                  <NumberField
                    decimals
                    value={hspStr}
                    onValueChange={(v) => {
                      setHspOverride(v);
                      setSavedId(null);
                    }}
                    className={INPUT}
                  />
                </Field>
                <Field label="Potencia del panel (W)">
                  <NumberField suffix=" W" value={f.panelW} onValueChange={(v) => setField({ panelW: v })} className={INPUT} />
                </Field>
                <Field label="Performance ratio">
                  <NumberField decimals value={f.pr} onValueChange={(v) => setField({ pr: v })} className={INPUT} />
                </Field>
                <Field label="Cobertura objetivo (%)">
                  <NumberField suffix=" %" value={f.coverage} onValueChange={(v) => setField({ coverage: v })} className={INPUT} />
                </Field>
                <Field label="Costo instalado (USD/Wp)">
                  <NumberField
                    decimals
                    prefix="US$ "
                    value={costStr}
                    onValueChange={(v) => {
                      setCostOverride(v);
                      setSavedId(null);
                    }}
                    className={INPUT}
                  />
                </Field>
                <Field label="Tipo de cambio ($/USD)">
                  <NumberField
                    decimals
                    prefix="$ "
                    value={rateStr}
                    onValueChange={(v) => {
                      setRateOverride(v);
                      setSavedId(null);
                    }}
                    className={INPUT}
                  />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-body">
                HSP, costo y dólar vienen de Configuración; podés cambiarlos acá solo para esta cotización.
              </p>
            </Card>

            <Card title="5 · Cliente y proyecto (opcional)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cliente o lead">
                  <select
                    value={f.customerId}
                    onChange={(e) => {
                      const c = customers.find((x) => x.id === e.target.value);
                      setField({
                        customerId: e.target.value,
                        ...(c ? { clientName: c.name, address: f.address || c.city } : {}),
                      });
                    }}
                    className={INPUT}
                  >
                    <option value="">Sin asociar</option>
                    <optgroup label="Clientes">
                      {customers
                        .filter((c) => c.status === "cliente")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.city ? ` — ${c.city}` : ""}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Leads">
                      {customers
                        .filter((c) => c.status === "lead")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.city ? ` — ${c.city}` : ""}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </Field>
                <Field label="Proyecto">
                  <select value={f.projectId} onChange={(e) => setField({ projectId: e.target.value })} className={INPUT}>
                    <option value="">Sin asociar</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.customerName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nombre del cliente">
                  <input value={f.clientName} onChange={(e) => setField({ clientName: e.target.value })} className={INPUT} />
                </Field>
                <Field label="Dirección">
                  <input value={f.address} onChange={(e) => setField({ address: e.target.value })} className={INPUT} />
                </Field>
              </div>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6">
            <Card title="Cotización">
              {needsConfirm ? (
                <div className="rounded-lg border border-gold-500/40 bg-gold-500/10 p-4">
                  <p className="text-sm font-bold text-gold-600">Confirmá los datos de la factura</p>
                  <p className="mt-1 text-xs text-body">
                    La lectura automática puede fallar, sobre todo con fotos poco nítidas. Revisá kWh, días y monto
                    contra la factura y corregí lo que haga falta antes de calcular.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <Mini label="kWh" value={f.kwh || "—"} />
                    <Mini label="Días" value={f.days || "—"} />
                    <Mini label="Monto" value={billNum > 0 ? fmtARS.format(billNum) : "—"} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNeedsConfirm(false)}
                    className="mt-4 w-full rounded-lg bg-gold-500 px-4 py-3 text-sm font-bold text-navy-950 shadow-sm transition-all hover:shadow-md"
                  >
                    Los datos son correctos — calcular
                  </button>
                </div>
              ) : !results ? (
                <div>
                  <p className="text-sm text-body">Completá los datos para ver el dimensionamiento:</p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-red-500">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Tile label="Sistema" value={`${nf(results.realKwp, 2)} kWp`} accent />
                    <Tile label="Paneles" value={`${results.panels} × ${nf(inputs.panelW)} W`} />
                    <Tile label="Producción mensual" value={`${nf(results.monthlyProduction)} kWh`} />
                    <Tile label="Cobertura del consumo" value={`${nf(results.realCoveragePct)} %`} />
                    <Tile label="Ahorro mensual" value={fmtARS.format(results.monthlySavingsARS)} />
                    <Tile label="Costo instalado" value={fmtUSD.format(results.costUSD)} sub={`≈ ${fmtARS.format(results.costUSD * inputs.exchangeRate)}`} />
                    <Tile
                      label="Retorno de la inversión"
                      value={results.paybackYears != null ? `${nf(results.paybackYears, 1)} años` : "—"}
                      sub={results.paybackMonths != null ? `${nf(results.paybackMonths)} meses` : undefined}
                      wide
                    />
                  </div>

                  {histStats && (
                    <HistoryBlock stats={histStats} monthlyProduction={results.monthlyProduction} price={inputs.pricePerKwh} />
                  )}

                  {results.warnings.map((w) => (
                    <p key={w} className="mt-3 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs text-gold-600">
                      ⚠ {w}
                    </p>
                  ))}

                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-body">Resumen en texto</p>
                  <pre className="mt-1.5 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-ink/10 bg-background p-3 text-[11px] leading-relaxed text-ink">
                    {summary}
                  </pre>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copySummary}
                      className="rounded-lg border border-ink/15 bg-background px-3.5 py-2.5 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
                    >
                      {copied ? "Copiado ✓" : "Copiar resumen"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheet({ title: "Cotización solar", text: summary })}
                      className="rounded-lg border border-ink/15 bg-background px-3.5 py-2.5 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
                    >
                      Ficha / PDF
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || savedId != null}
                      className="flex-1 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md disabled:opacity-60"
                    >
                      {saving ? "Guardando…" : savedId ? "Guardada ✓" : "Guardar cotización"}
                    </button>
                  </div>
                  {saveError && <p className="mt-2 text-xs text-red-500">{saveError}</p>}
                  {savedId && (
                    <p className="mt-2 text-[11px] text-body">
                      Quedó guardada en el sistema
                      {f.customerId || f.projectId ? " y asociada al cliente/proyecto" : ""}. Si cambiás un dato,
                      volvé a guardar para crear otra versión.
                    </p>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-body">Cotizaciones guardadas</h2>
            {customerFilter && (
              <Chip active onClick={() => setCustomerFilter(null)}>
                Solo de este cliente ✕
              </Chip>
            )}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {visibleQuotes.map((q) => (
              <div key={q.id} className="flex flex-col rounded-xl border border-ink/10 bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{q.clientName || "Sin nombre"}</p>
                    <p className="text-[11px] text-body">
                      {new Date(q.createdAt).toLocaleDateString("es-AR")} · {q.province}
                      {q.address ? ` · ${q.address}` : ""}
                    </p>
                  </div>
                  {q.fromInvoicePhoto && <StatusBadge tone="gold">Desde foto</StatusBadge>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-ink/10 pt-3 text-xs">
                  <dt className="text-body">Sistema</dt>
                  <dd className="font-data text-right text-ink">
                    {nf(q.systemKwp, 2)} kWp · {q.panels} paneles
                  </dd>
                  <dt className="text-body">Costo</dt>
                  <dd className="font-data text-right text-ink">{fmtUSD.format(q.costUSD)}</dd>
                  <dt className="text-body">Ahorro mensual</dt>
                  <dd className="font-data text-right text-ink">{fmtARS.format(q.monthlySavings)}</dd>
                  <dt className="text-body">Retorno</dt>
                  <dd className="font-data text-right text-ink">
                    {q.paybackYears != null ? `${nf(q.paybackYears, 1)} años` : "—"}
                  </dd>
                </dl>
                {confirmDeleteId === q.id ? (
                  <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                    <p className="flex-1 text-[11px] font-semibold text-red-500">¿Eliminar esta cotización?</p>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteSolarQuote(q.id);
                        setConfirmDeleteId(null);
                        reloadQuotes();
                      }}
                      className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg bg-cream-200 px-3 py-2 text-xs font-semibold text-ink"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2 border-t border-ink/10 pt-3">
                    <button
                      type="button"
                      onClick={() => loadQuote(q)}
                      className="flex-1 rounded-lg border border-ink/10 bg-cream-200 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheet({ title: "Cotización solar", text: q.summary })}
                      className="flex-1 rounded-lg border border-ink/10 bg-cream-200 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md"
                    >
                      Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(q.id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 shadow-sm hover:shadow-md"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {visibleQuotes.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-body">Todavía no hay cotizaciones guardadas.</p>
            )}
          </div>
        </div>
      </div>

      {sheet && (
        <PrintDocument title={sheet.title} onClose={() => setSheet(null)}>
          <pre className="whitespace-pre-wrap text-[12px] leading-relaxed">{sheet.text}</pre>
        </PrintDocument>
      )}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Tile({
  label,
  value,
  sub,
  accent,
  wide,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-ink/10 bg-background p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-body">{label}</p>
      <p className={`font-data mt-1 text-lg font-semibold ${accent ? "text-gold-600" : "text-ink"}`}>{value}</p>
      {sub && <p className="text-[11px] text-body">{sub}</p>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-body">{label}</p>
      <p className="font-data mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function HistoryBlock({
  stats,
  monthlyProduction,
  price,
}: {
  stats: NonNullable<ReturnType<typeof summarizeHistory>>;
  monthlyProduction: number;
  price: number;
}) {
  const cov = historyCoverage(stats, monthlyProduction, price);
  const top = Math.max(stats.maxMonthlyKwh, monthlyProduction) * 1.08;
  return (
    <div className="mt-4 rounded-xl border border-ink/10 bg-background p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-body">Consumo histórico vs. producción</p>
      <div className="relative mt-3 h-32">
        <div className="absolute inset-x-0 flex h-full items-end gap-[3px]">
          {stats.rows.map((r, i) => (
            <div key={i} className="flex h-full flex-1 items-end" title={`${r.label}: ${nf(r.monthlyKwh)} kWh/mes`}>
              <div
                className={`w-full rounded-t-sm ${r.monthlyKwh > monthlyProduction ? "bg-negocio/70" : "bg-green-500/70"}`}
                style={{ height: `${(r.monthlyKwh / top) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-gold-500"
          style={{ bottom: `${(monthlyProduction / top) * 100}%` }}
        />
        <span
          className="absolute right-0 rounded bg-gold-500 px-1 text-[9px] font-bold text-navy-950"
          style={{ bottom: `calc(${(monthlyProduction / top) * 100}% + 2px)` }}
        >
          Sistema {nf(monthlyProduction)} kWh
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-body">
        <span>{stats.rows[0].label}</span>
        <span>{stats.rows[stats.rows.length - 1].label}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="Promedio" value={`${nf(stats.avgMonthlyKwh)} kWh`} />
        <Mini label={`Mín. ${stats.minLabel}`} value={`${nf(stats.minMonthlyKwh)} kWh`} />
        <Mini label={`Máx. ${stats.maxLabel}`} value={`${nf(stats.maxMonthlyKwh)} kWh`} />
      </div>
      <p className="mt-2.5 text-[11px] text-body">
        Mes a mes el sistema cubre <b className="text-ink">{nf(cov.annualCoveragePct)}%</b> del consumo del
        historial y ahorra en promedio <b className="text-ink">{fmtARS.format(cov.avgMonthlySavingsARS)}</b> por mes.
        {cov.surplusPeriods > 0 && ` En ${cov.surplusPeriods} de ${stats.periods} períodos produce más de lo que se consume (excedente).`}
      </p>
    </div>
  );
}

// Recuadro para marcar el gráfico sobre la foto (mouse o dedo).
function RegionPicker({
  canvas,
  onConfirm,
  busy,
  progress,
}: {
  canvas: HTMLCanvasElement;
  onConfirm: (region: Region) => void;
  busy: boolean;
  progress: number;
}) {
  const [rect, setRect] = useState({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });
  const url = useMemo(() => canvas.toDataURL("image/jpeg", 0.75), [canvas]);
  const boxRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const pointAt = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };

  return (
    <div className="mt-3">
      <p className="text-[11px] text-body">Arrastrá sobre la foto para encerrar solo el gráfico de barras (con los números de cada barra).</p>
      <div
        ref={boxRef}
        className="relative mt-2 touch-none select-none overflow-hidden rounded-lg border border-ink/20"
        style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = pointAt(e);
          setRect({ ...start.current, w: 0, h: 0 });
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = pointAt(e);
          setRect({
            x: Math.min(start.current.x, p.x),
            y: Math.min(start.current.y, p.y),
            w: Math.abs(p.x - start.current.x),
            h: Math.abs(p.y - start.current.y),
          });
        }}
        onPointerUp={() => {
          start.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Factura" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute border-2 border-gold-500 bg-gold-500/15"
          style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
        />
      </div>
      <button
        type="button"
        disabled={busy || rect.w < 0.04 || rect.h < 0.03}
        onClick={() =>
          onConfirm({
            x: rect.x * canvas.width,
            y: rect.y * canvas.height,
            w: rect.w * canvas.width,
            h: rect.h * canvas.height,
          })
        }
        className="mt-2 w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 disabled:opacity-50"
      >
        {busy ? `Leyendo el gráfico… ${Math.round(progress * 100)}%` : "Leer el gráfico marcado"}
      </button>
    </div>
  );
}
