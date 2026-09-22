import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/products";

const BASE = "https://bhelectricsolar.com";

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/tienda", changeFrequency: "daily", priority: 0.9 },
  { path: "/calculadora-solar", changeFrequency: "monthly", priority: 0.8 },
  { path: "/beneficios", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contacto", changeFrequency: "monthly", priority: 0.7 },
  { path: "/politica-de-privacidad", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terminos-y-condiciones", changeFrequency: "yearly", priority: 0.2 },
  { path: "/politica-de-cookies", changeFrequency: "yearly", priority: 0.2 },
  { path: "/aviso-legal", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllSlugs();
    productEntries = slugs.map((slug) => ({
      url: `${BASE}/tienda/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Si la base no responde, el sitemap sale igual solo con las páginas fijas.
  }

  return [...staticEntries, ...productEntries];
}
