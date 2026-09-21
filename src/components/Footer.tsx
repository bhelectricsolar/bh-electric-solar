import Link from "next/link";
import GlowOrb from "./GlowOrb";
import { WHATSAPP_NUMBER } from "./WhatsAppFloat";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Tienda", href: "/tienda" },
  { label: "Calculadora", href: "/calculadora-solar" },
  { label: "Beneficios", href: "/#beneficios" },
  { label: "Proyectos", href: "/#proyectos" },
];

const LEGAL_LINKS = [
  { label: "Política de privacidad", href: "/politica-de-privacidad" },
  { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
  { label: "Política de cookies", href: "/politica-de-cookies" },
  { label: "Aviso legal", href: "/aviso-legal" },
];

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/bheletricsolutions/",
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <path
        fill="currentColor"
        stroke="none"
        d="M14 9h2V6h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.3.2-.5.5-.5Z"
      />
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <g fill="currentColor" stroke="none">
        <rect x="3" y="9" width="4" height="11" />
        <circle cx="5" cy="5" r="2" />
        <path d="M11 9h4v2c.7-1.3 2-2.3 4-2.3 3 0 4 2 4 5.2V20h-4v-5.5c0-1.3 0-3-1.8-3s-2.2 1.4-2.2 2.9V20h-4Z" />
      </g>
    ),
  },
  {
    label: "WhatsApp",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    icon: (
      <path
        fill="currentColor"
        stroke="none"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.44 1.32 4.94L2 22l5.25-1.38a9.9 9.9 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.9C21.95 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.15-4.94-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.03.65.5.24.57.82 1.98.9 2.13.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.21.55.33.07.12.07.7-.17 1.37Z"
      />
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-blueprint relative isolate overflow-hidden bg-navy-950 px-4 pt-20 text-white/70">
      <GlowOrb color="#f59a1f" size={420} opacity={0.18} className="left-1/4 -top-32" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-12 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <h2 className="balance max-w-lg text-3xl font-extrabold leading-tight text-white">
            Transformemos tu consumo en{" "}
            <span className="text-gold-400">energía limpia.</span>
          </h2>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/contacto"
              className="rounded-lg bg-gold-500 px-5 py-3 text-center text-sm font-semibold text-navy-950"
            >
              Adjuntar mi Factura
            </Link>
            <Link
              href="/calculadora-solar"
              className="rounded-lg border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white"
            >
              ¿Qué Sistema Necesito?
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="BH Electric Solar" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="BH Electric Solar" className="mx-auto h-28 w-auto sm:mx-0" />
            </Link>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-white">
              Empresa
            </h3>
            <p className="mt-4 text-sm leading-relaxed">
              BH Electric Solar acompaña proyectos solares desde el análisis
              inicial hasta la instalación final, priorizando eficiencia,
              durabilidad y ahorro energético.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Navegación
            </h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Legal
            </h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Redes
            </h3>
            <div className="mt-4 flex justify-center gap-3 sm:justify-start">
              {SOCIALS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold-400/60 hover:text-gold-400"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {social.icon}
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-white/10 py-6 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} BH Electric Solar. Todos los
            derechos reservados. ·{" "}
            <Link href="/politica-de-privacidad" className="hover:text-white">
              Privacidad
            </Link>{" "}
            ·{" "}
            <Link href="/terminos-y-condiciones" className="hover:text-white">
              Términos
            </Link>
          </p>
          <p>Diseñado y desarrollado por Zentrix Studios</p>
        </div>
      </div>
    </footer>
  );
}
