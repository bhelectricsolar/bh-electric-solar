export type RegionKey = "amba" | "centro" | "cuyo" | "noa" | "nea" | "patagonia";
export type ClientType = "residencial" | "comercial" | "industrial";

export const REGION_OPTIONS: { value: RegionKey; label: string }[] = [
  { value: "amba", label: "AMBA / Buenos Aires" },
  { value: "centro", label: "Centro: Córdoba, Santa Fe, Entre Ríos, La Pampa" },
  { value: "cuyo", label: "Cuyo: Mendoza, San Juan, San Luis" },
  { value: "noa", label: "NOA: Salta, Jujuy, Tucumán, Catamarca, La Rioja, Santiago" },
  { value: "nea", label: "NEA / Litoral: Chaco, Corrientes, Formosa, Misiones" },
  { value: "patagonia", label: "Patagonia" },
];

const REGION_DATA: Record<RegionKey, { label: string; production: number; arsKwh: number }> = {
  amba: { label: "AMBA / Buenos Aires", production: 128, arsKwh: 145 },
  centro: { label: "Centro", production: 140, arsKwh: 135 },
  cuyo: { label: "Cuyo", production: 158, arsKwh: 130 },
  noa: { label: "NOA", production: 165, arsKwh: 125 },
  nea: { label: "NEA / Litoral", production: 134, arsKwh: 138 },
  patagonia: { label: "Patagonia", production: 116, arsKwh: 155 },
};

const TYPE_MULTIPLIER: Record<ClientType, number> = {
  residencial: 1,
  comercial: 1.12,
  industrial: 1.22,
};

export const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: "residencial", label: "Hogar" },
  { value: "comercial", label: "Comercio / empresa" },
  { value: "industrial", label: "Industrial" },
];

export const COVERAGE_OPTIONS = [
  { value: 0.5, label: "50% de la factura" },
  { value: 0.7, label: "70% de la factura" },
  { value: 0.9, label: "90% de la factura" },
  { value: 1, label: "100% aproximado" },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const moneyARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const moneyUSD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type SolarInput = {
  region: RegionKey;
  bill: number;
  kwh: number;
  clientType: ClientType;
  coverage: number;
};

export type SolarResult = {
  regionLabel: string;
  systemKwp: number;
  systemKwpLabel: string;
  monthlyProduction: number;
  monthlySavingsLabel: string;
  panelCount: number;
  investmentLabel: string;
  summaryTitle: string;
  summaryText: string;
  whatsappMessage: string;
};

export function calculateSolarSystem(input: SolarInput): SolarResult | null {
  const { region: regionKey, bill, kwh, clientType, coverage } = input;
  if (!bill || bill <= 0) return null;

  const region = REGION_DATA[regionKey];
  const monthlyKwh = kwh > 0 ? kwh : bill / region.arsKwh;
  const targetKwh = monthlyKwh * coverage;
  const systemKwp = clamp(targetKwh / region.production, 1.2, 80);
  const monthlyProduction = systemKwp * region.production;
  const monthlySavings = bill * coverage * 0.88;
  const panelCount = Math.ceil(systemKwp / 0.55);
  const usdPerKwp = 1180 * TYPE_MULTIPLIER[clientType];
  const investmentLow = systemKwp * usdPerKwp * 0.88;
  const investmentHigh = systemKwp * usdPerKwp * 1.18;

  const summaryText = `Con una cobertura objetivo del ${Math.round(
    coverage * 100,
  )}%, el sistema estimado es de ${systemKwp.toFixed(
    1,
  )} kWp para producir cerca de ${Math.round(monthlyProduction)} kWh mensuales en ${region.label}.`;

  const whatsappMessage =
    `Hola BH Electric Solar, quiero un presupuesto personalizado de paneles solares.\n\n` +
    `Región: ${region.label}\n` +
    `Factura mensual: ${moneyARS.format(bill)}\n` +
    `Consumo mensual: ${Math.round(monthlyKwh)} kWh\n` +
    `Cobertura deseada: ${Math.round(coverage * 100)}%\n` +
    `Sistema estimado: ${systemKwp.toFixed(1)} kWp\n` +
    `Paneles estimados: ${panelCount}\n\n` +
    `Quiero coordinar una revisión técnica.`;

  return {
    regionLabel: region.label,
    systemKwp,
    systemKwpLabel: `${systemKwp.toFixed(1)} kWp`,
    monthlyProduction,
    monthlySavingsLabel: moneyARS.format(monthlySavings),
    panelCount,
    investmentLabel: `${moneyUSD.format(investmentLow)} - ${moneyUSD.format(investmentHigh)}`,
    summaryTitle: `Estimación solar para ${region.label}.`,
    summaryText,
    whatsappMessage,
  };
}
