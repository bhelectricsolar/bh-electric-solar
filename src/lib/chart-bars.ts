// Detección de las barras del gráfico de consumo por geometría (sin OCR):
// dónde está cada barra y qué tan alta es. Con eso se lee un número por barra
// (alineado sí o sí con su mes) y se valida contra la altura: la altura de la
// barra es proporcional al consumo, así que un número mal leído se nota.

export type Bar = { x0: number; x1: number; cx: number; top: number; bottom: number; height: number };

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// Mapa de "oscuro" relativo al papel de cada zona: en fotos hay sombras y
// degradés, así que se compara cada píxel con el brillo del papel cercano
// (percentil alto de su bloque) en vez de usar un umbral único.
export function darkMask(gray: Uint8Array, w: number, h: number): Uint8Array {
  const B = 40;
  const bw = Math.ceil(w / B);
  const bh = Math.ceil(h / B);
  const bg = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++)
    for (let bx = 0; bx < bw; bx++) {
      const vals: number[] = [];
      // ventana ampliada (3x3 bloques) para que una barra ancha no sea "el fondo"
      for (let y = Math.max(0, (by - 1) * B); y < Math.min(h, (by + 2) * B); y += 2)
        for (let x = Math.max(0, (bx - 1) * B); x < Math.min(w, (bx + 2) * B); x += 2) vals.push(gray[y * w + x]);
      vals.sort((p, q) => p - q);
      bg[by * bw + bx] = vals[Math.floor(vals.length * 0.9)] || 255;
    }
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const local = bg[Math.floor(y / B) * bw + Math.floor(x / B)];
      mask[y * w + x] = gray[y * w + x] < local * 0.62 ? 1 : 0;
    }
  return mask;
}

export function detectBars(mask: Uint8Array, w: number, h: number): Bar[] {
  // Por columna: el tramo vertical oscuro más largo (las barras son sólidas;
  // el texto y las líneas finas dan tramos cortos).
  const runLen = new Array<number>(w).fill(0);
  const runTop = new Array<number>(w).fill(0);
  const runBot = new Array<number>(w).fill(0);
  for (let x = 0; x < w; x++) {
    let start = -1;
    let gap = 0;
    for (let y = 0; y <= h; y++) {
      const dark = y < h && mask[y * w + x] === 1;
      if (dark) {
        if (start < 0) start = y;
        gap = 0;
      } else if (start >= 0) {
        gap++;
        if (gap > 2 || y === h) {
          const end = y - gap; // último píxel oscuro
          const len = end - start + 1;
          if (len > runLen[x]) {
            runLen[x] = len;
            runTop[x] = start;
            runBot[x] = end;
          }
          start = -1;
          gap = 0;
        }
      }
    }
  }

  const minRun = Math.max(6, h * 0.07);
  const clusters: { x0: number; x1: number }[] = [];
  let cur: { x0: number; x1: number } | null = null;
  let miss = 0;
  for (let x = 0; x < w; x++) {
    if (runLen[x] >= minRun) {
      if (!cur) cur = { x0: x, x1: x };
      cur.x1 = x;
      miss = 0;
    } else if (cur) {
      miss++;
      if (miss > 0) {
        clusters.push(cur);
        cur = null;
        miss = 0;
      }
    }
  }
  if (cur) clusters.push(cur);

  // Descarta líneas finas (ejes) y manchas: se queda con lo de ancho parecido.
  // (también los bordes del recorte: marco negro de la foto)
  const inner = clusters.filter((c) => c.x0 > 1 && c.x1 < w - 2);
  clusters.length = 0;
  clusters.push(...inner);
  const widths = clusters.map((c) => c.x1 - c.x0 + 1);
  const mw = median(widths);
  const wide = clusters.filter((c) => c.x1 - c.x0 + 1 >= Math.max(4, mw * 0.5));

  // Barras pegadas por la inclinación de la foto: un grupo el doble de ancho
  // que lo normal son dos barras; se parte en partes iguales.
  const singleW = median(wide.map((c) => c.x1 - c.x0 + 1).filter((cw) => cw <= mw * 1.4)) || mw;
  const parts: { x0: number; x1: number }[] = [];
  // paso entre barras (de centro a centro) según los grupos vecinos
  const spacing = median(wide.slice(1).map((c, i) => (c.x0 + c.x1) / 2 - (wide[i].x0 + wide[i].x1) / 2)) || singleW * 1.5;
  for (const c of wide) {
    const cw = c.x1 - c.x0 + 1;
    const n = Math.max(1, Math.round((cw + (spacing - singleW)) / spacing));
    for (let i = 0; i < n; i++)
      parts.push({ x0: Math.round(c.x0 + (cw * i) / n), x1: Math.round(c.x0 + (cw * (i + 1)) / n) - 1 });
  }

  let bars: Bar[] = parts.map((c) => {
    const cols: number[] = [];
    for (let x = c.x0; x <= c.x1; x++) if (runLen[x] >= minRun) cols.push(x);
    const top = median(cols.map((x) => runTop[x]));
    const bottom = median(cols.map((x) => runBot[x]));
    return { x0: c.x0, x1: c.x1, cx: (c.x0 + c.x1) / 2, top, bottom, height: Math.max(1, bottom - top) };
  });

  // Solo barras que apoyan en la misma base (descarta letras grandes o
  // cuadros de leyenda): la base es la mediana y se tolera una pequeña
  // inclinación de la foto.
  // Un grupo aislado en un extremo (marco, eje grueso) no es una barra.
  const pitchOf = () => median(bars.slice(1).map((b, i) => b.cx - bars[i].cx));
  for (let guard = 0; guard < 3 && bars.length >= 4; guard++) {
    const pt = pitchOf();
    if (bars[1].cx - bars[0].cx > pt * 1.8) bars = bars.slice(1);
    else if (bars[bars.length - 1].cx - bars[bars.length - 2].cx > pt * 1.8) bars = bars.slice(0, -1);
    else break;
  }
  if (bars.length >= 3) {
    const base = median(bars.map((b) => b.bottom));
    const maxH = Math.max(...bars.map((b) => b.height));
    return bars.filter((b) => Math.abs(b.bottom - base) <= maxH * 0.2);
  }
  return bars;
}

// Elige el valor de cada barra entre lo que leyó el OCR (varios candidatos por
// barra) usando la altura como referencia. Si ninguno cuadra con la altura,
// se estima por proporción y se marca como estimado.
export function resolveValues(
  bars: Bar[],
  candidates: number[][],
): { values: number[]; estimated: boolean[] } {
  const ratios: number[] = [];
  candidates.forEach((cands, i) => {
    // el candidato más repetido de la barra
    const count = new Map<number, number>();
    for (const v of cands) count.set(v, (count.get(v) ?? 0) + 1);
    const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) ratios.push(top[0] / bars[i].height);
  });
  // k = consumo por píxel de altura; se afina descartando los que se alejan.
  let k = median(ratios);
  for (let it = 0; it < 3 && ratios.length; it++) {
    const close = ratios.filter((r) => Math.abs(r - k) / k < 0.2);
    if (close.length >= 2) k = median(close);
  }

  const values: number[] = [];
  const estimated: boolean[] = [];
  bars.forEach((b, i) => {
    const expected = k * b.height;
    let best: number | null = null;
    let bestScore = Infinity;
    const count = new Map<number, number>();
    for (const v of candidates[i] ?? []) count.set(v, (count.get(v) ?? 0) + 1);
    for (const [v, n] of count) {
      const err = expected > 0 ? Math.abs(v - expected) / expected : 1;
      if (err > 0.15) continue;
      const score = err - n * 0.02;
      if (score < bestScore) {
        bestScore = score;
        best = v;
      }
    }
    if (best != null) {
      values.push(best);
      estimated.push(false);
    } else {
      values.push(Math.max(0, Math.round(expected)));
      estimated.push(true);
    }
  });
  return { values, estimated };
}
