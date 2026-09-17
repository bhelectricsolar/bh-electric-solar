"use client";

import { useState } from "react";
import { useAdminSettings, type Currency, type ExchangeRateMode } from "@/lib/admin-settings";
import SectorEyebrow from "@/components/admin/SectorEyebrow";
import Chip from "@/components/admin/Chip";
import { useTheme } from "../ThemeProvider";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import { CUSTOMERS } from "@/lib/customers";
import { ORDERS } from "@/lib/orders";
import { downloadCSV } from "@/lib/csv-export";

export default function AdminConfiguracionPage() {
  const { settings, updateSettings, formatPrice, refreshExchangeRate, exchangeRateStatus } =
    useAdminSettings();
  const { theme, toggle } = useTheme();
  const [saved, setSaved] = useState(false);

  function flashSaved() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
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
          Esto sí se guarda — queda en este dispositivo (localStorage). Con
          Supabase conectado, va a sincronizar entre todos los dispositivos
          desde donde entren a administrar la tienda.
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
                <input
                  type="number"
                  min={1}
                  value={settings.exchangeRate}
                  onChange={(e) =>
                    updateSettings({ exchangeRate: Number(e.target.value) || 0 })
                  }
                  className="mt-3 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
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
            <TextField
              label="Nombre de la tienda"
              value={settings.storeName}
              onChange={(v) => updateSettings({ storeName: v })}
            />
            <TextField
              label="WhatsApp para pedidos"
              value={settings.whatsapp}
              onChange={(v) => updateSettings({ whatsapp: v })}
              placeholder="+54 9 3754 419198"
            />
            <TextField
              label="Email de contacto"
              value={settings.email}
              onChange={(v) => updateSettings({ email: v })}
              placeholder="info@bhelectricsolar.com"
            />
          </div>
        </SettingsCard>

        {/* Redes sociales */}
        <SettingsCard title="Redes sociales">
          <div className="flex flex-col gap-4">
            <TextField
              label="Instagram"
              value={settings.instagram}
              onChange={(v) => updateSettings({ instagram: v })}
              placeholder="https://instagram.com/tu_cuenta"
            />
            <TextField
              label="Facebook"
              value={settings.facebook}
              onChange={(v) => updateSettings({ facebook: v })}
              placeholder="https://facebook.com/tu_pagina"
            />
            <TextField
              label="LinkedIn"
              value={settings.linkedin}
              onChange={(v) => updateSettings({ linkedin: v })}
              placeholder="https://linkedin.com/company/tu_empresa"
            />
          </div>
        </SettingsCard>

        {/* Inventario */}
        <SettingsCard title="Inventario">
          <label className="block">
            <span className="text-xs font-semibold text-ink">
              Avisar cuando el stock de un producto sea igual o menor a:
            </span>
            <input
              type="number"
              min={0}
              value={settings.lowStockThreshold}
              onChange={(e) =>
                updateSettings({ lowStockThreshold: Number(e.target.value) || 0 })
              }
              className="mt-1.5 w-28 rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
            />
          </label>
        </SettingsCard>

        {/* Exportar datos */}
        <SettingsCard title="Exportar datos">
          <p className="text-xs text-body">
            Descargá una copia en CSV de lo que tenés cargado ahora mismo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ExportButton
              label="Productos"
              onClick={() =>
                downloadCSV(
                  "productos.csv",
                  PRODUCTS.map((p) => ({
                    nombre: p.name,
                    categoria:
                      CATEGORIES.find((c) => c.value === p.category)?.label ??
                      p.category,
                    precio_usd: p.priceUSD,
                    stock: p.stock,
                  })),
                )
              }
            />
            <ExportButton
              label="Clientes"
              onClick={() =>
                downloadCSV(
                  "clientes.csv",
                  CUSTOMERS.map((c) => ({
                    nombre: c.name,
                    email: c.email,
                    telefono: c.phone,
                    ciudad: c.city,
                  })),
                )
              }
            />
            <ExportButton
              label="Pedidos"
              onClick={() =>
                downloadCSV(
                  "pedidos.csv",
                  ORDERS.map((o) => ({
                    pedido: o.id,
                    cliente: o.customerName,
                    estado: o.status,
                    fecha: o.createdAt,
                  })),
                )
              }
            />
          </div>
        </SettingsCard>

        <button
          type="button"
          onClick={flashSaved}
          className="mt-6 w-full cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md sm:w-auto sm:px-8"
        >
          {saved ? "✓ Guardado" : "Listo"}
        </button>
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
      />
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
