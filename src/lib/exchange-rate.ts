// Dólar blue (precio de venta) — misma fuente que usa el admin para
// convertir precios. Cacheado 1 hora para no golpear la API en cada visita.
const EXCHANGE_RATE_API = "https://dolarapi.com/v1/dolares/blue";
const FALLBACK_RATE = 1450;

export async function getExchangeRate(): Promise<number> {
  try {
    const res = await fetch(EXCHANGE_RATE_API, { next: { revalidate: 3600 } });
    if (!res.ok) return FALLBACK_RATE;
    const data = await res.json();
    return typeof data.venta === "number" && data.venta > 0 ? data.venta : FALLBACK_RATE;
  } catch {
    return FALLBACK_RATE;
  }
}
