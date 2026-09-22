import type { MetadataRoute } from "next";

const BASE = "https://bhelectricsolar.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El admin está atrás de un login (no hay nada que indexar) y el
        // pago del carrito es un paso transaccional, no una página de
        // contenido — así Google no gasta rastreo ahí.
        disallow: ["/admin", "/admin-login", "/tienda/checkout"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
