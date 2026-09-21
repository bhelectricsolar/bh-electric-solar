import Link from "next/link";
import Badge from "./Badge";
import GlowOrb from "./GlowOrb";
import { WHATSAPP_NUMBER } from "./WhatsAppFloat";

type Project = {
  tag: string;
  title: string;
  description: string;
  gradient: string;
  image: string;
  alt: string;
};

const PROJECTS: Project[] = [
  {
    tag: "RESIDENCIAL",
    title: "Energía solar para hogares modernos",
    description:
      "Sistemas diseñados para reducir el consumo eléctrico y aumentar la independencia energética del hogar.",
    gradient: "from-[#37507c] to-[#0f1f45]",
    image: "/proyectos/residencial.jpg",
    alt: "Instalador colocando paneles solares sobre el techo de una casa",
  },
  {
    tag: "COMERCIAL",
    title: "Soluciones para negocios",
    description:
      "Instalaciones pensadas para optimizar costos operativos y mejorar la eficiencia energética.",
    gradient: "from-[#5c6e46] to-[#1e2a1a]",
    image: "/proyectos/comercial.jpg",
    alt: "Paneles solares instalados en un local comercial",
  },
  {
    tag: "INDUSTRIAL",
    title: "Proyectos industriales",
    description:
      "Sistemas escalables preparados para responder a grandes demandas energéticas.",
    gradient: "from-[#6b5a3a] to-[#241d0f]",
    image: "/proyectos/industrial.jpg",
    alt: "Campo de paneles solares sobre el techo de una planta industrial",
  },
  {
    tag: "A MEDIDA",
    title: "Soluciones personalizadas",
    description:
      "Diseñamos propuestas adaptadas a las necesidades específicas de cada cliente.",
    gradient: "from-[#4a4f63] to-[#171b2c]",
    image: "/proyectos/a-medida.jpg",
    alt: "Instalación solar personalizada",
  },
];

export default function Projects() {
  return (
    <section id="proyectos" className="relative isolate overflow-hidden bg-[#f6f4ee] px-4 py-24">
      <GlowOrb color="#2a4a8a" size={500} opacity={0.28} className="-right-24 top-0" />
      <GlowOrb color="#f59a1f" size={400} opacity={0.32} className="-left-16 bottom-10" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge>Proyectos destacados</Badge>
          <h2 className="balance mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Nuestros Proyectos de Energía Solar y Soluciones Eléctricas
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-body">
            Descubrí algunos ejemplos del tipo de soluciones solares que
            desarrollamos para hogares, comercios e industrias. Cada proyecto
            está pensado para maximizar el rendimiento y generar resultados a
            largo plazo.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <article
              key={project.title}
              className="premium-card group overflow-hidden rounded-2xl border border-ink/10 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(245,154,31,0.3)]"
            >
              <div className={`relative h-52 overflow-hidden bg-gradient-to-br sm:h-56 ${project.gradient}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
              <div className="p-6">
                <span className="inline-flex rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-950">
                  {project.tag}
                </span>
                <h3 className="mt-3 text-lg font-bold text-ink">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {project.description}
                </p>
                <Link
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hola BH, me interesa una instalación solar ${project.tag}. ¿Podrían asesorarme?`,
                  )}`}
                  target="_blank"
                  className="mt-4 inline-flex rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
                >
                  Solicitar información →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
