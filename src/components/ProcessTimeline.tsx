import Badge from "./Badge";
import GlowOrb from "./GlowOrb";

const STEPS = [
  {
    number: "01",
    title: "Evaluación gratuita",
    description:
      "Analizamos tu consumo energético, tus objetivos y las características de tu propiedad para identificar la mejor alternativa.",
  },
  {
    number: "02",
    title: "Diseño personalizado",
    description:
      "Diseñamos una propuesta adaptada a tus necesidades, optimizando rendimiento, inversión y proyección de ahorro.",
  },
  {
    number: "03",
    title: "Instalación profesional",
    description:
      "Nuestro equipo realiza la instalación siguiendo altos estándares de calidad y seguridad.",
  },
  {
    number: "04",
    title: "Monitoreo y soporte",
    description:
      "Continuamos acompañándote después de la instalación para asegurar el máximo rendimiento del sistema.",
  },
];

export default function ProcessTimeline() {
  return (
    <section className="bg-blueprint relative isolate overflow-hidden bg-navy-950 px-4 py-24">
      <GlowOrb color="#f59a1f" size={520} opacity={0.22} className="-right-40 -top-20" />
      <GlowOrb color="#3a5da8" size={480} opacity={0.28} className="-left-32 bottom-0" />
      <div className="relative mx-auto max-w-4xl text-center">
        <Badge tone="dark">Nuestro proceso</Badge>
        <h2 className="balance mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Así hacemos realidad tu proyecto solar.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          Desde la evaluación inicial hasta la puesta en marcha, te
          acompañamos en cada etapa para garantizar una solución eficiente,
          segura y adaptada a tus necesidades.
        </p>
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl">
        <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-gold-400/50 via-white/15 to-transparent sm:left-1/2 sm:-translate-x-1/2" />
        <div className="flex flex-col gap-8 sm:gap-6">
          {STEPS.map((step, index) => {
            const alignRight = index % 2 === 1;
            return (
              <div
                key={step.number}
                className={`relative flex sm:items-center ${
                  alignRight ? "sm:justify-end" : "sm:justify-start"
                }`}
              >
                <div className="font-data absolute left-5 top-0 z-10 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-gold-500/50 bg-navy-950 text-xs font-semibold text-gold-400 shadow-[0_0_20px_rgba(245,154,31,0.35)] sm:left-1/2 sm:top-6 sm:h-11 sm:w-11 sm:text-sm">
                  {step.number}
                </div>
                <div
                  className={`ml-16 w-[calc(100%-4rem)] rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors hover:border-gold-400/30 hover:bg-white/[0.08] sm:ml-0 sm:w-[46%] sm:p-6 ${
                    alignRight ? "sm:text-right" : ""
                  }`}
                >
                  <h3 className="text-lg font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
