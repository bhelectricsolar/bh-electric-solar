import { supabase } from "@/lib/supabase";

const SITE_URL = "https://bhelectricsolar.com";

// Datos estructurados (schema.org) para que Google entienda que es un
// negocio local de energía solar: nombre, logo, contacto y redes. Se
// leen de Configuración así quedan al día solos si el dueño los cambia.
export default async function OrganizationSchema() {
  const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();

  const whatsapp = (data?.whatsapp ?? "+54 9 3754 419198").replace(/[^\d+]/g, "");
  const email = data?.email || "info@bhelectricsolar.com";
  const sameAs = [data?.instagram, data?.facebook, data?.linkedin].filter(
    (v): v is string => !!v && /^https?:\/\//.test(v),
  );

  const json = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name: data?.store_name || "BH Electric Solar",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.png`,
    description:
      "Diseño e instalación de sistemas de energía solar fotovoltaica para hogares, empresas e industrias en Misiones, Argentina.",
    telephone: whatsapp,
    email,
    priceRange: "$$",
    areaServed: {
      "@type": "State",
      name: "Misiones",
      containedInPlace: { "@type": "Country", name: "Argentina" },
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "Misiones",
      addressCountry: "AR",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
