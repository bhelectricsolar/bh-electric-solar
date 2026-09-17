import type { Metadata } from "next";
import Badge from "@/components/Badge";
import GlowOrb from "@/components/GlowOrb";
import StoreCatalog from "@/components/store/StoreCatalog";

export const metadata: Metadata = {
  title: "Tienda de Equipos Solares | BH Electric Solar",
  description:
    "Paneles solares, inversores, baterías, estructuras de montaje y accesorios. Consultá disponibilidad y coordiná tu pedido por WhatsApp.",
};

export default function TiendaPage() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <GlowOrb color="#f59a1f" size={460} opacity={0.3} className="-right-20 -top-24" />
      <GlowOrb color="#2a4a8a" size={380} opacity={0.22} className="-left-20 bottom-0" />

      <div className="relative mx-auto max-w-6xl text-center lg:text-left">
        <Badge>Tienda de equipos</Badge>
        <h1 className="balance mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:mx-0">
          Paneles, inversores y accesorios para tu proyecto solar.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body lg:mx-0">
          Elegí los equipos que necesitás y armá tu pedido — coordinamos
          disponibilidad, pago y envío directamente por WhatsApp.
        </p>

        <div className="mt-10 text-left">
          <StoreCatalog />
        </div>
      </div>
    </section>
  );
}
