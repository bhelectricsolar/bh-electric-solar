import type { Metadata } from "next";
import Badge from "@/components/Badge";
import GlowOrb from "@/components/GlowOrb";
import SolarCalculatorForm from "@/components/SolarCalculatorForm";

export const metadata: Metadata = {
  title: "Calculadora Solar | Calculá tu Ahorro con Paneles Solares",
  description:
    "Calculá en minutos el sistema solar ideal para tu hogar, comercio o industria.",
  alternates: { canonical: "/calculadora-solar" },
};

export default function CalculadoraSolarPage() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <GlowOrb color="#f59a1f" size={460} opacity={0.32} className="-right-20 -top-24" />
      <GlowOrb color="#2a4a8a" size={380} opacity={0.22} className="-left-20 bottom-0" />
      <div className="relative mx-auto max-w-5xl text-center lg:text-left">
        <Badge>Calculadora Solar Inteligente</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <h1 className="balance text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Calculá en minutos el Sistema Solar ideal para tu Hogar, Comercio
            o Indústria.
          </h1>
          <p className="text-sm leading-relaxed text-body">
            Nuestra Calculadora Solar fue desarrollada para ofrecer una
            estimación rápida y confiable del potencial de tu proyecto
            fotovoltaico. Analiza el consumo eléctrico, estima la potencia
            recomendada del sistema, calcula el ahorro aproximado y brinda una
            referencia inicial de la inversión necesaria, facilitando la
            planificación de una instalación solar adaptada a tus
            necesidades.
          </p>
        </div>

        <div className="mt-10">
          <SolarCalculatorForm />
        </div>
      </div>
    </section>
  );
}
