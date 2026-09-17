import { createClient } from "./supabase/client";

const supabase = createClient();

export type ShippingZone = {
  id: string;
  region: string;
  provinces: string;
  provincesList: string[];
  priceUSD: number;
  etaDays: string;
};

type ShippingZoneRow = {
  id: string;
  region: string;
  provinces: string;
  provinces_list: string[] | null;
  price_usd: number;
  eta_days: string | null;
};

function fromRow(row: ShippingZoneRow): ShippingZone {
  return {
    id: row.id,
    region: row.region,
    provinces: row.provinces,
    provincesList: row.provinces_list ?? [],
    priceUSD: Number(row.price_usd),
    etaDays: row.eta_days ?? "",
  };
}

export async function getShippingZones(): Promise<ShippingZone[]> {
  const { data, error } = await supabase.from("shipping_zones").select("*").order("price_usd");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateShippingZone(
  id: string,
  patch: { region?: string; priceUSD: number; etaDays: string; provincesList: string[] },
) {
  const { error } = await supabase
    .from("shipping_zones")
    .update({
      ...(patch.region !== undefined ? { region: patch.region } : {}),
      price_usd: patch.priceUSD,
      eta_days: patch.etaDays,
      provinces_list: patch.provincesList,
      provinces: patch.provincesList.join(", "),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function createShippingZone(zone: {
  region: string;
  priceUSD: number;
  etaDays: string;
  provincesList: string[];
}): Promise<ShippingZone> {
  const id = "zona-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  const { error } = await supabase.from("shipping_zones").insert({
    id,
    region: zone.region,
    provinces: zone.provincesList.join(", "),
    provinces_list: zone.provincesList,
    price_usd: zone.priceUSD,
    eta_days: zone.etaDays,
  });
  if (error) throw error;
  return {
    id,
    region: zone.region,
    provinces: zone.provincesList.join(", "),
    provincesList: zone.provincesList,
    priceUSD: zone.priceUSD,
    etaDays: zone.etaDays,
  };
}

export async function deleteShippingZone(id: string) {
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (error) throw error;
}
