import type { ReactElement } from "react";
import Badge from "./Badge";
import DarkCtaBanner from "./DarkCtaBanner";
import GlowOrb from "./GlowOrb";

const ICONS: Record<string, ReactElement> = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9" />
  ),
  building: (
    <path d="M4 21V6l6-3 6 3v15M4 21h16M9 9h1m3 0h1m-5 4h1m3 0h1M9 21v-4h4v4" />
  ),
  factory: (
    <path d="M3 21V11l5 3v-3l5 3V8l5 3v10H3Zm4-4h1m4 0h1m4 0h1" />
  ),
  ruler: (
    <path d="M4 15 15 4l5 5-11 11-5-5Zm3 0 2-2m1 4 2-2m-6-3 2-2" />
  ),
  panel: (
    <path d="M4 5h16v14H4V5Zm0 4.7h16M4 14.3h16M9.3 5v14M14.7 5v14" />
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 1-5.1 5.1L4 17l3 3 5.6-5.6a4 4 0 0 1 5.1-5.1L14.7 12l-3-3 3.03-2.7Z" />
  ),
};

type Service = {
  icon: keyof typeof ICONS;
  title: string;
  description: string;
  tag: string;
};

const SERVICES: Service[] = [
  {
    icon: "home",
    title: "Solar residencial",
    description:
      "Sistemas fotovoltaicos para hogares que buscan reducir el gasto eléctrico y ganar independencia energética.",
    tag: "Hogares",
  },
  {
    icon: "building",
    title: "Empresas y comercios",
    description:
      "Instalaciones solares para optimizar costos operativos y proyectar una imagen moderna y sustentable.",
    tag: "Negocios",
  },
  {
    icon: "factory",
    title: "Instalaciones industriales",
    description:
      "Proyectos para techos de fábricas y superficies amplias con criterio técnico y escalabilidad.",
    tag: "Indústria",
  },
  {
    icon: "ruler",
    title: "Dimensionamiento",
    description:
      "Analizamos consumo, ubicación, orientación y necesidades para definir una solución equilibrada.",
    tag: "Análisis técnico",
  },
  {
    icon: "panel",
    title: "Venta de equipos",
    description:
      "Paneles, inversores y componentes seleccionados para rendimiento, durabilidad y compatibilidad.",
    tag: "Equipamiento",
  },
  {
    icon: "wrench",
    title: "Llave en mano",
    description:
      "Nos ocupamos de la instalación completa para que el sistema quede listo para operar de forma eficiente.",
    tag: "Instalación",
  },
];

export default function Services() {
  return (
    <section id="servicios" className="relative isolate overflow-hidden bg-white px-4 py-24">
      <GlowOrb color="#f59a1f" size={520} opacity={0.3} className="-right-24 -top-24" />
      <GlowOrb color="#2a4a8a" size={460} opacity={0.25} className="-left-24 bottom-0" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="mx-auto lg:mx-0">
            <Badge>Expertos en soluciones solares</Badge>
            <h2 className="balance mx-auto mt-4 max-w-xl text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:mx-0">
              Soluciones de Energía Solar para un Futuro Más Eficiente
            </h2>
          </div>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-body lg:mx-0">
            Acompañamos todo el proceso: evaluación, selección de equipos,
            instalación y puesta en marcha. Cada sistema se piensa según el
            consumo real, el espacio disponible y el objetivo de ahorro.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:gap-px sm:overflow-hidden sm:rounded-2xl sm:border sm:border-ink/10 sm:bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <article
              key={service.title}
              className="group relative rounded-2xl border border-ink/10 bg-white p-7 shadow-[0_15px_35px_-25px_rgba(12,24,48,0.4)] transition-all hover:z-10 hover:bg-cream-100/60 hover:shadow-[0_25px_60px_-20px_rgba(245,154,31,0.35)] sm:rounded-none sm:border-0 sm:shadow-none"
            >
              <span className="text-xs font-semibold text-body/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-3 grid h-11 w-11 place-items-center rounded-lg bg-navy-900 text-gold-400 transition-all group-hover:bg-gold-500 group-hover:text-navy-950 group-hover:shadow-[0_0_25px_rgba(245,154,31,0.55)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                >
                  {ICONS[service.icon]}
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {service.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-600">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                {service.tag}
              </span>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <DarkCtaBanner
            title="Una solución solar bien pensada no empieza por los paneles solares: empieza por entender tu consumo."
            subtitle="Por eso cada propuesta se arma a medida, priorizando eficiencia, retorno y calidad de instalación."
            ctaLabel="Solicitar evaluación"
            ctaHref="/contacto"
          />
        </div>
      </div>
    </section>
  );
}
