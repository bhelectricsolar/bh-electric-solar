export type ShippingZone = {
  id: string;
  region: string;
  provinces: string;
  priceUSD: number;
  etaDays: string;
};

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: "retiro-local",
    region: "Retiro en el local",
    provinces: "Sin envío — el cliente pasa a buscarlo",
    priceUSD: 0,
    etaDays: "Al momento",
  },
  {
    id: "nea",
    region: "NEA / Litoral",
    provinces: "Misiones, Corrientes, Chaco, Formosa",
    priceUSD: 15,
    etaDays: "2-4 días",
  },
  {
    id: "amba",
    region: "AMBA",
    provinces: "CABA, Gran Buenos Aires",
    priceUSD: 25,
    etaDays: "3-5 días",
  },
  {
    id: "centro",
    region: "Centro",
    provinces: "Córdoba, Santa Fe, Entre Ríos, La Pampa",
    priceUSD: 22,
    etaDays: "3-5 días",
  },
  {
    id: "cuyo",
    region: "Cuyo",
    provinces: "Mendoza, San Juan, San Luis",
    priceUSD: 32,
    etaDays: "4-6 días",
  },
  {
    id: "noa",
    region: "NOA",
    provinces: "Salta, Jujuy, Tucumán, Catamarca, La Rioja, Santiago",
    priceUSD: 30,
    etaDays: "4-6 días",
  },
  {
    id: "patagonia",
    region: "Patagonia",
    provinces: "Neuquén, Río Negro, Chubut, Santa Cruz, Tierra del Fuego",
    priceUSD: 45,
    etaDays: "5-8 días",
  },
];
