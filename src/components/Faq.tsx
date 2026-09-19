"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "./Badge";
import GlowOrb from "./GlowOrb";

const FAQS = [
  {
    q: "¿Cuánto puedo ahorrar con paneles solares?",
    a: "El ahorro depende de tu consumo, ubicación, tipo de tarifa, orientación del techo y tamaño del sistema instalado. Con una factura eléctrica real podemos preparar una estimación precisa para tu caso.",
  },
  {
    q: "¿Los paneles solares funcionan en días nublados?",
    a: "Sí. En días nublados producen menos que en días despejados, pero siguen generando energía. La producción anual se calcula considerando la variación climática de tu región.",
  },
  {
    q: "¿Funcionan de noche?",
    a: "De noche los paneles no generan energía porque no hay radiación solar. Según el tipo de sistema, se puede combinar con la red eléctrica o con baterías de respaldo.",
  },
  {
    q: "¿Necesito mucho mantenimiento?",
    a: "El mantenimiento suele ser bajo. Se recomienda revisar limpieza, conexiones, estructura e inversor periódicamente para asegurar el máximo rendimiento.",
  },
  {
    q: "¿Sirve para hogares, comercios e industrias?",
    a: "Sí. La energía solar puede aplicarse en viviendas, negocios, empresas, campos e instalaciones industriales, adaptando el tamaño del sistema a cada consumo.",
  },
  {
    q: "¿Por qué tengo que adjuntar mi factura?",
    a: "La factura permite ver consumo, categoría, demanda y patrón de uso. Con esos datos se puede preparar una propuesta técnica y económica mucho más precisa.",
  },
  {
    q: "¿Qué evalúa BH antes de recomendar un sistema?",
    a: "Se analiza consumo, ubicación, superficie disponible, orientación, sombras, tipo de techo, objetivo de cobertura y factibilidad técnica antes de proponer una solución.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative isolate overflow-hidden bg-[#f6f4ee] px-4 py-24">
      <GlowOrb color="#2a4a8a" size={440} opacity={0.24} className="-right-20 -top-20" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <Badge>Preguntas frecuentes</Badge>
          <h2 className="balance mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Dudas comunes antes de instalar paneles solares.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-body">
            Respuestas simples para entender mejor cómo funciona un sistema
            solar, qué se evalúa antes de instalar y por qué conviene hacer
            una propuesta personalizada.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className="premium-card rounded-2xl border border-black/5 bg-white transition-shadow hover:shadow-[0_15px_40px_-20px_rgba(245,154,31,0.4)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer touch-manipulation items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-ink">{item.q}</span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-ink transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-body">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl bg-cream-100 p-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="font-bold text-ink">
              ¿Tenés una factura eléctrica a mano?
            </p>
            <p className="mt-1 text-sm text-body">
              Podemos usarla para preparar una estimación más clara y
              personalizada para tu caso.
            </p>
          </div>
          <Link
            href="/contacto"
            className="w-full shrink-0 rounded-lg bg-navy-900 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-navy-800 sm:w-auto"
          >
            Enviar consulta
          </Link>
        </div>
      </div>
    </section>
  );
}
