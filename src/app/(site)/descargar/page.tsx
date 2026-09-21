import type { Metadata } from "next";
import InstallApps from "@/components/InstallApps";

export const metadata: Metadata = {
  title: "Descargar la app de gestión | BH Electric Solar",
  description: "Instalá el software de gestión de BH Electric Solar en tu PC, Mac o Android.",
  manifest: "/admin-manifest.webmanifest",
  robots: { index: false },
};

export default function DescargarPage() {
  return (
    <section className="bg-blueprint relative isolate overflow-hidden bg-navy-950 px-4 py-16 sm:py-24">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#2a4a8a]/40 blur-3xl" />
      <div className="relative">
        <InstallApps />
      </div>
    </section>
  );
}
