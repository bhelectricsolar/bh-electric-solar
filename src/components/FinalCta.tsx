import Link from "next/link";
import Badge from "./Badge";
import GlowOrb from "./GlowOrb";
import { WHATSAPP_NUMBER } from "./WhatsAppFloat";

export default function FinalCta() {
  return (
    <section className="bg-blueprint relative isolate overflow-hidden bg-navy-950 px-4 py-24 text-center">
      <GlowOrb color="#f59a1f" size={620} opacity={0.32} className="left-1/2 -top-64 -translate-x-1/2" />
      <div className="relative mx-auto max-w-2xl">
        <Badge tone="dark">Comienza hoy</Badge>
        <h2 className="balance mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          ¿Listo para transformar tu consumo energético?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Descubrí cuánto podrías ahorrar con una solución solar diseñada
          especialmente para tu hogar o negocio.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/contacto"
            className="rounded-lg bg-gold-500 px-6 py-3.5 text-sm font-semibold text-navy-950 shadow-[0_20px_50px_-15px_rgba(245,154,31,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_55px_-12px_rgba(245,154,31,0.85)]"
          >
            Quiero Adjuntar mi Factura
          </Link>
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "Hola BH Electric Solar, quiero más información sobre sus soluciones solares.",
            )}`}
            target="_blank"
            className="rounded-lg border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Hablar por WhatsApp
          </Link>
        </div>
      </div>
    </section>
  );
}
