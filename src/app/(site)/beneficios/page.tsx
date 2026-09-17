import type { Metadata } from "next";
import Badge from "@/components/Badge";
import GlowOrb from "@/components/GlowOrb";
import BenefitCards from "@/components/BenefitCards";
import DarkCtaBanner from "@/components/DarkCtaBanner";

export const metadata: Metadata = {
  title: "Beneficios de la Energía Solar | BH Electric Solar",
  description:
    "Ahorro en la factura, independencia energética, menor impacto ambiental y mayor valor de la propiedad: los beneficios concretos de instalar paneles solares con BH Electric Solar.",
};

export default function BeneficiosPage() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <GlowOrb color="#2a4a8a" size={460} opacity={0.26} className="-right-20 -top-24" />
      <GlowOrb color="#f59a1f" size={380} opacity={0.28} className="-left-20 bottom-0" />

      <div className="relative mx-auto max-w-5xl text-center lg:text-left">
        <Badge>Beneficios / costos</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <h1 className="balance text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            ¿Por Qué Elegir Energía Solar?
          </h1>
          <p className="text-sm leading-relaxed text-body">
            Cada día sin una solución solar tiene un costo — en la factura,
            en la dependencia de la red y en el impacto ambiental. Acá
            desglosamos, problema por problema, lo que cambia cuando el
            sistema lo diseña BH Electric Solar.
          </p>
        </div>

        <div className="mt-12">
          <BenefitCards />
        </div>

        <div className="mt-10">
          <DarkCtaBanner
            title="Una instalación solar bien pensada se nota en el ahorro, en la seguridad y en la tranquilidad de saber que todo está diseñado correctamente."
            subtitle="BH Electric Solar acompaña desde la evaluación inicial hasta la puesta en marcha del sistema."
            ctaLabel="Solicitar asesoramiento"
            ctaHref="/contacto"
          />
        </div>
      </div>
    </section>
  );
}
