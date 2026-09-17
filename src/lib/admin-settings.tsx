"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Currency = "USD" | "ARS";
export type ExchangeRateMode = "auto" | "manual";

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
};

const STORAGE_KEY = "bh-admin-settings";

// Dólar oficial en tiempo real — API pública argentina, sin API key.
const EXCHANGE_RATE_API = "https://dolarapi.com/v1/dolares/oficial";

type DolarApiResponse = {
  venta: number;
  fechaActualizacion: string;
};

type SettingsContextValue = {
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  formatPrice: (usdValue: number) => string;
  refreshExchangeRate: () => Promise<void>;
  exchangeRateStatus: "idle" | "loading" | "error";
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [exchangeRateStatus, setExchangeRateStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      // localStorage no disponible — se usan los valores por defecto.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore write failures
    }
  }, [settings, hydrated]);

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
      setExchangeRateStatus("idle");
    } catch {
      setExchangeRateStatus("error");
    }
  }

  // Al entrar en modo automático (o al cargar por primera vez en ese modo),
  // trae la cotización sin que el usuario tenga que hacer nada.
  useEffect(() => {
    if (!hydrated) return;
    if (settings.exchangeRateMode !== "auto") return;
    refreshExchangeRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settings.exchangeRateMode]);

  function updateSettings(patch: Partial<StoreSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
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

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, formatPrice, refreshExchangeRate, exchangeRateStatus }}
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
