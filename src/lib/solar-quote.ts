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

export type QuoteInputs = {
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
};

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
  const targetDailyProduction = dailyKwh * (i.coveragePct / 100);
  const idealKwp = targetDailyProduction / (i.hsp * i.performanceRatio);
  const panels = Math.max(1, Math.ceil((idealKwp * 1000) / i.panelW));
  const realW = panels * i.panelW;
  const monthlyProduction = (realW / 1000) * i.hsp * i.performanceRatio * 30;
  const realCoveragePct = (monthlyProduction / monthlyKwh) * 100;
  const monthlySavingsARS = Math.min(monthlyProduction, monthlyKwh) * i.pricePerKwh;
  const costUSD = realW * i.costPerWp;
  const savingsUSD = monthlySavingsARS / i.exchangeRate;
  const paybackMonths = savingsUSD > 0 ? costUSD / savingsUSD : null;

  const warnings: string[] = [];
  if (realCoveragePct > 105) {
    warnings.push(
      `El sistema queda sobredimensionado (${realCoveragePct.toFixed(0)}% del consumo) por el redondeo a paneles enteros. Conviene revisar cómo compensa los excedentes la distribuidora (Ley 27.424) antes de ofrecerlo así.`,
    );
  }
  if (i.coveragePct > 100) {
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
  if (i.days < 25 || i.days > 70) {
    warnings.push("Los días del período son inusuales (lo normal es ~30 o ~60). Revisalo.");
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
    `- Facturado: ${nf(i.kwh)} kWh en ${nf(i.days)} días (${nf(r.dailyKwh, 1)} kWh/día, ${nf(r.monthlyKwh)} kWh/mes)`,
    `- Precio del kWh: $ ${nf(i.pricePerKwh, 2)}`,
    "",
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
  province: string | null;
  distribuidora: string | null;
};

// "1.234,56" → 1234.56 · "612" → 612 · "45.870,25" → 45870.25
function parseArNumber(s: string): number | null {
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

  // Días: "60 días" explícito, o la diferencia entre dos fechas seguidas.
  let days: number | null = null;
  const explicit = flat.match(/(\d{1,3})\s*d[ií]as/i);
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

  const cleanFlat = flat.replace(/\./g, "");
  const dist = DISTRIBUIDORAS.find((d) => d.pattern.test(cleanFlat));
  const distName = dist ? (cleanFlat.match(dist.pattern)?.[0] ?? null) : null;

  return {
    kwh,
    days,
    total,
    province: dist?.province ?? null,
    distribuidora: distName ? distName.toUpperCase() : null,
  };
}
