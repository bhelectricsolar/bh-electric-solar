import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Cookies | BH Electric Solar",
  description: "Qué cookies utiliza el sitio de BH Electric Solar y cómo gestionarlas.",
  alternates: { canonical: "/politica-de-cookies" },
};

export default function PoliticaDeCookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" updated="Julio de 2026">
      <div>
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que un sitio web
          almacena en el dispositivo del usuario cuando lo visita. Su
          finalidad es mejorar la experiencia de navegación, recordar
          preferencias, analizar el uso del sitio y, en algunos casos,
          ofrecer contenido o publicidad personalizada.
        </p>
      </div>

      <div>
        <h2>2. ¿Qué tipos de cookies utilizamos?</h2>
        <p>
          En BH Electric Solar podemos utilizar las siguientes categorías
          de cookies:
        </p>
        <ul>
          <li>
            <b>Cookies necesarias:</b> son esenciales para el correcto
            funcionamiento del sitio web y permiten funciones básicas como
            la navegación y el acceso a áreas seguras. Estas cookies no
            requieren consentimiento previo.
          </li>
          <li>
            <b>Cookies de rendimiento y análisis:</b> nos ayudan a
            comprender cómo los visitantes utilizan nuestro sitio web
            mediante información estadística anónima, permitiéndonos
            mejorar continuamente nuestros servicios. Ejemplos: Google
            Analytics, Google Search Console (cuando corresponda).
          </li>
          <li>
            <b>Cookies de funcionalidad:</b> permiten recordar determinadas
            preferencias del usuario, como el idioma o configuraciones de
            navegación, para ofrecer una experiencia más personalizada.
          </li>
          <li>
            <b>Cookies de terceros:</b> algunas funciones del sitio pueden
            utilizar servicios externos que instalan sus propias cookies,
            por ejemplo: Google Maps, YouTube (si se insertan videos), Meta
            (Facebook e Instagram), WhatsApp. Cada uno de estos servicios
            posee sus propias políticas de privacidad y uso de cookies.
          </li>
        </ul>
      </div>

      <div>
        <h2>3. ¿Cómo puede administrar las cookies?</h2>
        <p>
          El usuario puede aceptar, rechazar o eliminar las cookies desde
          la configuración de su navegador.
        </p>
        <p className="mt-3">
          La desactivación de determinadas cookies puede afectar el
          funcionamiento de algunas funciones del sitio web.
        </p>
      </div>

      <div>
        <h2>4. Consentimiento</h2>
        <p>
          Al continuar navegando en este sitio web, el usuario acepta el
          uso de cookies conforme a la presente Política, salvo que las
          haya deshabilitado mediante la configuración de su navegador o
          del banner de consentimiento disponible en el sitio.
        </p>
      </div>

      <div>
        <h2>5. Cambios en esta política</h2>
        <p>
          BH Electric Solar podrá actualizar la presente Política de
          Cookies cuando resulte necesario por cambios tecnológicos,
          legales o funcionales del sitio web.
        </p>
        <p className="mt-3">
          Las modificaciones serán publicadas en esta misma página.
        </p>
      </div>

      <div>
        <h2>6. Contacto</h2>
        <p>
          Si tiene consultas relacionadas con esta Política de Cookies,
          puede comunicarse con BH Electric Solar mediante los canales de
          contacto disponibles en este sitio web.
        </p>
      </div>
    </LegalPageLayout>
  );
}
