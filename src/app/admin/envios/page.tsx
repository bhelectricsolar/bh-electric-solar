"use client";

import { useEffect, useState } from "react";
import { getShippingZones, updateShippingZone, type ShippingZone } from "@/lib/shipping";
import { useAdminSettings } from "@/lib/admin-settings";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

export default function AdminEnviosPage() {
  const { formatPrice } = useAdminSettings();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [draftEta, setDraftEta] = useState("");

  useEffect(() => {
    getShippingZones()
      .then(setZones)
      .finally(() => setLoading(false));
  }, []);

  function startEdit(zone: ShippingZone) {
    setEditingId(zone.id);
    setDraftPrice(String(zone.priceUSD));
    setDraftEta(zone.etaDays);
  }

  async function saveEdit() {
    if (!editingId) return;
    const priceUSD = Number(draftPrice) || 0;
    const etaDays = draftEta;
    await updateShippingZone(editingId, { priceUSD, etaDays });
    setZones((prev) =>
      prev.map((z) => (z.id === editingId ? { ...z, priceUSD, etaDays } : z)),
    );
    setEditingId(null);
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Envíos</h1>
        <p className="mt-1 text-sm text-body">
          Costo de envío fijo por zona. El cliente paga este monto y el
          envío lo despachás vos como hoy — sin integración con correos
          todavía.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — estos valores todavía no se usan en el
          checkout de la tienda (que hoy cierra por WhatsApp sin cobrar
          envío aparte), pero ya quedan guardados de verdad.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando zonas de envío…</p>}

        <div className="mt-5 flex flex-col gap-3">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{zone.region}</p>
                  <p className="mt-0.5 text-xs text-body">{zone.provinces}</p>
                </div>
                {editingId !== zone.id && (
                  <span className="font-data shrink-0 text-lg font-semibold text-ink">
                    {formatPrice(zone.priceUSD)}
                  </span>
                )}
              </div>

              {editingId === zone.id ? (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-ink">Costo (USD)</span>
                    <input
                      type="number"
                      min={0}
                      value={draftPrice}
                      onChange={(e) => setDraftPrice(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink">Tiempo estimado</span>
                    <input
                      value={draftEta}
                      onChange={(e) => setDraftEta(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="col-span-2 cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <p className="text-xs text-body">Tiempo estimado: {zone.etaDays}</p>
                  <button
                    type="button"
                    onClick={() => startEdit(zone)}
                    className="text-xs font-semibold text-navy-900 hover:underline"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
