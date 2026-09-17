import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Aviso Legal de la Empresa | BH Electric Solar",
  description: "Información legal sobre BH Electric Solar y el uso de este sitio web.",
};

export default function AvisoLegalPage() {
  return (
    <LegalPageLayout title="Aviso Legal" updated="Julio de 2026">
      <div>
        <h2>1. Información general</h2>
        <p>
          El presente sitio web es propiedad de BH Electric Solar, empresa
          dedicada al diseño, instalación y mantenimiento de sistemas de
          energía solar fotovoltaica, instalaciones eléctricas y
          soluciones energéticas.
        </p>
        <p className="mt-3">
          Ubicación: Leandro N. Alem, Provincia de Misiones, República
          Argentina.
        </p>
        <p className="mt-3">
          Para cualquier consulta relacionada con este sitio web o con
          nuestros servicios, puede comunicarse a través de los medios de
          contacto publicados en esta página.
        </p>
      </div>

      <div>
        <h2>2. Objeto del sitio web</h2>
        <p>
          Este sitio web tiene como finalidad brindar información sobre
          los servicios ofrecidos por BH Electric Solar, facilitar el
          contacto con clientes y potenciales clientes, y permitir la
          solicitud de presupuestos y asesoramiento técnico.
        </p>
        <p className="mt-3">
          Toda la información publicada tiene carácter informativo y podrá
          ser modificada o actualizada sin previo aviso.
        </p>
      </div>

      <div>
        <h2>3. Uso del sitio</h2>
        <p>
          El usuario se compromete a utilizar este sitio web de forma
          responsable, respetando la legislación vigente y absteniéndose
          de realizar acciones que puedan afectar el funcionamiento del
          sitio o perjudicar a terceros.
        </p>
        <p className="mt-3">
          Queda prohibido utilizar este sitio para actividades ilícitas,
          fraudulentas o que vulneren derechos de terceros.
        </p>
      </div>

      <div>
        <h2>4. Propiedad intelectual</h2>
        <p>
          Todos los contenidos de este sitio web, incluyendo textos,
          imágenes, fotografías, logotipos, diseños, gráficos, iconos,
          videos y demás elementos, son propiedad de BH Electric Solar o
          se utilizan con la autorización correspondiente.
        </p>
        <p className="mt-3">
          Queda prohibida su reproducción, distribución, modificación,
          publicación o utilización total o parcial sin autorización
          previa y por escrito.
        </p>
      </div>

      <div>
        <h2>5. Limitación de responsabilidad</h2>
        <p>
          BH Electric Solar realiza esfuerzos razonables para mantener la
          información publicada actualizada y correcta. No obstante, no
          garantiza la ausencia de errores, omisiones o interrupciones en
          el funcionamiento del sitio web.
        </p>
        <p className="mt-3">
          La empresa no será responsable por daños directos o indirectos
          derivados del uso del sitio, fallas técnicas, interrupciones del
          servicio o decisiones tomadas por los usuarios con base en la
          información publicada.
        </p>
      </div>

      <div>
        <h2>6. Enlaces externos</h2>
        <p>
          Este sitio web puede contener enlaces a páginas de terceros con
          fines exclusivamente informativos.
        </p>
        <p className="mt-3">
          BH Electric Solar no controla dichos sitios y no asume
          responsabilidad por sus contenidos, disponibilidad o políticas
          de privacidad.
        </p>
      </div>

      <div>
        <h2>7. Protección de datos personales</h2>
        <p>
          El tratamiento de los datos personales se realiza conforme a lo
          establecido en nuestra Política de Privacidad, disponible en
          este sitio web.
        </p>
      </div>

      <div>
        <h2>8. Modificaciones</h2>
        <p>
          BH Electric Solar podrá modificar el contenido del presente
          Aviso Legal en cualquier momento para adaptarlo a cambios
          normativos, técnicos o comerciales.
        </p>
        <p className="mt-3">
          Las modificaciones entrarán en vigencia desde su publicación en
          este sitio web.
        </p>
      </div>

      <div>
        <h2>9. Legislación aplicable</h2>
        <p>
          El presente Aviso Legal se rige por las leyes de la República
          Argentina.
        </p>
        <p className="mt-3">
          Cualquier controversia derivada del uso de este sitio web será
          sometida a la jurisdicción de los tribunales competentes de la
          Provincia de Misiones, salvo que la legislación aplicable
          disponga otra cosa.
        </p>
      </div>

      <div>
        <h2>10. Contacto</h2>
        <p>
          Para cualquier consulta relacionada con este Aviso Legal o con
          el funcionamiento del sitio web, puede comunicarse con BH
          Electric Solar a través de los medios de contacto publicados en
          esta página.
        </p>
      </div>
    </LegalPageLayout>
  );
}
