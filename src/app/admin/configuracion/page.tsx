"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import {
  useAdminSettings,
  CARD_TYPES,
  type Currency,
  type ExchangeRateMode,
  type CardType,
  type CardKind,
  type InstallmentPlan,
} from "@/lib/admin-settings";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import { useTheme } from "../ThemeProvider";
import { getProducts, getCategories } from "@/lib/products";
import { getCustomers } from "@/lib/customers";
import { getOrders } from "@/lib/orders";
import { downloadCSV } from "@/lib/csv-export";
import { DEFAULT_HSP, PROVINCES, type ComponentKind, type PriceUnit, type SolarComponent } from "@/lib/solar-quote";
import { ALL_KINDS, FIXED_KINDS, KIND_LABELS, KIND_SPEC_UNIT, exampleComponents } from "@/lib/solar-system";

export default function AdminConfiguracionPage() {
  const { settings, updateSettings, formatPrice, refreshExchangeRate, exchangeRateStatus } =
    useAdminSettings();
  const { theme, toggle } = useTheme();
  const [planDraft, setPlanDraft] = useState<{
    cardType: CardType;
    cardKind: CardKind;
    installments: string;
    surchargePct: string;
    label: string;
  }>({ cardType: "Visa", cardKind: "credito", installments: "3", surchargePct: "0", label: "" });

  function addPlan() {
    const plan: InstallmentPlan = {
      id: Date.now().toString(36),
      cardType: planDraft.cardType,
      cardKind: planDraft.cardKind,
      installments: Number(planDraft.installments) || 1,
      surchargePct: Number(planDraft.surchargePct) || 0,
      label: planDraft.label.trim() || undefined,
    };
    updateSettings({ installmentPlans: [...settings.installmentPlans, plan] });
    setPlanDraft({ ...planDraft, installments: "3", surchargePct: "0", label: "" });
  }

  function removePlan(id: string) {
    updateSettings({ installmentPlans: settings.installmentPlans.filter((p) => p.id !== id) });
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-body">
          Datos generales, moneda y apariencia del panel.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — se guarda de verdad y sincroniza en
          cualquier dispositivo desde donde entren a administrar la tienda.
        </div>

        {/* Apariencia */}
        <SettingsCard title="Apariencia">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Tema</p>
              <p className="text-xs text-body">
                {theme === "dark" ? "Oscuro" : "Claro"} — también podés
                cambiarlo desde el ícono de la barra.
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md"
            >
              Cambiar a {theme === "dark" ? "claro" : "oscuro"}
            </button>
          </div>
        </SettingsCard>

        {/* Moneda */}
        <SettingsCard title="Moneda de la tienda">
          <div className="flex flex-wrap gap-2">
            {(["USD", "ARS"] as Currency[]).map((currency) => (
              <Chip key={currency} active={settings.currency === currency} onClick={() => updateSettings({ currency })}>
                {currency === "USD" ? "Dólares (USD)" : "Pesos argentinos (ARS)"}
              </Chip>
            ))}
          </div>

          {settings.currency === "ARS" && (
            <div className="mt-4 border-t border-ink/10 pt-4">
              <span className="text-xs font-semibold text-ink">
                Tipo de cambio (pesos por 1 USD)
              </span>

              <div className="mt-2 flex flex-wrap gap-2">
                {(["auto", "manual"] as ExchangeRateMode[]).map((mode) => (
                  <Chip
                    key={mode}
                    active={settings.exchangeRateMode === mode}
                    onClick={() => updateSettings({ exchangeRateMode: mode })}
                  >
                    {mode === "auto" ? "Automático (recomendado)" : "Manual"}
                  </Chip>
                ))}
              </div>

              {settings.exchangeRateMode === "auto" ? (
                <div className="mt-3 rounded-lg border border-ink/10 bg-background p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-data text-lg font-semibold text-ink">
                        ${settings.exchangeRate.toLocaleString("es-AR")}
                      </p>
                      <p className="text-[11px] text-body">
                        {exchangeRateStatus === "loading"
                          ? "Actualizando…"
                          : exchangeRateStatus === "error"
                            ? "No se pudo actualizar — mostrando el último valor guardado."
                            : settings.exchangeRateUpdatedAt
                              ? `Dólar oficial · actualizado ${new Date(
                                  settings.exchangeRateUpdatedAt,
                                ).toLocaleString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Dólar oficial"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refreshExchangeRate()}
                      disabled={exchangeRateStatus === "loading"}
                      className="shrink-0 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                    >
                      {exchangeRateStatus === "loading" ? "..." : "Actualizar"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-body">
                    Se toma automáticamente de la cotización del dólar
                    oficial — no hace falta que cargues nada. Se actualiza
                    cada vez que abrís esta pantalla.
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <SavableField
                    label="Monto manual (ARS por 1 USD)"
                    value={settings.exchangeRate}
                    type="number"
                    prefix="$ "
                    decimals
                    onSave={(v) => updateSettings({ exchangeRate: Number(v) || 0 })}
                  />
                </div>
              )}

              <p className="mt-3 text-xs text-body">
                Ejemplo: un producto de US$ 145 se muestra como{" "}
                <b className="text-ink">{formatPrice(145)}</b> con esta
                configuración.
              </p>
            </div>
          )}
        </SettingsCard>

        {/* Datos de la tienda */}
        <SettingsCard title="Datos de la tienda">
          <div className="flex flex-col gap-4">
            <SavableField
              label="Nombre de la tienda"
              value={settings.storeName}
              onSave={(v) => updateSettings({ storeName: v })}
            />
            <SavableField
              label="WhatsApp para pedidos"
              value={settings.whatsapp}
              onSave={(v) => updateSettings({ whatsapp: v })}
              placeholder="+54 9 3754 419198"
            />
            <SavableField
              label="Email de contacto"
              value={settings.email}
              onSave={(v) => updateSettings({ email: v })}
              placeholder="info@bhelectricsolar.com"
            />
          </div>
        </SettingsCard>

        {/* Redes sociales */}
        <SettingsCard title="Redes sociales">
          <div className="flex flex-col gap-4">
            <SavableField
              label="Instagram"
              value={settings.instagram}
              onSave={(v) => updateSettings({ instagram: v })}
              placeholder="https://instagram.com/tu_cuenta"
            />
            <SavableField
              label="Facebook"
              value={settings.facebook}
              onSave={(v) => updateSettings({ facebook: v })}
              placeholder="https://facebook.com/tu_pagina"
            />
            <SavableField
              label="LinkedIn"
              value={settings.linkedin}
              onSave={(v) => updateSettings({ linkedin: v })}
              placeholder="https://linkedin.com/company/tu_empresa"
            />
          </div>
        </SettingsCard>

        {/* Inventario */}
        <SettingsCard title="Inventario">
          <SavableField
            label="Avisar cuando el stock de un producto sea igual o menor a:"
            value={settings.lowStockThreshold}
            type="number"
            onSave={(v) => updateSettings({ lowStockThreshold: Number(v) || 0 })}
          />
        </SettingsCard>

        {/* Planes de cuotas */}
        <SettingsCard title="Planes de cuotas">
          <p className="text-xs text-body">
            Se usan como cotizador en Caja → Registrar venta, cuando la
            forma de pago es &ldquo;Cuotas&rdquo;.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {settings.installmentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-ink/10 bg-background p-3 text-xs"
              >
                <span className="font-bold text-ink">{plan.cardType}</span>
                <span className="text-body">{plan.cardKind === "credito" ? "Crédito" : "Débito"}</span>
                <span className="text-body">{plan.installments} cuotas</span>
                <span className="text-body">{plan.surchargePct}% recargo</span>
                {plan.label && <span className="text-body">· {plan.label}</span>}
                <button
                  type="button"
                  onClick={() => removePlan(plan.id)}
                  className="ml-auto cursor-pointer touch-manipulation text-red-500 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
            {settings.installmentPlans.length === 0 && (
              <p className="text-xs text-body">Todavía no cargaste ningún plan.</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Tarjeta</span>
              <select
                value={planDraft.cardType}
                onChange={(e) => setPlanDraft({ ...planDraft, cardType: e.target.value as CardType })}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
              >
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Modelo</span>
              <select
                value={planDraft.cardKind}
                onChange={(e) => setPlanDraft({ ...planDraft, cardKind: e.target.value as CardKind })}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
              >
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Cuotas</span>
              <NumberField
                suffix=" cuotas"
                value={planDraft.installments}
                onValueChange={(v) => setPlanDraft({ ...planDraft, installments: v })}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Recargo %</span>
              <NumberField
                decimals
                suffix=" %"
                value={planDraft.surchargePct}
                onValueChange={(v) => setPlanDraft({ ...planDraft, surchargePct: v })}
                className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-ink">Forma / nombre (opcional)</span>
            <input
              value={planDraft.label}
              onChange={(e) => setPlanDraft({ ...planDraft, label: e.target.value })}
              placeholder="Ej: Ahora 12, Plan Z, cuotas sin interés..."
              className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
            />
          </label>
          <button
            type="button"
            onClick={addPlan}
            className="mt-3 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
          >
            + Agregar plan
          </button>
        </SettingsCard>

        {/* Cotizador solar */}
        <SettingsCard title="Cotizador solar">
          <SavableField
            label="Costo instalado por defecto (USD por Wp)"
            value={settings.installCostPerWp}
            type="number"
            prefix="US$ "
            suffix=" /Wp"
            decimals
            onSave={(v) => updateSettings({ installCostPerWp: Number(v) || settings.installCostPerWp })}
          />
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-body">
            Horas sol pico (HSP) por provincia
          </p>
          <p className="mt-1 text-xs text-body">
            Valores de referencia — ajustalos con datos más precisos de cada zona. El ingeniero también puede
            cambiarlos a mano en cada cotización.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {PROVINCES.map((province) => (
              <SavableField
                key={province}
                label={province}
                value={settings.hspTable[province] ?? DEFAULT_HSP[province] ?? 4.5}
                type="number"
                decimals
                onSave={(v) =>
                  updateSettings({
                    hspTable: { ...settings.hspTable, [province]: Number(v) || DEFAULT_HSP[province] || 4.5 },
                  })
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ hspTable: DEFAULT_HSP })}
            className="mt-4 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
          >
            Restaurar valores de referencia
          </button>
        </SettingsCard>

        {/* Equipos y precios del cotizador */}
        <SettingsCard title="Equipos y precios (cotizador solar)">
          <p className="text-xs text-body">
            Cargá tus equipos con sus precios en dólares. El cotizador elige solo el inversor y las baterías que
            hagan falta y suma la estructura, protecciones e instalación. Todo se puede corregir en cada cotización.
          </p>
          {settings.solarComponents.length === 0 && (
            <button
              type="button"
              onClick={() => updateSettings({ solarComponents: exampleComponents() })}
              className="mt-3 rounded-lg border border-gold-500/50 bg-gold-500/10 px-4 py-2 text-xs font-bold text-gold-600 transition-all hover:bg-gold-500/15"
            >
              Cargar lista de ejemplo (precios a reemplazar por los tuyos)
            </button>
          )}
          {ALL_KINDS.map((kind) => {
            const rows = settings.solarComponents.filter((c) => c.kind === kind);
            if (rows.length === 0) return null;
            return (
              <div key={kind} className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-body">{KIND_LABELS[kind]}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {rows.map((c) => (
                    <ComponentRow
                      key={c.id}
                      component={c}
                      onSave={(next) =>
                        updateSettings({
                          solarComponents: settings.solarComponents.map((x) => (x.id === c.id ? next : x)),
                        })
                      }
                      onRemove={() =>
                        updateSettings({ solarComponents: settings.solarComponents.filter((x) => x.id !== c.id) })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <NewComponentForm
            onAdd={(c) => updateSettings({ solarComponents: [...settings.solarComponents, c] })}
          />
        </SettingsCard>

        {/* Exportar datos */}
        <SettingsCard title="Exportar datos">
          <p className="text-xs text-body">
            Descargá una copia en CSV de lo que tenés cargado ahora mismo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ExportButton
              label="Productos"
              onClick={async () => {
                const [products, categories] = await Promise.all([getProducts(), getCategories()]);
                downloadCSV(
                  "productos.csv",
                  products.map((p) => ({
                    nombre: p.name,
                    categoria:
                      categories.find((c) => c.value === p.category)?.label ??
                      p.category,
                    precio_usd: p.priceUSD,
                    stock: p.stock,
                  })),
                );
              }}
            />
            <ExportButton
              label="Clientes y leads"
              onClick={async () => {
                const customers = await getCustomers();
                downloadCSV(
                  "clientes-y-leads.csv",
                  customers.map((c) => ({
                    nombre: c.name,
                    email: c.email,
                    telefono: c.phone,
                    ciudad: c.city,
                    estado: c.status,
                  })),
                );
              }}
            />
            <ExportButton
              label="Pedidos"
              onClick={async () => {
                const orders = await getOrders();
                downloadCSV(
                  "pedidos.csv",
                  orders.map((o) => ({
                    pedido: o.id,
                    cliente: o.customerName,
                    estado: o.status,
                    fecha: o.createdAt,
                  })),
                );
              }}
            />
          </div>
        </SettingsCard>
      </div>
    </section>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border border-ink/10 bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-body">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// Cada campo se edita en borrador local y solo se guarda de verdad cuando
// se aprieta "Guardar" — así no dispara una escritura a Supabase por cada
// letra tipeada, y queda claro cuándo algo todavía no se guardó.
function SavableField({
  label,
  value,
  onSave,
  placeholder,
  type = "text",
  prefix,
  suffix,
  decimals,
}: {
  label: string;
  value: string | number;
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  type?: "text" | "number" | "email";
  prefix?: string;
  suffix?: string;
  decimals?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const dirty = draft !== String(value);

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1500);
  }

  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex gap-2">
        {type === "number" ? (
          <NumberField
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            value={draft}
            onValueChange={setDraft}
            placeholder={placeholder}
            className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
          />
        ) : (
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
          />
        )}
        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-800 disabled:opacity-60"
          >
            {saving ? "…" : "Guardar"}
          </button>
        )}
        {!dirty && justSaved && (
          <span className="shrink-0 self-center text-xs font-semibold text-green-600">✓ Guardado</span>
        )}
      </div>
    </label>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md"
    >
      {label} (.csv)
    </button>
  );
}

const INPUT_SM = "w-full rounded-md border border-ink/10 bg-background px-2 py-1.5 text-xs text-ink";

function ComponentRow({
  component,
  onSave,
  onRemove,
}: {
  component: SolarComponent;
  onSave: (c: SolarComponent) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(component);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    setDraft(component);
  }, [component]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(component);
  const specUnit = KIND_SPEC_UNIT[component.kind];
  const fixed = FIXED_KINDS.includes(component.kind);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 bg-background p-2.5">
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className={`${INPUT_SM} min-w-[9rem] flex-1`}
        aria-label="Nombre"
      />
      {specUnit && (
        <div className="w-24">
          <NumberField
            decimals
            suffix={` ${specUnit}`}
            value={draft.spec || ""}
            onValueChange={(v) => setDraft({ ...draft, spec: Number(v) || 0 })}
            className={INPUT_SM}
          />
        </div>
      )}
      <div className="w-28">
        <NumberField
          decimals
          prefix="US$ "
          value={draft.priceUSD || ""}
          onValueChange={(v) => setDraft({ ...draft, priceUSD: Number(v) || 0 })}
          className={INPUT_SM}
        />
      </div>
      {fixed && (
        <select
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value as PriceUnit })}
          className="rounded-md border border-ink/10 bg-background px-2 py-1.5 text-xs text-ink"
        >
          <option value="por_panel">por panel</option>
          <option value="por_kwp">por kWp</option>
          <option value="unidad">fijo</option>
        </select>
      )}
      {dirty && (
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="rounded-md bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Guardar
        </button>
      )}
      {confirming ? (
        <span className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-red-500">¿Quitar?</span>
          <button type="button" onClick={onRemove} className="rounded bg-red-500 px-2 py-1 font-bold text-white">
            Sí
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="rounded bg-cream-200 px-2 py-1 font-semibold text-ink">
            No
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-xs font-semibold text-red-500 hover:underline">
          Quitar
        </button>
      )}
    </div>
  );
}

function NewComponentForm({ onAdd }: { onAdd: (c: SolarComponent) => void }) {
  const [kind, setKind] = useState<ComponentKind>("panel");
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<PriceUnit>("por_kwp");
  const specUnit = KIND_SPEC_UNIT[kind];
  const fixed = FIXED_KINDS.includes(kind);

  function add() {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString(36),
      kind,
      name: name.trim(),
      spec: specUnit ? Number(spec) || 0 : 0,
      priceUSD: Number(price) || 0,
      unit: fixed ? unit : "unidad",
    });
    setName("");
    setSpec("");
    setPrice("");
  }

  return (
    <div className="mt-5 border-t border-ink/10 pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-body">Agregar equipo o rubro</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 block sm:col-span-1">
          <span className="text-xs font-semibold text-ink">Tipo</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ComponentKind)}
            className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
          >
            {ALL_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block">
          <span className="text-xs font-semibold text-ink">Nombre / modelo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Panel Jinko 550 W"
            className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
          />
        </label>
        {specUnit && (
          <label className="block">
            <span className="text-xs font-semibold text-ink">Capacidad ({specUnit})</span>
            <NumberField
              decimals
              suffix={` ${specUnit}`}
              value={spec}
              onValueChange={setSpec}
              className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
            />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-semibold text-ink">Precio (USD)</span>
          <NumberField
            decimals
            prefix="US$ "
            value={price}
            onValueChange={setPrice}
            className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2 text-sm text-ink"
          />
        </label>
        {fixed && (
          <label className="block">
            <span className="text-xs font-semibold text-ink">Se cobra</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as PriceUnit)}
              className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-2.5 py-2 text-sm text-ink"
            >
              <option value="por_panel">por panel</option>
              <option value="por_kwp">por kWp</option>
              <option value="unidad">monto fijo</option>
            </select>
          </label>
        )}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!name.trim()}
        className="mt-3 rounded-lg border border-ink/15 bg-background px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:shadow-md disabled:opacity-50"
      >
        + Agregar
      </button>
    </div>
  );
}
