"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NumberField from "@/components/NumberField";
import PrintDocument from "@/components/admin/PrintDocument";
import ConsumptionHistory from "@/components/admin/ConsumptionHistory";
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
  createProjectFromQuote,
  uploadChartImage,
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
  parseArNumber,
  parseInvoiceText,
  summarizeHistory,
  validateInputs,
  type BomLine,
  type BomOverride,
  type HistoryPeriod,
  type QuoteInputs,
  type SizingBasis,
  type SystemSetup,
  type SystemType,
} from "@/lib/solar-quote";
import {
  DEFAULT_SETUP,
  KIND_LABELS,
  SYSTEM_LABELS,
  buildBom,
  recommendSystemType,
  withCost,
} from "@/lib/solar-system";

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

  const [setup, setSetup] = useState<SystemSetup>(DEFAULT_SETUP);
  const [panelId, setPanelId] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [costMode, setCostMode] = useState<"lista" | "wp">("lista");
  const [bomOv, setBomOv] = useState<Record<string, BomOverride>>({});
  const [manualLines, setManualLines] = useState<BomLine[]>([]);
  const [chartCanvas, setChartCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectingChart, setSelectingChart] = useState(false);
  const [chartRef, setChartRef] = useState<string | null>(null);
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
  const [sheet, setSheet] = useState<{ title: string; text: string; image?: string } | null>(null);
  const [creatingProject, setCreatingProject] = useState<string | null>(null);
  const [projectMsg, setProjectMsg] = useState<string | null>(null);
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

  const components = settings.solarComponents;
  const panelList = components.filter((c) => c.kind === "panel");
  const selectedPanel = panelList.find((c) => c.id === panelId) ?? panelList[0];
  const batteryList = components.filter((c) => c.kind === "bateria");
  const rec = useMemo(() => recommendSystemType(setup), [setup]);
  const systemType: SystemType = setup.mode === "auto" ? rec.type : setup.mode;
  const systemReason = setup.mode === "auto" ? rec.reason : "elegido manualmente por el ingeniero.";
  const patchSetup = (patch: Partial<SystemSetup>) => {
    setSetup((prev) => ({ ...prev, ...patch }));
    setSavedId(null);
  };

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
      panelW: selectedPanel ? selectedPanel.spec : Number(f.panelW) || 0,
      performanceRatio: Number(f.pr) || 0,
      coveragePct: Number(f.coverage) || 0,
      costPerWp: Number(costStr) || 0,
      exchangeRate: Number(rateStr) || 0,
      systemType,
      setup,
      panelId: selectedPanel?.id,
      costMode,
      bomOverrides: bomOv,
      manualLines,
    }),
    [kwhNum, billNum, f.days, priceStr, f.province, hspStr, f.panelW, f.pr, f.coverage, costStr, rateStr, history, histStats, useHistory, selectedPanel, systemType, setup, costMode, bomOv, manualLines],
  );

  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const baseResults = useMemo(() => calculateQuote(inputs), [inputs]);
  const bom = useMemo(
    () =>
      baseResults
        ? buildBom({
            type: systemType,
            components,
            panelId: selectedPanel?.id,
            batteryId,
            panels: baseResults.panels,
            realKwp: baseResults.realKwp,
            dailyKwh: baseResults.dailyKwh,
            setup,
            overrides: bomOv,
            manualLines,
          })
        : null,
    [baseResults, systemType, components, selectedPanel, batteryId, setup, bomOv, manualLines],
  );
  const useList = costMode === "lista" && !!bom && bom.missing.length === 0;
  const results = useMemo(() => {
    if (!baseResults || !bom) return null;
    const extraWarnings: string[] = [];
    if (costMode === "lista" && bom.missing.length > 0) {
      extraWarnings.push(
        `No se pudo usar la lista de precios: falta cargar ${bom.missing.join(", ")} en Configuración → Equipos y precios. Se usa el costo por Wp.`,
      );
    }
    if (!useList && systemType !== "ongrid") {
      extraWarnings.push("El costo por Wp no incluye las baterías: para híbrido u off-grid usá la lista de precios.");
    }
    return withCost(baseResults, inputs, {
      costUSD: useList ? bom.totalUSD : baseResults.costUSD,
      source: useList ? "lista" : "wp",
      type: systemType,
      reason: systemReason,
      bom: useList ? bom.lines : undefined,
      inverterKw: bom.inverterKw || undefined,
      batteryKwh: bom.batteryKwh || undefined,
      extraWarnings,
    });
  }, [baseResults, bom, inputs, costMode, useList, systemType, systemReason]);
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
  function applyPaste(textOverride?: string, fromChart = false) {
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
        ...(fromChart && kwh > 0 ? { ocr: true } : {}),
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
      setChartRef(null);
      setSelectingChart(true);
    } catch {
      setChartMsg("No se pudo abrir la imagen. Probá con una foto en JPG o PNG.");
    }
  }

  // Recorte del gráfico para tenerlo a la vista mientras se carga o verifica.
  function showReference(region: Region) {
    if (!chartCanvas) return;
    const c = document.createElement("canvas");
    c.width = Math.round(region.w);
    c.height = Math.round(region.h);
    c.getContext("2d")!.drawImage(chartCanvas, region.x, region.y, region.w, region.h, 0, 0, c.width, c.height);
    setChartRef(c.toDataURL("image/jpeg", 0.85));
    setSelectingChart(false);
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
      applyPaste(text, true);
      showReference(region);
      setChartMsg(
        `Detecté ${r.total} barras y leí ${r.read} valores${r.estimated ? ` (${r.estimated} se estimaron por la altura de la barra)` : ""}${r.read < r.total ? "; los marcados en rojo hay que completarlos mirando el gráfico" : ""}. Los valores en ámbar los leyó la foto: verificalos contra el recorte de abajo y revisá que los meses coincidan.`,
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
      // La foto del gráfico se guarda con la cotización; si no se puede subir,
      // la cotización se guarda igual.
      let chartImageUrl: string | undefined;
      if (chartRef?.startsWith("data:")) {
        try {
          chartImageUrl = await uploadChartImage(chartRef);
          setChartRef(chartImageUrl);
        } catch (e) {
          console.error("Subir gráfico:", e);
        }
      } else if (chartRef) chartImageUrl = chartRef;
      const saved = await createSolarQuote({
        createdBy: member?.id ?? null,
        customerId: f.customerId || null,
        projectId: f.projectId || null,
        clientName: f.clientName.trim(),
        address: f.address.trim(),
        inputs: chartImageUrl ? { ...inputs, chartImageUrl } : inputs,
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

  // Crea un proyecto real (etapa "Cotización enviada") con los datos de la cotización.
  async function convertToProject(q: SolarQuote) {
    setCreatingProject(q.id);
    setProjectMsg(null);
    try {
      const customer = customers.find((c) => c.id === q.customerId);
      await createProjectFromQuote(q, customer, member?.id ?? null);
      await reloadQuotes();
    } catch (e) {
      console.error("Crear proyecto:", e);
      setProjectMsg("No se pudo crear el proyecto. Reintentá.");
    } finally {
      setCreatingProject(null);
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
    setChartRef(q.inputs.chartImageUrl ?? null);
    setBasisChoice(q.inputs.basis ?? "historial");
    setSetup(q.inputs.setup ?? DEFAULT_SETUP);
    setPanelId(q.inputs.panelId ?? "");
    setCostMode(q.inputs.costMode ?? "wp");
    setBomOv(q.inputs.bomOverrides ?? {});
    setManualLines(q.inputs.manualLines ?? []);
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
    setSetup(DEFAULT_SETUP);
    setPanelId("");
    setBatteryId("");
    setCostMode("lista");
    setBomOv({});
    setManualLines([]);
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
    <section className="px-4 py-6 pb-44 sm:px-8 sm:py-10 sm:pb-44 lg:pb-10">
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

        <div className="mt-6 grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
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
                    onClick={() => setSelectingChart(true)}
                    className="mt-2 rounded-lg bg-gold-500 px-3.5 py-2 text-xs font-bold text-navy-950 shadow-sm transition-all hover:shadow-md"
                  >
                    Marcar el gráfico en la foto
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
                    onReference={showReference}
                    onClose={() => setSelectingChart(false)}
                    onNewPhoto={loadChartPhoto}
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
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Mes del último dato">
                  <input
                    type="month"
                    value={histEnd}
                    onChange={(e) => setHistEnd(e.target.value)}
                    className={`${INPUT} min-w-0 appearance-none`}
                    style={{ minHeight: "2.75rem" }}
                  />
                </Field>
                <Field label="Días por período">
                  <NumberField suffix=" días" value={histDays} onValueChange={setHistDays} className={INPUT} />
                </Field>
              </div>
              <p className="mt-1 text-[11px] text-body">
                30 días si la factura es mensual, 60 si es bimestral. Los meses se calculan hacia atrás desde el «mes
                del último dato» (el de esta factura): si alguno no coincide con el gráfico, corregilo en la lista.
              </p>
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
                  {chartRef && (
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-ink">Gráfico de la factura (para comparar)</p>
                      <div className="mt-1 max-h-60 overflow-auto rounded-lg border border-ink/10 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={chartRef} alt="Gráfico de consumo" className="block w-[560px] max-w-none sm:w-full" />
                      </div>
                      <p className="mt-1 text-[11px] text-body">Deslizá para ver todo el gráfico.</p>
                    </div>
                  )}
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-ink/10">
                    {history.map((row, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-[auto_3.75rem_minmax(0,1fr)_4.25rem] items-center gap-1.5 border-b border-ink/10 px-2 py-1.5 last:border-0 ${row.included ? "" : "opacity-45"}`}
                      >
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) => updateRow(idx, { included: e.target.checked })}
                          aria-label={`Incluir ${row.label}`}
                          className="h-4 w-4 shrink-0"
                        />
                        <input
                          value={row.label}
                          onChange={(e) => updateRow(idx, { label: e.target.value })}
                          aria-label="Mes"
                          className="font-data w-full min-w-0 rounded-md border border-ink/10 bg-background px-1.5 py-1.5 text-xs text-ink"
                        />
                        <NumberField
                          suffix=" kWh"
                          value={row.kwh || ""}
                          placeholder="falta dato"
                          onValueChange={(v) => updateRow(idx, { kwh: Number(v) || 0, ocr: false })}
                          onFocus={() => row.ocr && updateRow(idx, { ocr: false })}
                          className={`w-full min-w-0 rounded-md border bg-background px-2 py-1.5 text-xs text-ink ${row.kwh <= 0 ? "border-red-500/60 bg-red-500/5" : row.ocr ? "border-gold-500 bg-gold-500/10" : "border-ink/10"}`}
                        />
                        <NumberField
                          suffix=" d"
                          value={row.days}
                          onValueChange={(v) => updateRow(idx, { days: Number(v) || 0 })}
                          className="w-full min-w-0 rounded-md border border-ink/10 bg-background px-1.5 py-1.5 text-xs text-ink"
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
                {panelList.length > 0 ? (
                  <Field label="Panel (de tu lista de precios)">
                    <select
                      value={selectedPanel?.id ?? ""}
                      onChange={(e) => {
                        setPanelId(e.target.value);
                        setSavedId(null);
                      }}
                      className={INPUT}
                    >
                      {panelList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · US$ {c.priceUSD}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Potencia del panel (W)">
                    <NumberField suffix=" W" value={f.panelW} onValueChange={(v) => setField({ panelW: v })} className={INPUT} />
                  </Field>
                )}
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

            <Card title="5 · Tipo de sistema">
              <div className="grid grid-cols-2 gap-4">
                <Field label="¿Hay red eléctrica en el lugar?">
                  <select
                    value={setup.gridAvailable ? "si" : "no"}
                    onChange={(e) => patchSetup({ gridAvailable: e.target.value === "si" })}
                    className={INPUT}
                  >
                    <option value="si">Sí, tiene red</option>
                    <option value="no">No, es un lugar sin red</option>
                  </select>
                </Field>
                <Field label="¿Necesita respaldo ante cortes?">
                  <select
                    value={setup.backupNeeded ? "si" : "no"}
                    onChange={(e) => patchSetup({ backupNeeded: e.target.value === "si" })}
                    disabled={!setup.gridAvailable}
                    className={`${INPUT} disabled:opacity-50`}
                  >
                    <option value="no">No</option>
                    <option value="si">Sí, quiere baterías</option>
                  </select>
                </Field>
              </div>
              <div className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2.5 text-xs">
                <p className="font-bold text-gold-600">Recomendado: {SYSTEM_LABELS[rec.type]}</p>
                <p className="mt-0.5 text-body">{rec.reason}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Field label="Tipo de sistema">
                  <select
                    value={setup.mode}
                    onChange={(e) => patchSetup({ mode: e.target.value as SystemSetup["mode"] })}
                    className={INPUT}
                  >
                    <option value="auto">Automático (recomendado)</option>
                    <option value="ongrid">On-grid</option>
                    <option value="hibrido">Híbrido</option>
                    <option value="offgrid">Off-grid</option>
                  </select>
                </Field>
                {systemType !== "ongrid" && batteryList.length > 1 && (
                  <Field label="Batería">
                    <select value={batteryId || batteryList[0].id} onChange={(e) => setBatteryId(e.target.value)} className={INPUT}>
                      {batteryList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · US$ {c.priceUSD}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>

              {systemType === "hibrido" && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field label="Consumo a respaldar (%)">
                    <NumberField suffix=" %" value={setup.backupPct} onValueChange={(v) => patchSetup({ backupPct: Number(v) || 0 })} className={INPUT} />
                  </Field>
                  <Field label="Horas de corte a cubrir">
                    <NumberField suffix=" h" value={setup.backupHours} onValueChange={(v) => patchSetup({ backupHours: Number(v) || 0 })} className={INPUT} />
                  </Field>
                </div>
              )}
              {systemType === "offgrid" && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field label="Días de autonomía">
                    <NumberField decimals suffix=" días" value={setup.autonomyDays} onValueChange={(v) => patchSetup({ autonomyDays: Number(v) || 0 })} className={INPUT} />
                  </Field>
                </div>
              )}
              {systemType !== "ongrid" && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field label="Descarga útil de la batería (%)">
                    <NumberField suffix=" %" value={setup.dodPct} onValueChange={(v) => patchSetup({ dodPct: Number(v) || 0 })} className={INPUT} />
                  </Field>
                  <Field label="Potencia pico de las cargas (kW)">
                    <NumberField decimals suffix=" kW" value={setup.peakKw || ""} placeholder="opcional" onValueChange={(v) => patchSetup({ peakKw: Number(v) || 0 })} className={INPUT} />
                  </Field>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-semibold text-ink">Cómo se calcula el costo</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Chip active={costMode === "lista"} onClick={() => setCostMode("lista")}>
                    Según mi lista de precios
                  </Chip>
                  <Chip active={costMode === "wp"} onClick={() => setCostMode("wp")}>
                    Por Wp instalado
                  </Chip>
                </div>
                {components.length === 0 && (
                  <p className="mt-2 text-[11px] text-body">
                    Todavía no cargaste equipos: hacelo en Configuración → Equipos y precios para cotizar con tus
                    precios reales.
                  </p>
                )}
              </div>
            </Card>

            <Card title="6 · Cliente y proyecto (opcional)">
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
                      label="Tipo de sistema"
                      value={SYSTEM_LABELS[results.systemType ?? systemType]}
                      sub={[
                        results.inverterKw ? `inversor ${nf(results.inverterKw, 1)} kW` : null,
                        results.batteryKwh ? `baterías ${nf(results.batteryKwh, 1)} kWh` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || undefined}
                      wide
                    />
                    <Tile
                      label="Retorno de la inversión"
                      value={results.paybackYears != null ? `${nf(results.paybackYears, 1)} años` : "—"}
                      sub={results.paybackMonths != null ? `${nf(results.paybackMonths)} meses` : undefined}
                      wide
                    />
                  </div>

                  {results.costSource === "lista" && bom && (
                    <BomCard
                      lines={bom.lines}
                      total={bom.totalUSD}
                      onOverride={(id, patch) => {
                        setBomOv((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
                        setSavedId(null);
                      }}
                      onManual={(next) => {
                        setManualLines(next);
                        setSavedId(null);
                      }}
                      manualLines={manualLines}
                    />
                  )}

                  {histStats && (
                    <div className="mt-4">
                      <ConsumptionHistory
                        history={history}
                        monthlyProduction={results.monthlyProduction}
                        pricePerKwh={inputs.pricePerKwh}
                        exchangeRate={inputs.exchangeRate}
                      />
                    </div>
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
                      onClick={() => setSheet({ title: "Cotización solar", text: summary, image: chartRef ?? undefined })}
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
          {projectMsg && <p className="mt-2 text-xs font-semibold text-red-500">{projectMsg}</p>}
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
                      onClick={() => setSheet({ title: "Cotización solar", text: q.summary, image: q.inputs.chartImageUrl })}
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
                {confirmDeleteId !== q.id && (
                  <div className="mt-2">
                    {q.projectId ? (
                      <Link
                        href="/admin/proyectos"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-status-done/40 bg-status-done/10 py-2 text-xs font-bold text-status-done"
                      >
                        ✓ Ya es un proyecto — ver Proyectos
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => convertToProject(q)}
                        disabled={creatingProject === q.id}
                        className="w-full rounded-lg bg-navy-900 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-800 disabled:opacity-60"
                      >
                        {creatingProject === q.id ? "Creando proyecto…" : "Convertir en proyecto"}
                      </button>
                    )}
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
          {sheet.image && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide">Historial de consumo (gráfico de la factura)</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sheet.image} alt="Gráfico de consumo" className="mt-2 w-full rounded border border-black/10" />
            </div>
          )}
        </PrintDocument>
      )}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5 min-w-0">{children}</div>
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

// Marcador del gráfico en pantalla completa: esquinas grandes para el dedo,
// arrastrar adentro mueve el recuadro y lo de afuera se oscurece.
type Frac = { x: number; y: number; w: number; h: number };
type Drag = "move" | "nw" | "ne" | "sw" | "se" | "new";

function RegionPicker({
  canvas,
  onConfirm,
  onReference,
  onClose,
  onNewPhoto,
  busy,
  progress,
}: {
  canvas: HTMLCanvasElement;
  onConfirm: (region: Region) => void;
  onReference: (region: Region) => void;
  onClose: () => void;
  onNewPhoto: (file: File) => void;
  busy: boolean;
  progress: number;
}) {
  const [rect, setRect] = useState<Frac>({ x: 0.06, y: 0.06, w: 0.88, h: 0.88 });
  const url = useMemo(() => canvas.toDataURL("image/jpeg", 0.8), [canvas]);
  const boxRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  // Tamaño real (px) de la foto ajustada al espacio disponible: no depende de
  // porcentajes ni de aspect-ratio, que en celulares terminan desbordando.
  const [fit, setFit] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ mode: Drag; p0: { x: number; y: number }; r0: Frac } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const aw = el.clientWidth - 16;
      const ah = el.clientHeight - 16;
      if (aw <= 0 || ah <= 0) return;
      const k = Math.min(aw / canvas.width, ah / canvas.height);
      setFit({ w: Math.floor(canvas.width * k), h: Math.floor(canvas.height * k) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas]);

  const pointAt = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };
  const begin = (e: React.PointerEvent, mode: Drag) => {
    e.stopPropagation();
    boxRef.current!.setPointerCapture(e.pointerId);
    const p0 = pointAt(e);
    drag.current = { mode, p0, r0: mode === "new" ? { x: p0.x, y: p0.y, w: 0, h: 0 } : rect };
    if (mode === "new") setRect({ x: p0.x, y: p0.y, w: 0, h: 0 });
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = pointAt(e);
    const { r0, p0, mode } = d;
    if (mode === "move") {
      const dx = Math.min(1 - r0.w - r0.x, Math.max(-r0.x, p.x - p0.x));
      const dy = Math.min(1 - r0.h - r0.y, Math.max(-r0.y, p.y - p0.y));
      setRect({ ...r0, x: r0.x + dx, y: r0.y + dy });
      return;
    }
    let x1 = r0.x;
    let y1 = r0.y;
    let x2 = r0.x + r0.w;
    let y2 = r0.y + r0.h;
    if (mode === "new") {
      x1 = Math.min(p0.x, p.x);
      x2 = Math.max(p0.x, p.x);
      y1 = Math.min(p0.y, p.y);
      y2 = Math.max(p0.y, p.y);
    } else {
      if (mode.includes("w")) x1 = p.x;
      if (mode.includes("e")) x2 = p.x;
      if (mode.includes("n")) y1 = p.y;
      if (mode.includes("s")) y2 = p.y;
    }
    setRect({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) });
  };

  const toRegion = (): Region => ({
    x: rect.x * canvas.width,
    y: rect.y * canvas.height,
    w: rect.w * canvas.width,
    h: rect.h * canvas.height,
  });
  const tooSmall = rect.w < 0.04 || rect.h < 0.03;
  const corner = (mode: Drag, style: React.CSSProperties) => (
    <div
      onPointerDown={(e) => begin(e, mode)}
      className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none place-items-center"
      style={style}
    >
      <span className="h-5 w-5 rounded-full border-[3px] border-white bg-gold-500 shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-black text-white">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm font-bold">Encerrá el gráfico de barras</p>
        <button type="button" onClick={onClose} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold">
          Cerrar
        </button>
      </div>
      <p className="px-4 text-[11px] leading-snug text-white/70">
        Movelo desde adentro y ajustá las esquinas naranjas. Incluí las barras con sus números.
      </p>
      <div ref={areaRef} className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-2">
        <div
          ref={boxRef}
          className="relative shrink-0 touch-none select-none"
          style={{ width: fit?.w ?? 0, height: fit?.h ?? 0 }}
          onPointerDown={(e) => begin(e, "new")}
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Factura" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
          <div
            onPointerDown={(e) => begin(e, "move")}
            className="absolute cursor-move border-[3px] border-gold-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
          />
          {corner("nw", { left: `${rect.x * 100}%`, top: `${rect.y * 100}%` })}
          {corner("ne", { left: `${(rect.x + rect.w) * 100}%`, top: `${rect.y * 100}%` })}
          {corner("sw", { left: `${rect.x * 100}%`, top: `${(rect.y + rect.h) * 100}%` })}
          {corner("se", { left: `${(rect.x + rect.w) * 100}%`, top: `${(rect.y + rect.h) * 100}%` })}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          disabled={busy || tooSmall}
          onClick={() => onConfirm(toRegion())}
          className="w-full rounded-xl bg-gold-500 px-4 py-3 text-sm font-extrabold text-navy-950 disabled:opacity-50"
        >
          {busy ? `Leyendo el gráfico… ${Math.round(progress * 100)}%` : "Leer el gráfico marcado"}
        </button>
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
          <button
            type="button"
            disabled={busy || tooSmall}
            onClick={() => onReference(toRegion())}
            className="col-span-2 rounded-lg bg-white/15 px-3 py-2.5 disabled:opacity-50"
          >
            Cargar a mano mirando la foto
          </button>
          {(["cam", "gal"] as const).map((k) => (
            <label key={k} className="grid cursor-pointer place-items-center rounded-lg bg-white/15 px-3 py-2.5">
              {k === "cam" ? "Sacar otra foto" : "Elegir otra"}
              <input
                type="file"
                accept="image/*"
                {...(k === "cam" ? { capture: "environment" as const } : {})}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onNewPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lista de materiales con precios: todo se puede corregir en cada cotización.
function BomCard({
  lines,
  total,
  onOverride,
  onManual,
  manualLines,
}: {
  lines: BomLine[];
  total: number;
  onOverride: (id: string, patch: BomOverride) => void;
  onManual: (next: BomLine[]) => void;
  manualLines: BomLine[];
}) {
  const setManual = (id: string, patch: Partial<BomLine>) =>
    onManual(manualLines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="mt-4 rounded-xl border border-ink/10 bg-background p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-body">Lista de materiales (USD)</p>
      <div className="mt-2 flex flex-col gap-2">
        {lines.map((l) => (
          <div
            key={l.id}
            className={`rounded-lg border p-2.5 ${l.missing ? "border-red-500/40 bg-red-500/5" : "border-ink/10 bg-surface"} ${l.included ? "" : "opacity-50"}`}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={l.included}
                onChange={(e) => (l.manual ? setManual(l.id, { included: e.target.checked }) : onOverride(l.id, { included: e.target.checked }))}
                aria-label={`Incluir ${l.name}`}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <div className="min-w-0 flex-1">
                {l.manual ? (
                  <input
                    value={l.name}
                    onChange={(e) => setManual(l.id, { name: e.target.value })}
                    className="w-full rounded-md border border-ink/10 bg-background px-2 py-1 text-xs text-ink"
                    aria-label="Nombre del ítem"
                  />
                ) : (
                  <p className="text-xs font-semibold text-ink">{l.name}</p>
                )}
                <p className="text-[10px] text-body">
                  {l.kind === "manual" ? "Ítem manual" : KIND_LABELS[l.kind]}
                  {l.note ? ` · ${l.note}` : ""}
                </p>
              </div>
              <p className="font-data shrink-0 text-xs font-semibold text-ink">{fmtUSD.format(l.qty * l.unitPriceUSD)}</p>
              {l.manual && (
                <button
                  type="button"
                  onClick={() => onManual(manualLines.filter((x) => x.id !== l.id))}
                  className="shrink-0 text-xs font-semibold text-red-500"
                  aria-label="Quitar ítem"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <NumberField
                decimals
                suffix={` ${l.unitLabel}`}
                value={l.qty}
                onValueChange={(v) => (l.manual ? setManual(l.id, { qty: Number(v) || 0 }) : onOverride(l.id, { qty: Number(v) || 0 }))}
                className="w-full min-w-0 rounded-md border border-ink/10 bg-background px-2 py-1.5 text-xs text-ink"
              />
              <NumberField
                decimals
                prefix="US$ "
                value={l.unitPriceUSD}
                onValueChange={(v) => (l.manual ? setManual(l.id, { unitPriceUSD: Number(v) || 0 }) : onOverride(l.id, { price: Number(v) || 0 }))}
                className="w-full min-w-0 rounded-md border border-ink/10 bg-background px-2 py-1.5 text-xs text-ink"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onManual([
            ...manualLines,
            { id: "m-" + Date.now().toString(36), kind: "manual", name: "Ítem", qty: 1, unitPriceUSD: 0, unitLabel: "u.", included: true, manual: true },
          ])
        }
        className="mt-2 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md"
      >
        + Agregar ítem
      </button>
      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-xs font-bold uppercase tracking-wide text-body">Total instalado</span>
        <span className="font-data text-lg font-semibold text-gold-600">{fmtUSD.format(total)}</span>
      </div>
    </div>
  );
}
