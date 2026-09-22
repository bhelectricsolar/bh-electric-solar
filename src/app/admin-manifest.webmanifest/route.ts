import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      id: "/admin",
      name: "BH Electric Solar — Administración",
      short_name: "BH Admin",
      description:
        "Panel de administración de BH Electric Solar: productos, categorías, envíos, pedidos y clientes.",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait-primary",
      // Navy, igual que la pantalla de carga — así el sistema no muestra un
      // flash blanco/crema al abrir la app instalada antes de que cargue el JS.
      background_color: "#0c1a38",
      theme_color: "#0c1a38",
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
