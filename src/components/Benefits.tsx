import Badge from "./Badge";
import DarkCtaBanner from "./DarkCtaBanner";
import GlowOrb from "./GlowOrb";
import BenefitCards from "./BenefitCards";

export default function Benefits() {
  return (
    <section id="beneficios" className="relative isolate overflow-hidden bg-white px-4 py-24">
      <GlowOrb color="#2a4a8a" size={480} opacity={0.26} className="-right-20 top-10" />
      <GlowOrb color="#f59a1f" size={360} opacity={0.3} className="-left-16 bottom-0" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge>Beneficios / costos</Badge>
          <h2 className="balance mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            ¿Por Qué Elegir Energía Solar?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-body">
            Cada día sin una solución solar tiene un costo. Descubrí cómo BH
            Electric Solar transforma cada problema en un beneficio concreto.
          </p>
        </div>

        <div className="mt-12">
          <BenefitCards />
        </div>

        <div className="mt-8">
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
