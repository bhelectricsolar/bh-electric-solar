import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Términos y Condiciones | BH Electric Solar",
  description: "Condiciones de uso del sitio web de BH Electric Solar.",
  alternates: { canonical: "/terminos-y-condiciones" },
};

const TOC = [
  { id: "titular", label: "1. Titular del sitio" },
  { id: "objeto", label: "2. Objeto del sitio" },
  { id: "uso", label: "3. Uso del sitio web" },
  { id: "propiedad", label: "4. Propiedad intelectual" },
  { id: "presupuestos", label: "5. Solicitudes de presupuesto" },
  { id: "disponibilidad", label: "6. Disponibilidad de la información" },
  { id: "enlaces", label: "7. Enlaces a terceros" },
  { id: "responsabilidad", label: "8. Limitación de responsabilidad" },
  { id: "datos", label: "9. Protección de datos" },
  { id: "modificaciones", label: "10. Modificaciones" },
  { id: "legislacion", label: "11. Legislación aplicable" },
  { id: "contacto", label: "12. Contacto" },
];

export default function TerminosYCondicionesPage() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones de Uso"
      updated="Julio de 2026"
      toc={TOC}
    >
      <p>
        Bienvenido al sitio web de BH Electric Solar. Al acceder y utilizar
        este sitio web, usted acepta los presentes Términos y Condiciones.
        Si no está de acuerdo con alguno de ellos, le recomendamos
        abstenerse de utilizar este sitio.
      </p>

      <div id="titular">
        <h2>1. Titular del sitio</h2>
        <p>
          Este sitio web es operado por BH Electric Solar, empresa
          dedicada a brindar soluciones en energía solar fotovoltaica,
          instalaciones eléctricas y servicios relacionados.
        </p>
        <p className="mt-3">
          Ubicación: Leandro N. Alem, Provincia de Misiones, República
          Argentina.
        </p>
      </div>

      <div id="objeto">
        <h2>2. Objeto del sitio</h2>
        <p>
          El presente sitio tiene como finalidad proporcionar información
          sobre los servicios ofrecidos por BH Electric Solar, facilitar el
          contacto con potenciales clientes y permitir la solicitud de
          presupuestos y asesoramiento técnico.
        </p>
        <p className="mt-3">
          La información publicada posee carácter informativo y no
          constituye una oferta comercial vinculante.
        </p>
      </div>

      <div id="uso">
        <h2>3. Uso del sitio web</h2>
        <p>
          El usuario se compromete a utilizar este sitio de forma
          responsable, respetando la legislación vigente y evitando
          cualquier acción que pueda afectar el funcionamiento del sitio o
          perjudicar a terceros.
        </p>
        <p className="mt-3">Queda prohibido:</p>
        <ul>
          <li>Utilizar el sitio con fines ilícitos.</li>
          <li>
            Intentar acceder sin autorización a sistemas o información.
          </li>
          <li>
            Introducir virus, malware u otros elementos que puedan afectar
            el funcionamiento del sitio.
          </li>
          <li>
            Copiar o reproducir el contenido con fines comerciales sin
            autorización expresa de BH Electric Solar.
          </li>
        </ul>
      </div>

      <div id="propiedad">
        <h2>4. Propiedad intelectual</h2>
        <p>
          Todo el contenido publicado en este sitio web, incluyendo
          textos, imágenes, fotografías, logotipos, diseños, gráficos,
          videos, iconografía y demás elementos, pertenece a BH Electric
          Solar o se utiliza con las autorizaciones correspondientes.
        </p>
        <p className="mt-3">
          Queda prohibida su reproducción, distribución, modificación o
          utilización sin autorización previa y por escrito.
        </p>
      </div>

      <div id="presupuestos">
        <h2>5. Solicitudes de presupuesto</h2>
        <p>
          Las solicitudes de presupuesto realizadas a través del sitio web
          o mediante WhatsApp, correo electrónico u otros canales de
          contacto no constituyen un contrato ni generan obligación alguna
          para las partes hasta tanto exista una aceptación expresa y
          formal del servicio.
        </p>
        <p className="mt-3">
          Los presupuestos podrán variar de acuerdo con las características
          técnicas del proyecto, disponibilidad de materiales y
          condiciones particulares de cada instalación.
        </p>
      </div>

      <div id="disponibilidad">
        <h2>6. Disponibilidad de la información</h2>
        <p>
          BH Electric Solar procura mantener la información del sitio
          actualizada y correcta. Sin embargo, no garantiza que todos los
          contenidos estén permanentemente libres de errores u omisiones.
        </p>
        <p className="mt-3">
          La empresa podrá modificar, actualizar o eliminar contenidos y
          servicios sin previo aviso.
        </p>
      </div>

      <div id="enlaces">
        <h2>7. Enlaces a terceros</h2>
        <p>
          Este sitio puede contener enlaces a sitios web de terceros con
          fines informativos.
        </p>
        <p className="mt-3">
          BH Electric Solar no controla dichos sitios y no asume
          responsabilidad por sus contenidos, políticas o prácticas.
        </p>
      </div>

      <div id="responsabilidad">
        <h2>8. Limitación de responsabilidad</h2>
        <p>
          BH Electric Solar no será responsable por daños directos o
          indirectos derivados del uso del sitio web, interrupciones del
          servicio, fallos técnicos o información proporcionada por
          terceros.
        </p>
        <p className="mt-3">
          El uso del sitio es responsabilidad exclusiva del usuario.
        </p>
      </div>

      <div id="datos">
        <h2>9. Protección de datos</h2>
        <p>
          El tratamiento de los datos personales se realiza conforme a
          nuestra Política de Privacidad, la cual forma parte integrante
          de estos Términos y Condiciones.
        </p>
      </div>

      <div id="modificaciones">
        <h2>10. Modificaciones</h2>
        <p>
          BH Electric Solar podrá modificar estos Términos y Condiciones
          en cualquier momento.
        </p>
        <p className="mt-3">
          Las modificaciones entrarán en vigencia desde su publicación en
          este sitio web.
        </p>
      </div>

      <div id="legislacion">
        <h2>11. Legislación aplicable</h2>
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la
          República Argentina.
        </p>
        <p className="mt-3">
          Cualquier controversia relacionada con el uso de este sitio será
          sometida a la jurisdicción de los tribunales competentes de la
          Provincia de Misiones, salvo disposición legal en contrario.
        </p>
      </div>

      <div id="contacto">
        <h2>12. Contacto</h2>
        <p>
          Para consultas relacionadas con estos Términos y Condiciones,
          puede comunicarse con BH Electric Solar a través de los medios de
          contacto publicados en este sitio web.
        </p>
      </div>
    </LegalPageLayout>
  );
}
