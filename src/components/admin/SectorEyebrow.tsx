"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectorForPath, type Sector } from "@/lib/admin-sectors";

const ACCENT_TEXT: Record<Sector["accent"], string> = {
  tienda: "text-tienda",
  negocio: "text-negocio",
  sitio: "text-sitio",
};

export default function SectorEyebrow() {
  const pathname = usePathname();
  const sector = sectorForPath(pathname);
  if (!sector) return null;

  const hubHref = sector.id === "sitio" ? "/admin" : `/admin/${sector.id}`;

  return (
    <Link
      href={hubHref}
      className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${ACCENT_TEXT[sector.accent]} hover:underline`}
    >
      ← {sector.label}
    </Link>
  );
}
