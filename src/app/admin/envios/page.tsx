"use client";

import { useEffect, useState } from "react";
import {
  getShippingZones,
  updateShippingZone,
  createShippingZone,
  deleteShippingZone,
  type ShippingZone,
} from "@/lib/shipping";
import { useAdminSettings } from "@/lib/admin-settings";
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

type Draft = { region: string; priceUSD: string; etaDays: string; provincesList: string[] };

const EMPTY_DRAFT: Draft = { region: "", priceUSD: "", etaDays: "", provincesList: [] };

export default function AdminEnviosPage() {
  const { formatPrice } = useAdminSettings();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getShippingZones()
      .then(setZones)
      .finally(() => setLoading(false));
  }, []);

  function startEdit(zone: ShippingZone) {
    setCreating(false);
    setEditingId(zone.id);
    setDraft({
      region: zone.region,
      priceUSD: String(zone.priceUSD),
      etaDays: zone.etaDays,
      provincesList: zone.provincesList,
    });
  }

  function startCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setCreating(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setCreating(false);
    setConfirmingDeleteId(null);
  }

  function toggleProvince(name: string) {
    setDraft((prev) => ({
      ...prev,
      provincesList: prev.provincesList.includes(name)
        ? prev.provincesList.filter((p) => p !== name)
        : [...prev.provincesList, name],
    }));
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const priceUSD = Number(draft.priceUSD) || 0;
      const patch = { region: draft.region, priceUSD, etaDays: draft.etaDays, provincesList: draft.provincesList };
      await updateShippingZone(editingId, patch);
      setZones((prev) =>
        prev.map((z) =>
          z.id === editingId
            ? { ...z, ...patch, provinces: draft.provincesList.join(", ") }
            : z,
        ),
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function saveNew() {
    if (!draft.region.trim()) return;
    setSaving(true);
    try {
      const zone = await createShippingZone({
        region: draft.region,
        priceUSD: Number(draft.priceUSD) || 0,
        etaDays: draft.etaDays,
        provincesList: draft.provincesList,
      });
      setZones((prev) => [...prev, zone].sort((a, b) => a.priceUSD - b.priceUSD));
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteShippingZone(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
    if (editingId === id) setEditingId(null);
    setConfirmingDeleteId(null);
  }

  function ProvincePicker() {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-ink/10 bg-background p-3 sm:grid-cols-3">
        {PROVINCIAS_ARGENTINA.map((name) => (
          <label key={name} className="flex cursor-pointer items-center gap-1.5 text-xs text-ink">
            <input
              type="checkbox"
              checked={draft.provincesList.includes(name)}
              onChange={() => toggleProvince(name)}
              className="h-3.5 w-3.5 cursor-pointer accent-gold-500"
            />
            {name}
          </label>
        ))}
      </div>
    );
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <SectorEyebrow />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Envíos</h1>
            <p className="mt-1 text-sm text-body">
              Zonas de envío con costo fijo. Elegís vos qué provincias entran
              en cada zona.
            </p>
          </div>
          {!creating && (
            <button
              type="button"
              onClick={startCreate}
              className="shrink-0 cursor-pointer touch-manipulation rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition-all hover:shadow-md"
            >
              + Nueva zona
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — estos valores todavía no se usan en el
          checkout de la tienda (que hoy cierra por WhatsApp sin cobrar
          envío aparte), pero ya quedan guardados de verdad.
        </div>

        {creating && (
          <div className="mt-5 rounded-xl border border-gold-500/40 bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold text-ink">Nueva zona</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="col-span-2 block">
                <span className="text-xs font-semibold text-ink">Nombre de la zona</span>
                <input
                  value={draft.region}
                  onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                  placeholder="Ej: NOA"
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Costo (USD)</span>
                <input
                  type="number"
                  min={0}
                  value={draft.priceUSD}
                  onChange={(e) => setDraft({ ...draft, priceUSD: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Tiempo estimado</span>
                <input
                  value={draft.etaDays}
                  onChange={(e) => setDraft({ ...draft, etaDays: e.target.value })}
                  placeholder="Ej: 5-7 días"
                  className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                />
              </label>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-ink">Provincias</span>
                <div className="mt-1.5">
                  <ProvincePicker />
                </div>
              </div>
              <button
                type="button"
                onClick={saveNew}
                disabled={saving || !draft.region.trim()}
                className="col-span-2 cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Crear zona"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="col-span-2 cursor-pointer touch-manipulation rounded-lg border border-ink/15 py-2 text-xs font-semibold text-body"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading && <p className="mt-5 text-sm text-body">Cargando zonas de envío…</p>}

        <div className="mt-5 flex flex-col gap-3">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{zone.region}</p>
                  <p className="mt-0.5 text-xs text-body">
                    {zone.provincesList.length > 0 ? zone.provincesList.join(", ") : zone.provinces}
                  </p>
                </div>
                {editingId !== zone.id && (
                  <span className="font-data shrink-0 text-lg font-semibold text-ink">
                    {formatPrice(zone.priceUSD)}
                  </span>
                )}
              </div>

              {editingId === zone.id ? (
                <div className="mt-3 flex flex-col gap-3 border-t border-ink/10 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink">Nombre de la zona</span>
                      <input
                        value={draft.region}
                        onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink">Costo (USD)</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.priceUSD}
                        onChange={(e) => setDraft({ ...draft, priceUSD: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="col-span-2 block">
                      <span className="text-xs font-semibold text-ink">Tiempo estimado</span>
                      <input
                        value={draft.etaDays}
                        onChange={(e) => setDraft({ ...draft, etaDays: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
                      />
                    </label>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink">Provincias</span>
                    <div className="mt-1.5">
                      <ProvincePicker />
                    </div>
                  </div>
                  {confirmingDeleteId === zone.id ? (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                      <p className="flex-1 text-xs font-semibold text-red-500">
                        ¿Seguro que querés eliminar &ldquo;{zone.region}&rdquo;?
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDelete(zone.id)}
                        className="cursor-pointer touch-manipulation rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 px-3 py-2 text-xs font-semibold text-body"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md disabled:opacity-50"
                      >
                        {saving ? "Guardando…" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(zone.id)}
                        className="cursor-pointer touch-manipulation rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold text-body"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <p className="text-xs text-body">Tiempo estimado: {zone.etaDays}</p>
                  <button
                    type="button"
                    onClick={() => startEdit(zone)}
                    className="cursor-pointer touch-manipulation rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-semibold text-ink hover:underline"
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
