export type BenefitCard = {
  title: string;
  problem: string;
  solution: string;
};

export const BENEFIT_CARDS: BenefitCard[] = [
  {
    title: "Facturas de Energía",
    problem:
      "Costos eléctricos crecientes y sin control, sujetos a la inflación y a los aumentos tarifarios constantes.",
    solution:
      "Reducción drástica de hasta un 90% en tu factura, generando un ahorro real y predecible mes a mes.",
  },
  {
    title: "Dependencia y Seguridad",
    problem:
      "Total dependencia de la red eléctrica, vulnerable a cortes de suministro que afectan tu hogar o negocio.",
    solution:
      "Independencia y seguridad energética. Tu sistema sigue generando energía incluso durante cortes de red (con baterías).",
  },
  {
    title: "Impacto Ambiental",
    problem:
      "Consumo de energía de fuentes no renovables, contribuyendo a la huella de carbono y al cambio climático.",
    solution:
      "Generación de energía 100% limpia y renovable, reduciendo tu impacto ambiental y promoviendo la sustentabilidad.",
  },
  {
    title: "Valor del Inmueble",
    problem:
      "Estancamiento del valor de la propiedad, perdiendo una oportunidad clave de revalorización en el mercado actual.",
    solution:
      "Aumento significativo del valor de tu propiedad. Una instalación solar es una inversión que se revaloriza con el tiempo.",
  },
];
