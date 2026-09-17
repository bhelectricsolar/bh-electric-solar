export const ICONS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9",
  box: "M4 5h16v14H4V5Zm0 4.7h16M4 14.3h16M9.3 5v14M14.7 5v14",
  tag: "M4 4h8l8 8-8 8-8-8V4Zm4 4h.01",
  truck: "M2 7h11v9H2V7Zm11 3h4l3 3v3h-7v-6ZM6 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 3.1a4 4 0 0 1 0 7.8M23 21v-2a4 4 0 0 0-3-3.9M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3c0 .5 0 1-.1 1.5l2 1.6-2 3.5-2.4-.8c-.8.6-1.6 1.1-2.6 1.4L14.4 21H9.6l-.5-2.8c-1-.3-1.8-.8-2.6-1.4l-2.4.8-2-3.5 2-1.6C4 13 4 12.5 4 12s0-1 .1-1.5l-2-1.6 2-3.5 2.4.8c.8-.6 1.6-1.1 2.6-1.4L9.6 2h4.8l.5 2.8c1 .3 1.8.8 2.6 1.4l2.4-.8 2 3.5-2 1.6c.1.5.1 1 .1 1.5Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  projects:
    "M9 3h6a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1V4a1 1 0 0 1 1-1Zm0 3v0h6v0M8 12.5l2.2 2.2L16 9.5",
  badge:
    "M12 2 5 5.5v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10v-5L12 2Zm-2.5 9L11 12.5 14.8 8.5",
  chart: "M4 20V10M11 20V4M18 20v-7",
  cash:
    "M2 6h20v12H2V6Zm10 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 9v0M19 15v0",
  store:
    "M3 9 4 4h16l1 5M4 9v11h16V9M9 20v-6h6v6M3 9h18",
  briefcase:
    "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 7h18v13H3V7Zm0 5h18",
  stock:
    "M3 7 12 3l9 4-9 4-9-4Zm0 5 9 4 9-4M3 12v5l9 4 9-4v-5",
};

export type SectorId = "tienda" | "negocio" | "sitio";

export type SectorNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

export type Sector = {
  id: SectorId;
  label: string;
  shortLabel: string;
  tagline: string;
  accent: SectorId;
  icon: string;
  items: SectorNavItem[];
};

export const SECTORS: Sector[] = [
  {
    id: "tienda",
    label: "Tienda Online",
    shortLabel: "Tienda",
    tagline: "Lo que se vende en /tienda",
    accent: "tienda",
    icon: "store",
    items: [
      { href: "/admin/productos", label: "Productos", description: "Catálogo, precios y stock.", icon: "box" },
      { href: "/admin/categorias", label: "Categorías", description: "Organización del catálogo.", icon: "tag" },
      { href: "/admin/pedidos", label: "Pedidos", description: "Ventas cerradas por WhatsApp.", icon: "list" },
      { href: "/admin/envios", label: "Envíos", description: "Costo por zona del país.", icon: "truck" },
    ],
  },
  {
    id: "negocio",
    label: "Gestión del Negocio",
    shortLabel: "Negocio",
    tagline: "Instalaciones, equipo y números",
    accent: "negocio",
    icon: "briefcase",
    items: [
      { href: "/admin/proyectos", label: "Proyectos", description: "De cotización a instalación.", icon: "projects" },
      { href: "/admin/stock", label: "Stock", description: "Inventario interno completo.", icon: "stock" },
      { href: "/admin/clientes", label: "Clientes", description: "Contactos y leads.", icon: "users" },
      { href: "/admin/equipo", label: "Equipo", description: "Vendedores, técnicos y roles.", icon: "badge" },
      { href: "/admin/reportes", label: "Reportes", description: "Ventas, margen y estado.", icon: "chart" },
      { href: "/admin/caja", label: "Caja diaria", description: "Apertura, movimientos y cierre.", icon: "cash" },
    ],
  },
  {
    id: "sitio",
    label: "Configuración del Sitio",
    shortLabel: "Sitio",
    tagline: "Datos, moneda y apariencia",
    accent: "sitio",
    icon: "settings",
    items: [
      { href: "/admin/configuracion", label: "Configuración", description: "Nombre, moneda, redes y tema.", icon: "settings" },
    ],
  },
];

export const ACCENT_TEXT: Record<SectorId, string> = {
  tienda: "text-tienda",
  negocio: "text-negocio",
  sitio: "text-sitio",
};
export const ACCENT_BG_SOFT: Record<SectorId, string> = {
  tienda: "bg-tienda/15",
  negocio: "bg-negocio/15",
  sitio: "bg-sitio/15",
};
export const ACCENT_BG_SOLID: Record<SectorId, string> = {
  tienda: "bg-tienda",
  negocio: "bg-negocio",
  sitio: "bg-sitio",
};
export const ACCENT_SHADOW: Record<SectorId, string> = {
  tienda: "hover:shadow-[0_30px_70px_-25px_rgba(179,105,10,0.45)]",
  negocio: "hover:shadow-[0_30px_70px_-25px_rgba(29,84,201,0.45)]",
  sitio: "hover:shadow-[0_30px_70px_-25px_rgba(124,58,237,0.45)]",
};
export const ACCENT_GLOW: Record<SectorId, string> = {
  tienda: "bg-[radial-gradient(circle,rgba(179,105,10,0.35),transparent_70%)]",
  negocio: "bg-[radial-gradient(circle,rgba(29,84,201,0.35),transparent_70%)]",
  sitio: "bg-[radial-gradient(circle,rgba(124,58,237,0.35),transparent_70%)]",
};

export function sectorForPath(pathname: string): Sector | null {
  return (
    SECTORS.find((s) =>
      s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/")),
    ) ?? null
  );
}
