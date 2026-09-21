import { supabase } from "./supabase";

// Zonas de envío para el checkout público (las lee cualquiera).
export type PublicShippingZone = {
  id: string;
  region: string;
  provincesList: string[];
  priceUSD: number;
  etaDays: string;
};

export async function getPublicShippingZones(): Promise<PublicShippingZone[]> {
  const { data, error } = await supabase.from("shipping_zones").select("*").order("price_usd");
  if (error) throw error;
  return (data ?? [])
    .filter((z) => z.id !== "retiro-local")
    .map((z) => ({
      id: z.id as string,
      region: z.region as string,
      provincesList: (z.provinces_list as string[] | null) ?? [],
      priceUSD: Number(z.price_usd),
      etaDays: (z.eta_days as string | null) ?? "",
    }));
}

export type StoreOrderInput = {
  name: string;
  email: string;
  phone: string;
  doc: string;
  shippingMethod: "retiro" | "envio";
  shippingZoneId: string;
  province: string;
  city: string;
  address: string;
  postal: string;
  notes: string;
  items: { id: string; qty: number }[];
};

export type StoreOrderResult = { id: string; subtotalUSD: number; shippingUSD: number; totalUSD: number };

// El pedido se guarda con una función del servidor que valida precios y
// disponibilidad — el navegador nunca escribe directo en las tablas.
export async function submitStoreOrder(input: StoreOrderInput): Promise<StoreOrderResult> {
  const { data, error } = await supabase.rpc("submit_store_order", {
    p: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      doc: input.doc,
      shipping_method: input.shippingMethod,
      shipping_zone_id: input.shippingZoneId,
      province: input.province,
      city: input.city,
      address: input.address,
      postal: input.postal,
      notes: input.notes,
      items: input.items,
    },
  });
  if (error) throw error;
  return {
    id: data.id as string,
    subtotalUSD: Number(data.subtotal_usd),
    shippingUSD: Number(data.shipping_usd),
    totalUSD: Number(data.total_usd),
  };
}
