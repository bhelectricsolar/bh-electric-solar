import type {
  BomLine,
  BomOverride,
  ComponentKind,
  QuoteInputs,
  QuoteResults,
  SolarComponent,
  SystemSetup,
  SystemType,
} from "./solar-quote";

export const KIND_LABELS: Record<ComponentKind, string> = {
  panel: "Panel solar",
  inversor_ongrid: "Inversor on-grid",
  inversor_hibrido: "Inversor híbrido",
  inversor_offgrid: "Inversor off-grid",
  bateria: "Batería",
  estructura: "Estructura de montaje",
  proteccion: "Protecciones y cableado",
  instalacion: "Instalación / mano de obra",
  otro: "Otro rubro",
};

// Unidad de la "spec" de cada tipo de equipo.
export const KIND_SPEC_UNIT: Partial<Record<ComponentKind, string>> = {
  panel: "W",
  inversor_ongrid: "kW",
  inversor_hibrido: "kW",
  inversor_offgrid: "kW",
  bateria: "kWh",
};

export const EQUIPMENT_KINDS: ComponentKind[] = [
  "panel",
  "inversor_ongrid",
  "inversor_hibrido",
  "inversor_offgrid",
  "bateria",
];
export const FIXED_KINDS: ComponentKind[] = ["estructura", "proteccion", "instalacion", "otro"];
export const ALL_KINDS: ComponentKind[] = [...EQUIPMENT_KINDS, ...FIXED_KINDS];

export const SYSTEM_LABELS: Record<SystemType, string> = {
  ongrid: "On-grid",
  hibrido: "Híbrido",
  offgrid: "Off-grid",
};

export const DEFAULT_SETUP: SystemSetup = {
  mode: "auto",
  gridAvailable: true,
  backupNeeded: false,
  backupPct: 30,
  backupHours: 8,
  autonomyDays: 1,
  dodPct: 90,
  peakKw: 0,
};

// Relación entre potencia de paneles (DC) y del inversor (AC): se acepta que
// los paneles superen al inversor hasta un 20%.
const DC_AC_RATIO = 1.2;

export function recommendSystemType(setup: SystemSetup): { type: SystemType; reason: string } {
  if (!setup.gridAvailable) {
    return {
      type: "offgrid",
      reason: "no hay red eléctrica disponible: hace falta un sistema aislado con baterías.",
    };
  }
  if (setup.backupNeeded) {
    return {
      type: "hibrido",
      reason: "tiene red pero necesita respaldo ante cortes: un híbrido suma baterías para mantener cargas críticas.",
    };
  }
  return {
    type: "ongrid",
    reason: "tiene red y no necesita respaldo: on-grid es lo más económico e inyecta excedentes (Ley 27.424).",
  };
}

const INVERTER_KIND: Record<SystemType, ComponentKind> = {
  ongrid: "inversor_ongrid",
  hibrido: "inversor_hibrido",
  offgrid: "inversor_offgrid",
};

// Energía útil de batería que hace falta según el tipo de sistema.
export function requiredBatteryKwh(type: SystemType, dailyKwh: number, setup: SystemSetup): number {
  const dod = Math.max(0.3, Math.min(1, setup.dodPct / 100));
  if (type === "ongrid") return 0;
  if (type === "hibrido") {
    return (dailyKwh * (setup.backupPct / 100) * (setup.backupHours / 24)) / dod;
  }
  return (dailyKwh * setup.autonomyDays) / dod;
}

const unitLabel = (c: SolarComponent) =>
  c.unit === "por_panel" ? "por panel" : c.unit === "por_kwp" ? "por kWp" : "u.";

export type BomResult = {
  lines: BomLine[];
  totalUSD: number;
  inverterKw: number;
  batteryKwh: number;
  missing: string[]; // rubros necesarios que no están cargados en la lista de precios
};

export function buildBom(args: {
  type: SystemType;
  components: SolarComponent[];
  panelId?: string;
  panels: number;
  realKwp: number;
  dailyKwh: number;
  setup: SystemSetup;
  batteryId?: string;
  overrides: Record<string, BomOverride>;
  manualLines: BomLine[];
}): BomResult {
  const { type, components, panels, realKwp, dailyKwh, setup, overrides } = args;
  const lines: BomLine[] = [];
  const missing: string[] = [];
  const byKind = (k: ComponentKind) => components.filter((c) => c.kind === k);

  // Paneles
  const panelList = byKind("panel");
  const panel = panelList.find((c) => c.id === args.panelId) ?? panelList[0];
  if (panel) {
    lines.push({ id: "panel", kind: "panel", name: panel.name, qty: panels, unitPriceUSD: panel.priceUSD, unitLabel: "u.", included: true });
  } else {
    missing.push(KIND_LABELS.panel);
    lines.push({ id: "panel", kind: "panel", name: "Falta cargar el panel en Configuración", qty: panels, unitPriceUSD: 0, unitLabel: "u.", included: true, missing: true });
  }

  // Inversor: el más chico que alcance; si ninguno alcanza, varias unidades del más grande.
  const invKind = INVERTER_KIND[type];
  const requiredKw = Math.max(realKwp / DC_AC_RATIO, type === "ongrid" ? 0 : setup.peakKw);
  const invList = byKind(invKind).sort((a, b) => a.spec - b.spec);
  let inverterKw = 0;
  if (invList.length > 0) {
    const fit = invList.find((c) => c.spec >= requiredKw);
    const inv = fit ?? invList[invList.length - 1];
    const qty = fit ? 1 : Math.ceil(requiredKw / inv.spec);
    inverterKw = inv.spec * qty;
    lines.push({
      id: "inverter",
      kind: invKind,
      name: inv.name,
      qty,
      unitPriceUSD: inv.priceUSD,
      unitLabel: "u.",
      included: true,
      note: qty > 1 ? `${qty} unidades para llegar a ${requiredKw.toFixed(1)} kW` : `para ${requiredKw.toFixed(1)} kW`,
    });
  } else {
    missing.push(KIND_LABELS[invKind]);
    lines.push({
      id: "inverter",
      kind: invKind,
      name: `Falta cargar un ${KIND_LABELS[invKind].toLowerCase()} en Configuración`,
      qty: 1,
      unitPriceUSD: 0,
      unitLabel: "u.",
      included: true,
      missing: true,
    });
  }

  // Baterías (híbrido y off-grid)
  const batteryKwh = requiredBatteryKwh(type, dailyKwh, setup);
  let installedKwh = 0;
  if (batteryKwh > 0) {
    const batList = byKind("bateria");
    const bat = batList.find((c) => c.id === args.batteryId) ?? batList[0];
    if (bat && bat.spec > 0) {
      const qty = Math.max(1, Math.ceil(batteryKwh / bat.spec));
      installedKwh = qty * bat.spec;
      lines.push({
        id: "battery",
        kind: "bateria",
        name: bat.name,
        qty,
        unitPriceUSD: bat.priceUSD,
        unitLabel: "u.",
        included: true,
        note: `necesita ${batteryKwh.toFixed(1)} kWh útiles`,
      });
    } else {
      missing.push(KIND_LABELS.bateria);
      lines.push({ id: "battery", kind: "bateria", name: "Falta cargar la batería en Configuración", qty: 1, unitPriceUSD: 0, unitLabel: "u.", included: true, missing: true });
    }
  }

  // Estructura, protecciones, instalación y otros: todo lo cargado se suma
  // (se puede destildar lo que no aplique a esta cotización).
  for (const c of components.filter((x) => FIXED_KINDS.includes(x.kind))) {
    const qty = c.unit === "por_panel" ? panels : c.unit === "por_kwp" ? Math.round(realKwp * 100) / 100 : 1;
    lines.push({ id: c.id, kind: c.kind, name: c.name, qty, unitPriceUSD: c.priceUSD, unitLabel: unitLabel(c), included: true });
  }

  const applied = lines.map((l) => {
    const o = overrides[l.id];
    return o ? { ...l, qty: o.qty ?? l.qty, unitPriceUSD: o.price ?? l.unitPriceUSD, included: o.included ?? l.included } : l;
  });
  const all = [...applied, ...args.manualLines];
  const totalUSD = all.filter((l) => l.included).reduce((s, l) => s + l.qty * l.unitPriceUSD, 0);
  return { lines: all, totalUSD, inverterKw, batteryKwh: installedKwh || batteryKwh, missing };
}

// Aplica el costo real (lista de precios o USD/Wp) y recalcula el retorno.
export function withCost(
  base: QuoteResults,
  inputs: QuoteInputs,
  extra: {
    costUSD: number;
    source: "lista" | "wp";
    type: SystemType;
    reason: string;
    bom?: BomLine[];
    inverterKw?: number;
    batteryKwh?: number;
    extraWarnings?: string[];
  },
): QuoteResults {
  const savingsUSD = base.monthlySavingsARS / inputs.exchangeRate;
  const paybackMonths = savingsUSD > 0 && extra.costUSD > 0 ? extra.costUSD / savingsUSD : null;
  return {
    ...base,
    costUSD: extra.costUSD,
    paybackMonths,
    paybackYears: paybackMonths != null ? paybackMonths / 12 : null,
    warnings: [...base.warnings, ...(extra.extraWarnings ?? [])],
    systemType: extra.type,
    systemReason: extra.reason,
    bom: extra.bom,
    inverterKw: extra.inverterKw,
    batteryKwh: extra.batteryKwh,
    costSource: extra.source,
  };
}

// Lista de ejemplo para arrancar: los precios son solo de referencia y hay
// que reemplazarlos por los reales del negocio.
export function exampleComponents(): SolarComponent[] {
  const c = (
    id: string,
    kind: ComponentKind,
    name: string,
    spec: number,
    priceUSD: number,
    unit: SolarComponent["unit"] = "unidad",
  ): SolarComponent => ({ id, kind, name, spec, priceUSD, unit });
  return [
    c("ex-p450", "panel", "Panel monocristalino 450 W", 450, 120),
    c("ex-p550", "panel", "Panel monocristalino 550 W", 550, 145),
    c("ex-io3", "inversor_ongrid", "Inversor on-grid 3 kW", 3, 480),
    c("ex-io5", "inversor_ongrid", "Inversor on-grid 5 kW", 5, 640),
    c("ex-io10", "inversor_ongrid", "Inversor on-grid 10 kW", 10, 1100),
    c("ex-ih5", "inversor_hibrido", "Inversor híbrido 5 kW", 5, 950),
    c("ex-ih8", "inversor_hibrido", "Inversor híbrido 8 kW", 8, 1400),
    c("ex-ih10", "inversor_hibrido", "Inversor híbrido 10 kW", 10, 1800),
    c("ex-ix5", "inversor_offgrid", "Inversor off-grid 5 kW", 5, 900),
    c("ex-bat5", "bateria", "Batería de litio 5 kWh", 5, 1450),
    c("ex-est", "estructura", "Estructura de montaje", 0, 28, "por_panel"),
    c("ex-prot", "proteccion", "Protecciones, tablero y cableado", 0, 70, "por_kwp"),
    c("ex-inst", "instalacion", "Instalación y mano de obra", 0, 150, "por_kwp"),
  ];
}
