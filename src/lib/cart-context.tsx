"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./products";
import { WHATSAPP_NUMBER } from "@/components/WhatsAppFloat";
import { formatUSD } from "./currency";

export type CartItem = { product: Product; qty: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalUSD: number;
  whatsappCheckoutUrl: string;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bh-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage unavailable — cart just starts empty for this session.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write failures (private browsing, storage full, etc.)
    }
  }, [items, hydrated]);

  function addItem(product: Product, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { product, qty }];
    });
    setIsOpen(true);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== id));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalUSD = items.reduce((sum, i) => sum + i.qty * i.product.priceUSD, 0);

  const whatsappCheckoutUrl = buildWhatsappCheckoutUrl(items, totalUSD);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        totalItems,
        totalUSD,
        whatsappCheckoutUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function buildSingleItemWhatsappUrl(product: Product, qty: number) {
  const message =
    `Hola BH Electric Solar, quiero comprar:\n\n` +
    `• ${product.name} x${qty} — ${formatUSD(product.priceUSD * qty)}\n\n` +
    "¿Podrían confirmarme disponibilidad y coordinar el pago y el envío?";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildWhatsappCheckoutUrl(items: CartItem[], totalUSD: number) {
  if (items.length === 0) {
    return `https://wa.me/${WHATSAPP_NUMBER}`;
  }
  const lines = items.map(
    (i) => `• ${i.product.name} x${i.qty} — ${formatUSD(i.product.priceUSD * i.qty)}`,
  );
  const message =
    "Hola BH Electric Solar, quiero hacer un pedido:\n\n" +
    lines.join("\n") +
    `\n\nTotal estimado: ${formatUSD(totalUSD)}\n\n` +
    "¿Podrían confirmarme disponibilidad y coordinar el pago y el envío?";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
