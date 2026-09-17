export type ProductCategory =
  | "paneles"
  | "inversores"
  | "baterias"
  | "estructuras"
  | "accesorios";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  priceUSD: number;
  costUSD?: number;
  stock: number;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  gradient: string;
  // false = existe en el inventario interno pero todavía no se publicó en /tienda.
  publishedOnline?: boolean;
};

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "paneles", label: "Paneles solares" },
  { value: "inversores", label: "Inversores" },
  { value: "baterias", label: "Baterías" },
  { value: "estructuras", label: "Estructuras de montaje" },
  { value: "accesorios", label: "Accesorios" },
];

export const PRODUCTS: Product[] = [
  {
    id: "panel-550w",
    slug: "panel-solar-monocristalino-550w",
    name: "Panel Solar Monocristalino 550W",
    category: "paneles",
    priceUSD: 145,
    costUSD: 92,
    stock: 24,
    shortDescription:
      "Alta eficiencia para instalaciones residenciales y comerciales.",
    description:
      "Panel fotovoltaico monocristalino de 550W, pensado para maximizar la generación en superficies limitadas. Buen desempeño en condiciones de baja radiación y alta durabilidad frente a la intemperie.",
    specs: [
      { label: "Potencia", value: "550 W" },
      { label: "Tecnología", value: "Monocristalino PERC" },
      { label: "Eficiencia", value: "≈ 21.3%" },
      { label: "Garantía de producto", value: "12 años" },
      { label: "Garantía de rendimiento", value: "25 años (linear)" },
      { label: "Dimensiones", value: "2278 × 1134 × 35 mm" },
    ],
    gradient: "from-[#1d3474] to-[#0a1733]",
  },
  {
    id: "panel-450w",
    slug: "panel-solar-monocristalino-450w",
    name: "Panel Solar Monocristalino 450W",
    category: "paneles",
    priceUSD: 120,
    costUSD: 76,
    stock: 31,
    shortDescription: "Formato compacto, ideal para techos con espacio reducido.",
    description:
      "Panel de 450W en formato más compacto que el de 550W, pensado para techos residenciales con superficie limitada o instalaciones que requieren paneles más livianos y fáciles de manipular.",
    specs: [
      { label: "Potencia", value: "450 W" },
      { label: "Tecnología", value: "Monocristalino PERC" },
      { label: "Eficiencia", value: "≈ 20.9%" },
      { label: "Garantía de producto", value: "12 años" },
      { label: "Garantía de rendimiento", value: "25 años (linear)" },
      { label: "Dimensiones", value: "1909 × 1134 × 30 mm" },
    ],
    gradient: "from-[#2a4a8a] to-[#0c1a38]",
  },
  {
    id: "inversor-hibrido-5kw",
    slug: "inversor-hibrido-5kw",
    name: "Inversor Híbrido 5kW",
    category: "inversores",
    priceUSD: 950,
    costUSD: 640,
    stock: 9,
    shortDescription: "Compatible con batería para respaldo ante cortes de red.",
    description:
      "Inversor híbrido de 5kW que permite incorporar baterías de litio para seguir generando energía durante un corte de suministro. Gestiona automáticamente la prioridad entre autoconsumo, carga de batería e inyección a red.",
    specs: [
      { label: "Potencia nominal", value: "5000 W" },
      { label: "Tipo", value: "Híbrido (on-grid + batería)" },
      { label: "Eficiencia máxima", value: "≈ 97.6%" },
      { label: "Entradas MPPT", value: "2" },
      { label: "Comunicación", value: "WiFi / monitoreo remoto" },
      { label: "Garantía", value: "10 años" },
    ],
    gradient: "from-[#12274d] to-[#081127]",
  },
  {
    id: "inversor-ongrid-3kw",
    slug: "inversor-on-grid-3kw",
    name: "Inversor On-Grid 3kW",
    category: "inversores",
    priceUSD: 480,
    costUSD: 315,
    stock: 14,
    shortDescription: "Solución simple y económica para sistemas conectados a red.",
    description:
      "Inversor on-grid de 3kW para instalaciones sin batería, conectadas directamente a la red eléctrica. Buena relación costo-beneficio para proyectos residenciales de autoconsumo.",
    specs: [
      { label: "Potencia nominal", value: "3000 W" },
      { label: "Tipo", value: "On-grid" },
      { label: "Eficiencia máxima", value: "≈ 97.1%" },
      { label: "Entradas MPPT", value: "1" },
      { label: "Comunicación", value: "WiFi / monitoreo remoto" },
      { label: "Garantía", value: "10 años" },
    ],
    gradient: "from-[#1a3568] to-[#0a1733]",
  },
  {
    id: "bateria-litio-5kwh",
    slug: "bateria-litio-5kwh",
    name: "Batería de Litio 5kWh",
    category: "baterias",
    priceUSD: 1450,
    costUSD: 980,
    stock: 6,
    shortDescription: "Respaldo de energía para uso nocturno o cortes de suministro.",
    description:
      "Batería de litio (LiFePO4) de 5kWh de capacidad utilizable, compatible con inversores híbridos. Permite almacenar el excedente de generación diurna para usarlo de noche o durante un corte de red.",
    specs: [
      { label: "Capacidad", value: "5 kWh utilizables" },
      { label: "Química", value: "LiFePO4 (litio-ferrofosfato)" },
      { label: "Ciclos de vida", value: "≥ 6000 ciclos" },
      { label: "Profundidad de descarga", value: "≈ 95%" },
      { label: "Apilable", value: "Sí, hasta 4 unidades" },
      { label: "Garantía", value: "10 años" },
    ],
    gradient: "from-[#0f1f45] to-[#081127]",
  },
  {
    id: "estructura-chapa-x10",
    slug: "estructura-montaje-techo-chapa-x10",
    name: "Estructura de Montaje — Techo de Chapa (x10 paneles)",
    category: "estructuras",
    priceUSD: 280,
    costUSD: 175,
    stock: 12,
    shortDescription: "Kit completo de fijación para techos de chapa trapezoidal.",
    description:
      "Kit de estructura de aluminio y acero inoxidable para la fijación de hasta 10 paneles sobre techos de chapa trapezoidal. Incluye ganchos, rieles y tornillería con tratamiento anticorrosivo.",
    specs: [
      { label: "Capacidad", value: "10 paneles" },
      { label: "Material", value: "Aluminio + acero inoxidable" },
      { label: "Tipo de techo", value: "Chapa trapezoidal" },
      { label: "Resistencia al viento", value: "≥ 150 km/h" },
      { label: "Incluye", value: "Rieles, ganchos y tornillería" },
      { label: "Garantía", value: "15 años" },
    ],
    gradient: "from-[#4a4f63] to-[#171b2c]",
  },
  {
    id: "cable-solar-6mm",
    slug: "cable-solar-6mm-rollo-100m",
    name: "Cable Solar 6mm² — Rollo 100m",
    category: "accesorios",
    priceUSD: 95,
    costUSD: 58,
    stock: 18,
    shortDescription: "Cable unipolar resistente a UV, apto para exterior.",
    description:
      "Cable solar fotovoltaico de 6mm² en rollo de 100 metros, con aislación resistente a rayos UV y variaciones de temperatura. Uso estándar en la conexión entre paneles e inversor.",
    specs: [
      { label: "Sección", value: "6 mm²" },
      { label: "Longitud", value: "100 m (rollo)" },
      { label: "Resistencia UV", value: "Sí, apto exterior" },
      { label: "Tensión máxima", value: "1.5 kV DC" },
      { label: "Color", value: "Negro" },
    ],
    gradient: "from-[#6b5a3a] to-[#241d0f]",
  },
  {
    id: "conectores-mc4",
    slug: "kit-conectores-mc4-par",
    name: "Kit de Conectores MC4 (par)",
    category: "accesorios",
    priceUSD: 8,
    costUSD: 5,
    stock: 60,
    shortDescription: "Conectores estándar macho/hembra para cableado solar.",
    description:
      "Par de conectores MC4 (macho y hembra), el estándar de la industria para la conexión segura entre paneles solares y cableado. Resistentes a la intemperie y con certificación IP67.",
    specs: [
      { label: "Tipo", value: "MC4 macho + hembra" },
      { label: "Protección", value: "IP67" },
      { label: "Corriente máxima", value: "30 A" },
      { label: "Tensión máxima", value: "1.5 kV DC" },
    ],
    gradient: "from-[#5c6e46] to-[#1e2a1a]",
  },
  {
    id: "cinta-autofusionante",
    slug: "cinta-autofusionante-empalmes",
    name: "Cinta autofusionante para empalmes",
    category: "accesorios",
    priceUSD: 6,
    costUSD: 3,
    stock: 40,
    shortDescription: "Material interno para sellado de empalmes en obra.",
    description:
      "Cinta autofusionante de uso interno para el equipo de instalación — sellado de empalmes de cable en obra. No se vende suelta al público, se usa como insumo de instalación.",
    specs: [
      { label: "Uso", value: "Insumo interno de instalación" },
      { label: "Resistencia UV", value: "Sí" },
    ],
    gradient: "from-[#3a4a3a] to-[#161f16]",
    publishedOnline: false,
  },
  {
    id: "panel-550w-reacondicionado",
    slug: "panel-550w-reacondicionado",
    name: "Panel Solar 550W — reacondicionado (stock interno)",
    category: "paneles",
    priceUSD: 95,
    costUSD: 40,
    stock: 3,
    shortDescription: "Unidad reacondicionada, pendiente de inspección para reventa.",
    description:
      "Panel devuelto/reacondicionado en revisión técnica. Todavía no se publica en la tienda hasta confirmar que cumple los estándares de reventa.",
    specs: [
      { label: "Potencia", value: "550 W" },
      { label: "Estado", value: "Reacondicionado — en revisión" },
    ],
    gradient: "from-[#4a3a1d] to-[#1f1708]",
    publishedOnline: false,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  ).slice(0, limit);
}
