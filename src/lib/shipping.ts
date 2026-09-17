import { createClient } from "./supabase/client";

const supabase = createClient();

export type ShippingZone = {
  id: string;
  region: string;
  provinces: string;
  priceUSD: number;
  etaDays: string;
};

type ShippingZoneRow = {
  id: string;
  region: string;
  provinces: string;
  price_usd: number;
  eta_days: string | null;
};

function fromRow(row: ShippingZoneRow): ShippingZone {
  return {
    id: row.id,
    region: row.region,
    provinces: row.provinces,
    priceUSD: Number(row.price_usd),
    etaDays: row.eta_days ?? "",
  };
}

export async function getShippingZones(): Promise<ShippingZone[]> {
  const { data, error } = await supabase.from("shipping_zones").select("*").order("price_usd");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateShippingZone(id: string, patch: { priceUSD: number; etaDays: string }) {
  const { error } = await supabase
    .from("shipping_zones")
    .update({ price_usd: patch.priceUSD, eta_days: patch.etaDays })
    .eq("id", id);
  if (error) throw error;
}
