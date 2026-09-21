import { PROVINCIAS_ARGENTINA } from "./provincias";

// Horas sol pico (HSP) promedio por provincia — kWh/m²/día. Son valores
// aproximados de referencia: se editan desde Configuración → Cotizador solar
// para ajustarlos con datos más precisos de cada zona.
export const DEFAULT_HSP: Record<string, number> = {
  "Buenos Aires": 4.5,
  CABA: 4.5,
  Catamarca: 5.8,
  Chaco: 5.0,
  Chubut: 4.3,
  Córdoba: 5.0,
  Corrientes: 4.9,
  "Entre Ríos": 4.8,
  Formosa: 5.0,
  Jujuy: 5.8,
  "La Pampa": 5.0,
  "La Rioja": 5.8,
  Mendoza: 5.6,
  Misiones: 4.6,
  Neuquén: 4.8,
  "Río Negro": 4.8,
  Salta: 5.5,
  "San Juan": 5.9,
  "San Luis": 5.3,
  "Santa Cruz": 3.8,
  "Santa Fe": 4.8,
  "Santiago del Estero": 5.3,
  "Tierra del Fuego": 3.2,
  Tucumán: 4.9,
};

export const DEFAULT_INSTALL_COST_PER_WP = 1.2; // USD por Wp instalado
export const OFFGRID_EFFICIENCY = 0.85; // rendimiento del ciclo de batería
export const DEFAULT_PANEL_W = 450;
export const DEFAULT_PERFORMANCE_RATIO = 0.78;
export const DEFAULT_COVERAGE_PCT = 90;
export const DEFAULT_BILLING_DAYS = 60;
export const DEFAULT_PRICE_PER_KWH = 100; // $/kWh de referencia hasta cargar la factura
export const DEFAULT_PROVINCE = "Misiones";
export const PROVINCES = PROVINCIAS_ARGENTINA as readonly string[];

// Distribuidoras reconocibles en una factura → provincia / zona.
const DISTRIBUIDORAS: { pattern: RegExp; province: string }[] = [
  { pattern: /edenor|edesur/i, province: "CABA" },
  { pattern: /\bepec\b/i, province: "Córdoba" },
  { pattern: /\bepe\b|empresa provincial de la energ[ií]a/i, province: "Santa Fe" },
  { pattern: /edemsa/i, province: "Mendoza" },
  { pattern: /\bedet\b/i, province: "Tucumán" },
  { pattern: /edesa\b/i, province: "Salta" },
  { pattern: /ejesa/i, province: "Jujuy" },
  { pattern: /enersa/i, province: "Entre Ríos" },
  { pattern: /\bemsa\b|energ[ií]a de misiones/i, province: "Misiones" },
  { pattern: /\bdpec\b/i, province: "Corrientes" },
  { pattern: /secheep/i, province: "Chaco" },
  { pattern: /refsa/i, province: "Formosa" },
  { pattern: /edese/i, province: "Santiago del Estero" },
  { pattern: /edelap|\beden\b|\bedea\b|\bedes\b/i, province: "Buenos Aires" },
  { pattern: /\bepen\b/i, province: "Neuquén" },
  { pattern: /edersa/i, province: "Río Negro" },
  { pattern: /edecat/i, province: "Catamarca" },
  { pattern: /edelar/i, province: "La Rioja" },
  { pattern: /edesal/i, province: "San Luis" },
];

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function inferProvince(distribuidora: string | null, provincia?: string | null): string | null {
  if (distribuidora) {
    const clean = distribuidora.replace(/\./g, "");
    const hit = DISTRIBUIDORAS.find((d) => d.pattern.test(clean));
    if (hit) return hit.province;
  }
  if (provincia) {
    const n = normalize(provincia);
    if (/capital federal|ciudad autonoma|\bcaba\b/.test(n)) return "CABA";
    const found = PROVINCES.find((p) => normalize(p) === n || n.includes(normalize(p)));
    if (found) return found;
  }
  return null;
}

export type SystemType = "ongrid" | "hibrido" | "offgrid";

export type ComponentKind =
  | "panel"
  | "inversor_ongrid"
  | "inversor_hibrido"
  | "inversor_offgrid"
  | "bateria"
  | "estructura"
  | "proteccion"
  | "instalacion"
  | "otro";
export type PriceUnit = "unidad" | "por_panel" | "por_kwp";

// Equipo o rubro con precio manual (Configuración → Equipos y precios).
// spec: potencia del panel (W), del inversor (kW) o capacidad de la batería (kWh).
export type SolarComponent = {
  id: string;
  kind: ComponentKind;
  name: string;
  spec: number;
  priceUSD: number;
  unit: PriceUnit;
};

// Datos para decidir qué tipo de sistema hace falta y cómo respaldarlo.
export type SystemSetup = {
  mode: "auto" | SystemType;
  gridAvailable: boolean;
  backupNeeded: boolean;
  backupPct: number; // % del consumo diario a respaldar en un corte
  backupHours: number; // horas de corte a cubrir
  autonomyDays: number; // días de autonomía (off-grid)
  dodPct: number; // profundidad de descarga útil de la batería
  peakKw: number; // potencia pico de las cargas a respaldar (0 = no informada)
};

export type BomLine = {
  id: string;
  kind: ComponentKind | "manual";
  name: string;
  qty: number;
  unitPriceUSD: number;
  unitLabel: string;
  included: boolean;
  missing?: boolean;
  note?: string;
  manual?: boolean;
};
export type BomOverride = { qty?: number; price?: number; included?: boolean };

// Un período del historial de consumo (una barra del gráfico de la factura).
export type HistoryPeriod = {
  label: string;
  kwh: number;
  days: number;
  included: boolean;
  ocr?: boolean; // leído de la foto y todavía sin verificar por una persona
};

export type SizingBasis = "historial" | "factura";

export type QuoteInputs = {
  // Foto del gráfico de historial de la factura, guardada con la cotización.
  chartImageUrl?: string;
  // kWh y días con los que se dimensiona: el historial sumado, o la última factura.
  kwh: number;
  days: number;
  totalBill: number | null;
  pricePerKwh: number;
  province: string;
  hsp: number;
  panelW: number;
  performanceRatio: number;
  coveragePct: number;
  costPerWp: number;
  exchangeRate: number;
  history?: HistoryPeriod[];
  basis?: SizingBasis;
  billKwh?: number; // última factura, para comparar contra el promedio
  billDays?: number;
  // Tipo de sistema y lista de precios (se guardan para poder reabrir la cotización).
  systemType?: SystemType;
  setup?: SystemSetup;
  panelId?: string;
  costMode?: "lista" | "wp";
  bomOverrides?: Record<string, BomOverride>;
  manualLines?: BomLine[];
};

export type QuoteResults = {
  dailyKwh: number;
  monthlyKwh: number;
  targetDailyProduction: number;
  idealKwp: number;
  panels: number;
  realW: number;
  realKwp: number;
  monthlyProduction: number;
  realCoveragePct: number;
  monthlySavingsARS: number;
  costUSD: number;
  paybackMonths: number | null;
  paybackYears: number | null;
  warnings: string[];
  systemType?: SystemType;
  systemReason?: string;
  inverterKw?: number;
  batteryKwh?: number;
  bom?: BomLine[];
  costSource?: "lista" | "wp";
};

export type HistoryStats = {
  periods: number;
  totalKwh: number;
  totalDays: number;
  avgMonthlyKwh: number;
  minMonthlyKwh: number;
  maxMonthlyKwh: number;
  minLabel: string;
  maxLabel: string;
  rows: { label: string; monthlyKwh: number }[];
};

// Consumo mensual equivalente (a 30 días) de cada período incluido.
export function summarizeHistory(history: HistoryPeriod[] | undefined): HistoryStats | null {
  const rows = (history ?? []).filter((h) => h.included && h.kwh > 0 && h.days > 0);
  if (rows.length === 0) return null;
  const mapped = rows.map((h) => ({ label: h.label, monthlyKwh: (h.kwh / h.days) * 30 }));
  const totalKwh = rows.reduce((a, h) => a + h.kwh, 0);
  const totalDays = rows.reduce((a, h) => a + h.days, 0);
  const min = mapped.reduce((a, b) => (b.monthlyKwh < a.monthlyKwh ? b : a));
  const max = mapped.reduce((a, b) => (b.monthlyKwh > a.monthlyKwh ? b : a));
  return {
    periods: rows.length,
    totalKwh,
    totalDays,
    avgMonthlyKwh: (totalKwh / totalDays) * 30,
    minMonthlyKwh: min.monthlyKwh,
    maxMonthlyKwh: max.monthlyKwh,
    minLabel: min.label,
    maxLabel: max.label,
    rows: mapped,
  };
}

// Qué pasa mes a mes con el sistema elegido: cuánto del consumo cubre en
// cada período y cuánto se ahorra usando la producción real de ese mes.
export function historyCoverage(stats: HistoryStats, monthlyProduction: number, pricePerKwh: number) {
  const used = stats.rows.map((r) => Math.min(monthlyProduction, r.monthlyKwh));
  const totalCons = stats.rows.reduce((a, r) => a + r.monthlyKwh, 0);
  const totalUsed = used.reduce((a, u) => a + u, 0);
  return {
    annualCoveragePct: totalCons > 0 ? (totalUsed / totalCons) * 100 : 0,
    avgMonthlySavingsARS: (totalUsed / stats.rows.length) * pricePerKwh,
    surplusPeriods: stats.rows.filter((r) => monthlyProduction > r.monthlyKwh).length,
  };
}

export function validateInputs(i: QuoteInputs): string[] {
  const errors: string[] = [];
  if (!(i.kwh > 0)) errors.push("Cargá el consumo facturado (kWh).");
  if (!(i.days > 0)) errors.push("Los días del período tienen que ser mayores a 0.");
  if (!(i.pricePerKwh > 0)) errors.push("Falta el precio del kWh.");
  if (!(i.hsp > 0)) errors.push("Falta el valor de HSP de la zona.");
  if (!(i.panelW > 0)) errors.push("Falta la potencia del panel.");
  if (!(i.performanceRatio > 0 && i.performanceRatio <= 1)) errors.push("El performance ratio tiene que estar entre 0 y 1.");
  if (!(i.coveragePct > 0)) errors.push("Falta la cobertura objetivo.");
  if (!(i.costPerWp > 0)) errors.push("Falta el costo instalado (USD/Wp).");
  if (!(i.exchangeRate > 0)) errors.push("Falta el tipo de cambio.");
  return errors;
}

// Fórmulas tal cual el pedido del negocio (mes = 30 días).
export function calculateQuote(i: QuoteInputs): QuoteResults | null {
  if (validateInputs(i).length > 0) return null;

  const dailyKwh = i.kwh / i.days;
  const monthlyKwh = dailyKwh * 30;
  // Sistema aislado: tiene que cubrir todo el consumo y además las pérdidas
  // de ida y vuelta de la batería.
  const offgrid = i.systemType === "offgrid";
  const targetDailyProduction = offgrid
    ? dailyKwh / OFFGRID_EFFICIENCY
    : dailyKwh * (i.coveragePct / 100);
  const idealKwp = targetDailyProduction / (i.hsp * i.performanceRatio);
  const panels = Math.max(1, Math.ceil((idealKwp * 1000) / i.panelW));
  const realW = panels * i.panelW;
  const monthlyProduction = (realW / 1000) * i.hsp * i.performanceRatio * 30;
  const realCoveragePct = (monthlyProduction / monthlyKwh) * 100;
  // En un sistema aislado no hay factura que ahorrar: el retorno no aplica.
  const monthlySavingsARS = offgrid ? 0 : Math.min(monthlyProduction, monthlyKwh) * i.pricePerKwh;
  const costUSD = realW * i.costPerWp;
  const savingsUSD = monthlySavingsARS / i.exchangeRate;
  const paybackMonths = savingsUSD > 0 ? costUSD / savingsUSD : null;

  const warnings: string[] = [];
  if (realCoveragePct > 105) {
    warnings.push(
      `El sistema queda sobredimensionado (${realCoveragePct.toFixed(0)}% del consumo) por el redondeo a paneles enteros. Conviene revisar cómo compensa los excedentes la distribuidora (Ley 27.424) antes de ofrecerlo así.`,
    );
  }
  if (offgrid) {
    warnings.push(
      "Sistema aislado (off-grid): se dimensiona para cubrir todo el consumo más las pérdidas de la batería. No hay ahorro de factura, así que el retorno de la inversión no aplica.",
    );
  }
  if (i.coveragePct > 100 && !offgrid) {
    warnings.push(
      "La cobertura objetivo supera el 100%: no dimensionar así salvo que se sepa cómo compensa los excedentes la distribuidora bajo la Ley 27.424.",
    );
  }
  if (i.performanceRatio < 0.75 || i.performanceRatio > 0.82) {
    warnings.push("El performance ratio está fuera del rango típico (0,75 a 0,82). Revisalo.");
  }
  if (i.hsp < 2.5 || i.hsp > 7) {
    warnings.push("El valor de HSP es inusual para Argentina (lo normal va de 3 a 6). Revisalo.");
  }
  if (i.basis !== "historial" && (i.days < 25 || i.days > 70)) {
    warnings.push("Los días del período son inusuales (lo normal es ~30 o ~60). Revisalo.");
  }
  const missing = (i.history ?? []).filter((h) => h.included && !(h.kwh > 0)).length;
  if (missing > 0) {
    warnings.push(
      `Hay ${missing} período${missing > 1 ? "s" : ""} del historial sin dato de consumo: completalos o destildalos, si no el promedio queda incompleto.`,
    );
  }
  const hist = summarizeHistory(i.history);
  if (hist && hist.periods >= 3 && i.basis === "factura" && i.billKwh && i.billDays) {
    const billMonthly = (i.billKwh / i.billDays) * 30;
    const diff = ((billMonthly - hist.avgMonthlyKwh) / hist.avgMonthlyKwh) * 100;
    if (Math.abs(diff) > 15) {
      warnings.push(
        `Estás dimensionando con la última factura (${billMonthly.toFixed(0)} kWh/mes), pero el promedio del historial es ${hist.avgMonthlyKwh.toFixed(0)} kWh/mes (${diff > 0 ? "+" : ""}${diff.toFixed(0)}%). Conviene dimensionar con el historial.`,
      );
    }
  }

  return {
    dailyKwh,
    monthlyKwh,
    targetDailyProduction,
    idealKwp,
    panels,
    realW,
    realKwp: realW / 1000,
    monthlyProduction,
    realCoveragePct,
    monthlySavingsARS,
    costUSD,
    paybackMonths,
    paybackYears: paybackMonths != null ? paybackMonths / 12 : null,
    warnings,
  };
}

const nf = (n: number, d = 0) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const SYSTEM_LABELS: Record<SystemType, string> = {
  ongrid: "On-grid (conectado a la red)",
  hibrido: "Híbrido (red + baterías)",
  offgrid: "Off-grid (aislado con baterías)",
};

function systemLines(i: QuoteInputs, r: QuoteResults): string[] {
  if (!r.systemType) return [];
  const lines = ["TIPO DE SISTEMA", `- ${SYSTEM_LABELS[r.systemType]}`];
  if (r.systemReason) lines.push(`- Motivo: ${r.systemReason}`);
  if (r.inverterKw) lines.push(`- Inversor necesario: ${nf(r.inverterKw, 1)} kW`);
  if (r.batteryKwh) lines.push(`- Almacenamiento necesario: ${nf(r.batteryKwh, 1)} kWh`);
  lines.push("");
  return lines;
}

function bomLines(r: QuoteResults): string[] {
  const lines = (r.bom ?? []).filter((l) => l.included && l.qty > 0);
  if (r.costSource !== "lista" || lines.length === 0) return [];
  return [
    "",
    "LISTA DE MATERIALES (USD)",
    ...lines.map(
      (l) => `- ${l.name}: ${nf(l.qty, l.qty % 1 === 0 ? 0 : 2)} ${l.unitLabel} × US$ ${nf(l.unitPriceUSD, 2)} = US$ ${nf(l.qty * l.unitPriceUSD)}`,
    ),
  ];
}

function historyLines(i: QuoteInputs, r: QuoteResults): string[] {
  const h = summarizeHistory(i.history);
  if (!h) return [];
  const cov = historyCoverage(h, r.monthlyProduction, i.pricePerKwh);
  return [
    `- Dimensionado con: ${i.basis === "factura" ? "última factura" : "promedio del historial"}`,
    `- Historial: ${h.periods} períodos, promedio ${nf(h.avgMonthlyKwh)} kWh/mes (mínimo ${nf(h.minMonthlyKwh)} en ${h.minLabel}, máximo ${nf(h.maxMonthlyKwh)} en ${h.maxLabel})`,
    `- Cobertura considerando cada período del historial: ${nf(cov.annualCoveragePct)}% (ahorro mensual promedio $ ${nf(cov.avgMonthlySavingsARS)})`,
  ];
}

export function buildQuoteSummary(args: {
  inputs: QuoteInputs;
  results: QuoteResults;
  clientName?: string;
  address?: string;
  date?: Date;
}) {
  const { inputs: i, results: r, clientName, address } = args;
  const date = args.date ?? new Date();
  const lines = [
    "COTIZACIÓN DE SISTEMA SOLAR FOTOVOLTAICO",
    `Fecha: ${date.toLocaleDateString("es-AR")}`,
  ];
  if (clientName) lines.push(`Cliente: ${clientName}`);
  if (address) lines.push(`Dirección: ${address}`);
  lines.push(
    `Zona: ${i.province} (HSP ${nf(i.hsp, 2)})`,
    "",
    "CONSUMO ACTUAL",
    `- ${i.basis === "historial" ? "Consumo analizado (historial)" : "Facturado"}: ${nf(i.kwh)} kWh en ${nf(i.days)} días (${nf(r.dailyKwh, 1)} kWh/día, ${nf(r.monthlyKwh)} kWh/mes)`,
    `- Precio del kWh: $ ${nf(i.pricePerKwh, 2)}`,
    ...historyLines(i, r),
    "",
    ...systemLines(i, r),
    "SISTEMA RECOMENDADO",
    `- Potencia: ${nf(r.realKwp, 2)} kWp`,
    `- Paneles: ${r.panels} de ${nf(i.panelW)} W (${nf(r.realW)} W)`,
    `- Producción mensual estimada: ${nf(r.monthlyProduction)} kWh`,
    `- Cobertura del consumo: ${nf(r.realCoveragePct)}%`,
    "",
    "INVERSIÓN Y RETORNO",
    `- Costo estimado instalado: US$ ${nf(r.costUSD)} (US$ ${nf(i.costPerWp, 2)}/Wp)`,
    `- Ahorro mensual estimado: $ ${nf(r.monthlySavingsARS)}`,
  );
  if (r.paybackYears != null) {
    lines.push(
      `- Retorno de la inversión: ${nf(r.paybackYears, 1)} años (${nf(r.paybackMonths ?? 0)} meses) al dólar de $ ${nf(i.exchangeRate)}`,
    );
  }
  lines.push(...bomLines(r));
  lines.push(
    "",
    `Parámetros: performance ratio ${nf(i.performanceRatio, 2)}, cobertura objetivo ${nf(i.coveragePct)}%.`,
    "Estimación orientativa: el proyecto final requiere relevamiento técnico, revisión de factura, techo, sombras y normativa de la distribuidora.",
  );
  if (r.warnings.length > 0) {
    lines.push("", "AVISOS", ...r.warnings.map((w) => `- ${w}`));
  }
  return lines.join("\n");
}

// ───────── Lectura del texto de una factura (OCR gratuito en el navegador) ─────────

export type ParsedInvoice = {
  kwh: number | null;
  days: number | null;
  total: number | null;
  // Subtotal de "energía eléctrica" (sin impuestos, cuotas ni intereses), si la factura lo trae.
  energyTotal: number | null;
  // La factura incluye cuotas de financiación, intereses o planes de pago dentro del total.
  hasFinancing: boolean;
  province: string | null;
  distribuidora: string | null;
};

// "1.234,56" → 1234.56 · "612" → 612 · "45.870,25" → 45870.25
export function parseArNumber(s: string): number | null {
  const cleaned = s.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const n = cleaned.includes(",")
    ? Number(cleaned.replace(/\./g, "").replace(",", "."))
    : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
      ? Number(cleaned.replace(/\./g, ""))
      : Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Lee el texto crudo que devuelve el OCR. Es un "mejor esfuerzo": siempre
// devuelve null en lo que no encuentra, y el ingeniero revisa todo.
export function parseInvoiceText(raw: string): ParsedInvoice {
  const text = raw.replace(/\r/g, "");
  const flat = text.replace(/\s+/g, " ");

  // kWh del período: preferimos los que están cerca de "consumo" / "energía".
  let kwh: number | null = null;
  const kwhCandidates: { value: number; near: boolean }[] = [];
  for (const m of flat.matchAll(/(\d[\d.,]*)\s*kwh/gi)) {
    const value = parseArNumber(m[1]);
    if (value == null || value < 10 || value > 50000) continue;
    const before = flat.slice(Math.max(0, (m.index ?? 0) - 45), m.index ?? 0);
    kwhCandidates.push({ value, near: /consumo|energ[ií]a|facturad|total/i.test(before) });
  }
  const near = kwhCandidates.filter((c) => c.near);
  if (near.length > 0) kwh = near[0].value;
  else if (kwhCandidates.length > 0) kwh = Math.max(...kwhCandidates.map((c) => c.value));

  // Fila del medidor (lectura anterior y actual, consumo y días): es lo más
  // confiable cuando la factura la trae, y se valida con la resta de lecturas.
  let rowDays: number | null = null;
  const reading = flat.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+([\d.]+)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+([\d.]+)\s+(\d{1,5})\s+(\d{1,3})\b/,
  );
  if (reading) {
    const prev = parseArNumber(reading[2]);
    const curr = parseArNumber(reading[4]);
    const consumo = Number(reading[5]);
    if (prev != null && curr != null && Math.abs(curr - prev - consumo) <= 1 && consumo >= 10) {
      kwh = consumo;
      const d = Number(reading[6]);
      if (d >= 5 && d <= 100) rowDays = d;
    }
  }

  // Días: "60 días" explícito, o la diferencia entre dos fechas seguidas.
  let days: number | null = rowDays;
  const explicit = days == null ? flat.match(/(\d{1,3})\s*d[ií]as/i) : null;
  if (explicit && Number(explicit[1]) >= 20 && Number(explicit[1]) <= 100) days = Number(explicit[1]);
  if (days == null) {
    const dates: Date[] = [];
    for (const m of flat.matchAll(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/g)) {
      const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
      const d = new Date(y, Number(m[2]) - 1, Number(m[1]));
      if (!Number.isNaN(d.getTime())) dates.push(d);
    }
    for (let i = 0; i + 1 < dates.length && days == null; i++) {
      const diff = Math.round((dates[i + 1].getTime() - dates[i].getTime()) / 86400000);
      if (diff >= 25 && diff <= 70) days = diff;
    }
  }

  // Monto total: preferimos "total a pagar".
  let total: number | null = null;
  const totals: { value: number; pay: boolean }[] = [];
  for (const m of flat.matchAll(/(total\s*(?:a\s*pagar|factura|facturado)?|importe\s*total|monto\s*total)[^\d]{0,25}(\d[\d.,]*)/gi)) {
    const value = parseArNumber(m[2]);
    if (value == null || value < 100) continue;
    totals.push({ value, pay: /pagar/i.test(m[1]) });
  }
  const pay = totals.find((t) => t.pay);
  if (pay) total = pay.value;
  else if (totals.length > 0) total = Math.max(...totals.map((t) => t.value));

  let energyTotal: number | null = null;
  const energy = flat.match(/total\s*energ[ií]a\s*el[eé]ctrica[^\d]{0,15}(\d[\d.,]*)/i);
  if (energy) {
    const v = parseArNumber(energy[1]);
    if (v != null && v >= 100) energyTotal = v;
  }

  const hasFinancing = /financiaci[oó]n|inter[eé]s(?:es)?\s+(?:por\s+)?(?:mora|financ|punitorio)|plan\s+de\s+pagos?/i.test(flat);

  const cleanFlat = flat.replace(/\./g, "");
  const dist = DISTRIBUIDORAS.find((d) => d.pattern.test(cleanFlat));
  let distName = dist ? (cleanFlat.match(dist.pattern)?.[0] ?? null) : null;

  // Cooperativas y otras distribuidoras: si no la reconocemos por nombre,
  // buscamos el nombre de la provincia que más aparece en el texto.
  let province = dist?.province ?? null;
  if (!province) {
    const norm = normalize(flat);
    let best = 0;
    for (const prov of PROVINCES) {
      const n = normalize(prov);
      const count = norm.split(new RegExp("\\b" + n.replace(/ /g, "\\s+") + "\\b")).length - 1;
      if (count > best) {
        best = count;
        province = prov;
      }
    }
    if (/capital federal|ciudad autonoma de buenos aires/.test(norm)) province = "CABA";
  }
  if (!distName) {
    const coop = flat.match(/cooperativa de electricidad[^.]{0,50}/i);
    distName = coop ? coop[0].trim() : null;
  }

  return {
    kwh,
    days,
    total,
    energyTotal,
    hasFinancing,
    province,
    distribuidora: distName ? distName.toUpperCase() : null,
  };
}
