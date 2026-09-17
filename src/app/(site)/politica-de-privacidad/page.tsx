import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Privacidad | BH Electric Solar",
  description: "Cómo BH Electric Solar recopila, usa y protege tus datos personales.",
};

const TOC = [
  { id: "introduccion", label: "1. Introducción" },
  { id: "responsable", label: "2. Responsable del tratamiento" },
  { id: "informacion", label: "3. Información que recopilamos" },
  { id: "finalidad", label: "4. Finalidad del tratamiento" },
  { id: "proteccion", label: "5. Protección de la información" },
  { id: "comparticion", label: "6. Compartición de datos" },
  { id: "derechos", label: "7. Derechos de los usuarios" },
  { id: "cookies", label: "8. Cookies" },
  { id: "modificaciones", label: "9. Modificaciones" },
  { id: "contacto", label: "10. Contacto" },
];

export default function PoliticaDePrivacidadPage() {
  return (
    <LegalPageLayout title="Política de Privacidad" updated="Julio de 2026" toc={TOC}>
      <div id="introduccion">
        <h2>1. Introducción</h2>
        <p>
          En BH Electric Solar valoramos y protegemos la privacidad de
          nuestros clientes, usuarios y visitantes. Esta Política de
          Privacidad explica cómo recopilamos, utilizamos y protegemos la
          información personal que nos proporcionan a través de nuestro
          sitio web y de nuestros canales de comunicación.
        </p>
        <p className="mt-3">
          Al utilizar este sitio web, usted acepta las prácticas descritas
          en esta política.
        </p>
      </div>

      <div id="responsable">
        <h2>2. Responsable del tratamiento</h2>
        <p>
          BH Electric Solar
          <br />
          Localidad: Leandro N. Alem, Provincia de Misiones, República
          Argentina.
          <br />
          Correo electrónico: info@bhelectricsolar.com
          <br />
          Teléfono: 3754 419198
        </p>
      </div>

      <div id="informacion">
        <h2>3. Información que recopilamos</h2>
        <p>
          Podemos recopilar la siguiente información cuando el usuario se
          comunica con nosotros o solicita un presupuesto:
        </p>
        <ul>
          <li>Nombre y apellido.</li>
          <li>Dirección de correo electrónico.</li>
          <li>Número de teléfono.</li>
          <li>Localidad o domicilio del proyecto.</li>
          <li>Información relacionada con el servicio solicitado.</li>
          <li>
            Cualquier otra información proporcionada voluntariamente por el
            usuario.
          </li>
        </ul>
      </div>

      <div id="finalidad">
        <h2>4. Finalidad del tratamiento</h2>
        <p>La información recopilada será utilizada exclusivamente para:</p>
        <ul>
          <li>Responder consultas y solicitudes de información.</li>
          <li>Elaborar presupuestos personalizados.</li>
          <li>Coordinar visitas técnicas cuando corresponda.</li>
          <li>
            Brindar asesoramiento sobre soluciones de energía solar y
            servicios eléctricos.
          </li>
          <li>
            Mejorar la atención al cliente y la calidad de nuestros
            servicios.
          </li>
          <li>Cumplir con obligaciones legales cuando sea aplicable.</li>
        </ul>
      </div>

      <div id="proteccion">
        <h2>5. Protección de la información</h2>
        <p>
          BH Electric Solar adopta medidas técnicas y organizativas
          razonables para proteger la información personal frente a
          accesos no autorizados, pérdida, alteración o divulgación.
        </p>
        <p className="mt-3">
          No obstante, ningún sistema de transmisión o almacenamiento de
          datos es completamente seguro, por lo que no podemos garantizar
          una seguridad absoluta.
        </p>
      </div>

      <div id="comparticion">
        <h2>6. Compartición de datos</h2>
        <p>
          BH Electric Solar no vende, alquila ni comercializa los datos
          personales de sus usuarios.
        </p>
        <p className="mt-3">
          La información únicamente podrá ser compartida cuando exista una
          obligación legal o sea necesario para la correcta prestación del
          servicio solicitado.
        </p>
      </div>

      <div id="derechos">
        <h2>7. Derechos de los usuarios</h2>
        <p>
          De conformidad con la Ley N.º 25.326 de Protección de los Datos
          Personales, los titulares de los datos podrán solicitar el
          acceso, actualización, rectificación o eliminación de su
          información personal.
        </p>
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos podrán comunicarse con
          nosotros mediante los canales de contacto publicados en este
          sitio web.
        </p>
      </div>

      <div id="cookies">
        <h2>8. Cookies</h2>
        <p>
          Nuestro sitio web puede utilizar cookies para mejorar la
          experiencia de navegación, analizar el uso del sitio y optimizar
          nuestros servicios.
        </p>
        <p className="mt-3">
          El usuario puede configurar su navegador para aceptar, rechazar o
          eliminar las cookies en cualquier momento.
        </p>
      </div>

      <div id="modificaciones">
        <h2>9. Modificaciones</h2>
        <p>
          BH Electric Solar podrá actualizar esta Política de Privacidad
          cuando resulte necesario para adecuarla a cambios legales o
          mejoras en nuestros servicios.
        </p>
        <p className="mt-3">
          Las modificaciones entrarán en vigencia desde su publicación en
          este sitio web.
        </p>
      </div>

      <div id="contacto">
        <h2>10. Contacto</h2>
        <p>
          Si tiene consultas relacionadas con esta Política de Privacidad o
          con el tratamiento de sus datos personales, puede comunicarse con
          nosotros a través de los medios de contacto publicados en este
          sitio web.
        </p>
      </div>
    </LegalPageLayout>
  );
}
