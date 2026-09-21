"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "./supabase/client";
import { DEFAULT_HSP, DEFAULT_INSTALL_COST_PER_WP, type SolarComponent } from "./solar-quote";

const supabase = createClient();

export type Currency = "USD" | "ARS";
export type ExchangeRateMode = "auto" | "manual";

export type CardType = "Visa" | "Mastercard" | "American Express" | "Cabal" | "Naranja X" | "Otra";
export type CardKind = "credito" | "debito";
export const CARD_TYPES: CardType[] = ["Visa", "Mastercard", "American Express", "Cabal", "Naranja X", "Otra"];

// Plan de cuotas configurable por tarjeta — lo arma el dueño acá y se usa
// como cotizador en Caja → Registrar venta.
export type InstallmentPlan = {
  id: string;
  cardType: CardType;
  cardKind: CardKind;
  installments: number;
  surchargePct: number;
  label?: string;
};

export type StoreSettings = {
  storeName: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  currency: Currency;
  exchangeRate: number; // pesos argentinos por 1 USD
  exchangeRateMode: ExchangeRateMode;
  exchangeRateUpdatedAt: string | null;
  lowStockThreshold: number;
  installmentPlans: InstallmentPlan[];
  hspTable: Record<string, number>; // horas sol pico por provincia (cotizador solar)
  installCostPerWp: number; // USD por Wp instalado (cotizador solar)
  solarComponents: SolarComponent[]; // equipos y precios manuales (cotizador solar)
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "BH Electric Solar",
  whatsapp: "+54 9 3754 419198",
  email: "info@bhelectricsolar.com",
  instagram: "https://www.instagram.com/bheletricsolutions/",
  facebook: "",
  linkedin: "",
  currency: "USD",
  exchangeRate: 1450,
  exchangeRateMode: "auto",
  exchangeRateUpdatedAt: null,
  lowStockThreshold: 8,
  installmentPlans: [],
  hspTable: DEFAULT_HSP,
  installCostPerWp: DEFAULT_INSTALL_COST_PER_WP,
  solarComponents: [],
};

// Dólar blue (precio de venta) en tiempo real — API pública argentina, sin
// API key. Es el que se usa acá, no el oficial.
const EXCHANGE_RATE_API = "https://dolarapi.com/v1/dolares/blue";

type DolarApiResponse = {
  venta: number;
  fechaActualizacion: string;
};

type SettingsRow = {
  store_name: string;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  currency: Currency;
  exchange_rate: number;
  exchange_rate_mode: ExchangeRateMode;
  low_stock_threshold: number;
  installment_plans: InstallmentPlan[] | null;
  hsp_table: Record<string, number> | null;
  install_cost_per_wp: number | null;
  solar_components: SolarComponent[] | null;
};

function fromRow(row: SettingsRow): StoreSettings {
  return {
    storeName: row.store_name,
    whatsapp: row.whatsapp ?? "",
    email: row.email ?? "",
    instagram: row.instagram ?? "",
    facebook: row.facebook ?? "",
    linkedin: row.linkedin ?? "",
    currency: row.currency,
    exchangeRate: Number(row.exchange_rate),
    exchangeRateMode: row.exchange_rate_mode,
    exchangeRateUpdatedAt: null,
    lowStockThreshold: row.low_stock_threshold,
    installmentPlans: row.installment_plans ?? [],
    hspTable: { ...DEFAULT_HSP, ...(row.hsp_table ?? {}) },
    installCostPerWp:
      row.install_cost_per_wp != null ? Number(row.install_cost_per_wp) : DEFAULT_INSTALL_COST_PER_WP,
    solarComponents: row.solar_components ?? [],
  };
}

function toRow(patch: Partial<StoreSettings>) {
  const row: Record<string, unknown> = {};
  if (patch.storeName !== undefined) row.store_name = patch.storeName;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.instagram !== undefined) row.instagram = patch.instagram;
  if (patch.facebook !== undefined) row.facebook = patch.facebook;
  if (patch.linkedin !== undefined) row.linkedin = patch.linkedin;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.exchangeRate !== undefined) row.exchange_rate = patch.exchangeRate;
  if (patch.exchangeRateMode !== undefined) row.exchange_rate_mode = patch.exchangeRateMode;
  if (patch.lowStockThreshold !== undefined) row.low_stock_threshold = patch.lowStockThreshold;
  if (patch.installmentPlans !== undefined) row.installment_plans = patch.installmentPlans;
  if (patch.hspTable !== undefined) row.hsp_table = patch.hspTable;
  if (patch.installCostPerWp !== undefined) row.install_cost_per_wp = patch.installCostPerWp;
  if (patch.solarComponents !== undefined) row.solar_components = patch.solarComponents;
  return row;
}

type SettingsContextValue = {
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  formatPrice: (usdValue: number) => string;
  formatProductPrice: (product: { priceUSD: number; priceARS?: number }) => string;
  refreshExchangeRate: () => Promise<void>;
  exchangeRateStatus: "idle" | "loading" | "error";
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [exchangeRateStatus, setExchangeRateStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(fromRow(data as SettingsRow));
        setLoaded(true);
      });
  }, []);

  async function refreshExchangeRate() {
    setExchangeRateStatus("loading");
    try {
      const res = await fetch(EXCHANGE_RATE_API, { cache: "no-store" });
      if (!res.ok) throw new Error("respuesta no válida");
      const data: DolarApiResponse = await res.json();
      if (!data.venta) throw new Error("sin valor de venta");
      setSettings((prev) => ({
        ...prev,
        exchangeRate: data.venta,
        exchangeRateUpdatedAt: data.fechaActualizacion ?? new Date().toISOString(),
      }));
      await supabase.from("store_settings").update({ exchange_rate: data.venta }).eq("id", 1);
      setExchangeRateStatus("idle");
    } catch {
      setExchangeRateStatus("error");
    }
  }

  // Al entrar en modo automático (o al cargar por primera vez en ese modo),
  // trae la cotización sin que el usuario tenga que hacer nada.
  useEffect(() => {
    if (!loaded) return;
    if (settings.exchangeRateMode !== "auto") return;
    refreshExchangeRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.exchangeRateMode]);

  async function updateSettings(patch: Partial<StoreSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
    // El builder de Supabase es "thenable" — si nadie lo espera, el fetch
    // nunca sale y el cambio queda solo en la pantalla, sin guardarse.
    const { error } = await supabase.from("store_settings").update(toRow(patch)).eq("id", 1);
    if (error) console.error("updateSettings:", error);
  }

  function formatPrice(usdValue: number) {
    if (settings.currency === "ARS") {
      const ars = usdValue * settings.exchangeRate;
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(ars);
    }
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(usdValue);
  }

  // Si el producto tiene un precio fijo en pesos cargado, se usa ese en vez
  // de convertir el dólar — para productos que se venden a un ARS fijo.
  function formatProductPrice(product: { priceUSD: number; priceARS?: number }) {
    if (settings.currency === "ARS" && product.priceARS != null) {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(product.priceARS);
    }
    return formatPrice(product.priceUSD);
  }

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, formatPrice, formatProductPrice, refreshExchangeRate, exchangeRateStatus }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useAdminSettings debe usarse dentro de <AdminSettingsProvider>");
  return ctx;
}
