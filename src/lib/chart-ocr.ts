"use client";

// Lectura del gráfico de barras de consumo que traen las facturas: los
// valores vienen escritos girados 90° sobre cada barra. Se recorta el
// gráfico, se gira y se lee con varias pasadas de OCR (gratis, en el equipo);
// después se votan los resultados posición por posición. Lo que no se pudo
// leer queda como null, para que el ingeniero lo complete sin desalinear
// los meses.

export type Region = { x: number; y: number; w: number; h: number };
export type ChartReading = { values: (number | null)[]; read: number; total: number };
export type Detection = { v: number; x: number; conf: number };

const MIN_VALUE = 20;
const MAX_VALUE = 20000;

// Junta las detecciones de todas las pasadas: agrupa por posición (una barra
// = un grupo), elige el valor más votado y deja null los huecos entre barras.
export function mergeDetections(dets: Detection[], cropWidth: number): (number | null)[] {
  const valid = dets.filter((d) => d.v >= MIN_VALUE && d.v <= MAX_VALUE).sort((a, b) => a.x - b.x);
  if (valid.length === 0) return [];

  const tol = Math.max(3, cropWidth * 0.012);
  const groups: Detection[][] = [];
  for (const d of valid) {
    const last = groups[groups.length - 1];
    const center = last ? last.reduce((s, g) => s + g.x, 0) / last.length : 0;
    if (last && d.x - center <= tol) last.push(d);
    else groups.push([d]);
  }

  // Precisión antes que cantidad: un valor mal leído es peor que un "?".
  // Solo se acepta si al menos dos pasadas coinciden (o una con confianza muy alta).
  const pick = (g: Detection[]): number | null => {
    const votes = new Map<number, { n: number; conf: number }>();
    for (const d of g) {
      const cur = votes.get(d.v) ?? { n: 0, conf: 0 };
      votes.set(d.v, { n: cur.n + 1, conf: Math.max(cur.conf, d.conf) });
    }
    const [v, info] = [...votes.entries()].sort((a, b) => b[1].n - a[1].n || b[1].conf - a[1].conf)[0];
    return info.n >= 2 || info.conf >= 90 ? v : null;
  };
  const centers = groups.map((g) => g.reduce((s, d) => s + d.x, 0) / g.length);
  const values: (number | null)[] = groups.map(pick);

  // Valores absurdos frente al resto (típico de un dígito perdido): a "?".
  const known = values.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (known.length >= 4) {
    const median = known[Math.floor(known.length / 2)];
    values.forEach((v, i) => {
      if (v != null && (v < median * 0.25 || v > median * 4)) values[i] = null;
    });
  }
  if (groups.length < 2) return values;

  // Paso entre barras: mediana de la mitad más chica de los huecos (así una
  // barra que no se leyó no agranda el paso).
  const gaps = centers.slice(1).map((c, i) => c - centers[i]).sort((x, y) => x - y);
  const lowerHalf = gaps.slice(0, Math.max(1, Math.ceil(gaps.length / 2)));
  const step = lowerHalf[Math.floor(lowerHalf.length / 2)];

  const out: (number | null)[] = [values[0]];
  for (let i = 1; i < groups.length; i++) {
    const slots = Math.max(1, Math.round((centers[i] - centers[i - 1]) / step));
    for (let k = 1; k < slots; k++) out.push(null);
    out.push(values[i]);
  }
  return out;
}

function transform(src: HTMLCanvasElement, region: Region, rot: 0 | 90 | 270, scale: number) {
  const w = Math.round(region.w * scale);
  const h = Math.round(region.h * scale);
  const c = document.createElement("canvas");
  if (rot === 0) {
    c.width = w;
    c.height = h;
    const ctx0 = c.getContext("2d")!;
    ctx0.imageSmoothingQuality = "high";
    ctx0.drawImage(src, region.x, region.y, region.w, region.h, 0, 0, w, h);
    return c;
  }
  c.width = h;
  c.height = w;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  if (rot === 90) {
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
  } else {
    ctx.translate(0, w);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(src, region.x, region.y, region.w, region.h, 0, 0, w, h);
  return c;
}

type Pass = { lang: "spa" | "eng"; scale: number; psm: string };
const PASSES: Pass[] = [
  { lang: "spa", scale: 4, psm: "6" },
  { lang: "spa", scale: 3, psm: "6" },
  { lang: "eng", scale: 3, psm: "6" },
  { lang: "eng", scale: 5, psm: "11" },
];

export async function readBarChart(
  source: HTMLCanvasElement,
  region: Region,
  onProgress?: (fraction: number) => void,
): Promise<ChartReading> {
  const { createWorker } = await import("tesseract.js");
  const workers = new Map<string, Awaited<ReturnType<typeof createWorker>>>();
  const dets: Detection[] = [];

  async function run(pass: Pass, rot: 0 | 90 | 270): Promise<Detection[]> {
    let worker = workers.get(pass.lang);
    if (!worker) {
      worker = await createWorker(pass.lang);
      workers.set(pass.lang, worker);
    }
    await worker.setParameters({
      tessedit_pageseg_mode: pass.psm as never,
      tessedit_char_whitelist: "0123456789",
    });
    const canvas = transform(source, region, rot, pass.scale);
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const found: Detection[] = [];
    for (const block of data.blocks ?? [])
      for (const para of block.paragraphs)
        for (const line of para.lines)
          for (const word of line.words) {
            const text = word.text.trim();
            if (!/^\d{2,5}$/.test(text) || word.confidence < 20) continue;
            const yc = (word.bbox.y0 + word.bbox.y1) / 2;
            const xc = (word.bbox.x0 + word.bbox.x1) / 2;
            const x = rot === 0 ? xc / pass.scale : rot === 90 ? yc / pass.scale : region.w - yc / pass.scale;
            found.push({ v: Number(text), x, conf: word.confidence });
          }
    return found;
  }

  try {
    const total = PASSES.length + 2;
    let done = 0;
    const tick = () => onProgress?.(Math.min(1, ++done / total));

    // La primera pasada decide hacia qué lado están girados los números.
    const a = await run(PASSES[0], 90);
    tick();
    const b = await run(PASSES[0], 270);
    tick();
    const c0 = await run(PASSES[0], 0);
    tick();
    const best = Math.max(a.length, b.length, c0.length);
    const rot: 0 | 90 | 270 = best === c0.length ? 0 : best === b.length ? 270 : 90;
    dets.push(...(rot === 0 ? c0 : rot === 90 ? a : b));

    for (const pass of PASSES.slice(1)) {
      // Con números horizontales se cambia el modo de lectura a "líneas sueltas".
      dets.push(...(await run(rot === 0 ? { ...pass, psm: pass.psm === "6" ? "11" : pass.psm } : pass, rot)));
      tick();
    }
  } finally {
    await Promise.all([...workers.values()].map((w) => w.terminate()));
  }

  const values = mergeDetections(dets, region.w);
  return { values, read: values.filter((v) => v != null).length, total: values.length };
}
