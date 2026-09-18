"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectorForPath, type Sector } from "@/lib/admin-sectors";

const ACCENT_TEXT: Record<Sector["accent"], string> = {
  tienda: "text-tienda",
  negocio: "text-negocio",
};

export default function SectorEyebrow() {
  const pathname = usePathname();
  const sector = sectorForPath(pathname);
  if (!sector) return null;

  return (
    <Link
      href="/admin"
      className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${ACCENT_TEXT[sector.accent]} hover:underline`}
    >
      ← {sector.label}
    </Link>
  );
}
