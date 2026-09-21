"use client";

// Lectura del gráfico de barras de consumo que traen las facturas: los
// valores vienen escritos girados 90° sobre cada barra. Se recorta el
// gráfico, se gira y se lee con varias pasadas de OCR (gratis, en el equipo);
// después se votan los resultados posición por posición. Lo que no se pudo
// leer queda como null, para que el ingeniero lo complete sin desalinear
// los meses.

import { darkMask, detectBars, resolveValues } from "./chart-bars";

export type Region = { x: number; y: number; w: number; h: number };
export type ChartReading = { values: (number | null)[]; read: number; total: number; estimated?: number };
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

  // Valor más votado de cada barra (desempata por confianza).
  const pick = (g: Detection[]): number | null => {
    const votes = new Map<number, { n: number; conf: number }>();
    for (const d of g) {
      const cur = votes.get(d.v) ?? { n: 0, conf: 0 };
      votes.set(d.v, { n: cur.n + 1, conf: Math.max(cur.conf, d.conf) });
    }
    const [v] = [...votes.entries()].sort((a, b) => b[1].n - a[1].n || b[1].conf - a[1].conf)[0];
    return v;
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

// Recorta un rectángulo, lo gira, lo agranda y le agrega margen blanco (el OCR
// lo necesita). Con "stretch" estira el contraste para fotos apagadas.
function labelImage(
  src: HTMLCanvasElement,
  rect: { x: number; y: number; w: number; h: number },
  rot: 0 | 90 | 270,
  scale: number,
  stretch: boolean,
): HTMLCanvasElement {
  const w = Math.max(1, Math.round(rect.w * scale));
  const h = Math.max(1, Math.round(rect.h * scale));
  const pad = 24;
  const cw = rot === 0 ? w : h;
  const ch = rot === 0 ? h : w;
  const c = document.createElement("canvas");
  c.width = cw + pad * 2;
  c.height = ch + pad * 2;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  if (rot === 90) {
    ctx.translate(pad + h, pad);
    ctx.rotate(Math.PI / 2);
  } else if (rot === 270) {
    ctx.translate(pad, pad + w);
    ctx.rotate(-Math.PI / 2);
  } else ctx.translate(pad, pad);
  ctx.drawImage(src, rect.x, rect.y, rect.w, rect.h, 0, 0, w, h);
  ctx.restore();
  if (stretch) {
    const img = ctx.getImageData(pad, pad, cw, ch);
    const d = img.data;
    let lo = 255;
    let hi = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 3 + d[i + 1] * 6 + d[i + 2]) / 10;
      d[i] = g;
      if (g < lo) lo = g;
      if (g > hi) hi = g;
    }
    const range = Math.max(30, hi - lo);
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.max(0, Math.min(255, ((d[i] - lo) / range) * 255));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, pad, pad);
  }
  return c;
}

// Lectura por barras: se detectan las barras por su forma, se lee el número
// que está sobre cada una y se valida contra la altura de la barra. Cada mes
// queda alineado con su barra y lo que el OCR no acierta se estima por altura.
async function readByBars(
  source: HTMLCanvasElement,
  region: Region,
  onProgress?: (fraction: number) => void,
): Promise<ChartReading | null> {
  // Recorte chico para detectar barras (rápido y estable ante el tamaño de la foto)
  const f = region.w > 480 ? 480 / region.w : 1;
  const det = document.createElement("canvas");
  det.width = Math.max(1, Math.round(region.w * f));
  det.height = Math.max(1, Math.round(region.h * f));
  const dctx = det.getContext("2d", { willReadFrequently: true })!;
  dctx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, det.width, det.height);
  const px = dctx.getImageData(0, 0, det.width, det.height).data;
  const gray = new Uint8Array(det.width * det.height);
  for (let i = 0; i < gray.length; i++) gray[i] = (px[i * 4] * 3 + px[i * 4 + 1] * 6 + px[i * 4 + 2]) / 10;
  const mask = darkMask(gray, det.width, det.height);
  const bars = detectBars(mask, det.width, det.height);
  if (bars.length < 4 || bars.length > 40) return null;

  // Imagen en blanco y negro (fondo parejo) para usar como segunda variante
  const mcv = document.createElement("canvas");
  mcv.width = det.width;
  mcv.height = det.height;
  const mctx = mcv.getContext("2d")!;
  const mimg = mctx.createImageData(det.width, det.height);
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i] ? 0 : 255;
    mimg.data[i * 4] = mimg.data[i * 4 + 1] = mimg.data[i * 4 + 2] = v;
    mimg.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(mimg, 0, 0);

  type B = (typeof bars)[number];
  const pitch = (bars[bars.length - 1].cx - bars[0].cx) / (bars.length - 1);
  const labelH = (b: B) => Math.min(b.top, det.height * 0.26);
  const rectFor = (b: B) => {
    const x = Math.max(0, b.cx - pitch / 2);
    return { x, y: b.top - labelH(b), w: Math.min(det.width - x, pitch), h: labelH(b) };
  };

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const readOne = async (b: B, rot: 0 | 90 | 270, useMask: boolean, target: number, psm: string) => {
      const r = rectFor(b);
      if (r.h < 5 || r.w < 4) return null;
      // el lado corto del recorte (alto de los números) llevado a ~target px
      const short = rot === 0 ? r.h : r.w;
      const scale = target / Math.max(4, short);
      let cnv: HTMLCanvasElement;
      if (useMask) cnv = labelImage(mcv, r, rot, scale, false);
      else {
        const s = { x: region.x + r.x / f, y: region.y + r.y / f, w: r.w / f, h: r.h / f };
        cnv = labelImage(source, s, rot, scale * f, true);
      }
      await worker.setParameters({ tessedit_pageseg_mode: psm as never, tessedit_char_whitelist: "0123456789" });
      const { data } = await worker.recognize(cnv);
      const t = data.text.replace(/\D/g, "");
      return t.length >= 2 && t.length <= 5 ? Number(t) : null;
    };

    // ¿Hacia dónde están girados los números? Se prueba con las primeras barras.
    const score: Record<number, number> = { 0: 0, 90: 0, 270: 0 };
    const rots = [90, 270, 0] as const;
    for (const rot of rots)
      for (const b of bars.slice(0, 5)) if ((await readOne(b, rot, false, 60, "7")) != null) score[rot]++;
    const rot = rots.reduce<0 | 90 | 270>((best, r) => (score[r] > score[best] ? r : best), 90);

    const variants = [
      [false, 60, "7"],
      [false, 90, "7"],
      [false, 90, "8"],
      [true, 60, "7"],
      [true, 90, "8"],
    ] as const;
    const candidates: number[][] = [];
    for (let i = 0; i < bars.length; i++) {
      const c: number[] = [];
      for (const [useMask, target, psm] of variants) {
        const v = await readOne(bars[i], rot, useMask, target, psm);
        if (v != null) c.push(v);
      }
      candidates.push(c);
      onProgress?.((i + 1) / bars.length);
    }
    if (candidates.filter((c) => c.length > 0).length < 3) return null;
    const r = resolveValues(bars, candidates);
    return {
      values: r.values,
      read: r.values.length,
      total: r.values.length,
      estimated: r.estimated.filter(Boolean).length,
    };
  } finally {
    await worker.terminate();
  }
}

export async function readBarChart(
  source: HTMLCanvasElement,
  region: Region,
  onProgress?: (fraction: number) => void,
): Promise<ChartReading> {
  try {
    const byBars = await readByBars(source, region, onProgress);
    if (byBars) return byBars;
  } catch (e) {
    console.error("Lectura por barras:", e);
  }
  return readWholeImage(source, region, onProgress);
}

async function readWholeImage(
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
