import type { Metadata } from "next";
import Badge from "@/components/Badge";
import GlowOrb from "@/components/GlowOrb";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Solicitá gratis tu Asesoramiento Solar | BH Electric Solar",
  description:
    "Solicitá tu asesoramiento solar con BH Electric Solar y recibí un análisis profesional de tu consumo energético.",
  alternates: { canonical: "/contacto" },
};

const STEPS = [
  {
    title: "Revisión de factura, consumo mensual y tipo de instalación.",
  },
  {
    title: "Análisis técnico de tu caso y dimensionamiento preliminar.",
  },
  {
    title: "Contacto por WhatsApp o email con una propuesta a medida.",
  },
];

export default function ContactoPage() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-dot-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <GlowOrb color="#2a4a8a" size={460} opacity={0.28} className="-right-20 -top-24" />
      <GlowOrb color="#f59a1f" size={380} opacity={0.24} className="-left-20 bottom-0" />
      <div className="relative mx-auto max-w-5xl text-center lg:text-left">
        <Badge>Contacto técnico</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <h1 className="balance text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Solicitá tu Asesoramiento Solar Personalizado
          </h1>
          <p className="text-sm leading-relaxed text-body">
            Solicitá tu asesoramiento solar con BH Electric Solar y recibí un
            análisis profesional de tu consumo energético. Completando
            nuestro formulario y adjuntando tu factura de electricidad,
            nuestro equipo evaluará tus necesidades para diseñar una
            propuesta personalizada con paneles solares que te permita
            reducir costos, mejorar la eficiencia energética y aprovechar al
            máximo la energía solar fotovoltaica.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-blueprint relative overflow-hidden rounded-2xl bg-navy-900 p-8 text-white shadow-[0_25px_60px_-25px_rgba(12,24,48,0.5)]">
            <h2 className="text-xl font-bold">
              Qué pasa después de enviar el formulario
            </h2>
            <p className="mt-2 text-sm text-white/60">
              El equipo recibe tus datos, revisa la factura y puede
              responderte con una propuesta más precisa.
            </p>
            <ol className="mt-6 flex flex-col gap-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500 text-xs font-bold text-navy-950">
                    {index + 1}
                  </span>
                  <p className="text-sm text-white/85">{step.title}</p>
                </li>
              ))}
            </ol>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
