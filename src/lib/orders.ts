import { PRODUCTS } from "./products";
import type { StatusTone } from "@/components/admin/StatusBadge";

export type OrderStatus = "nuevo" | "en_proceso" | "enviado" | "completado";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";
export type OrderOrigin = "tienda" | "manual";

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  items: { productId: string; qty: number }[];
  shippingZoneId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  origin: OrderOrigin;
  createdAt: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  enviado: "Enviado",
  completado: "Completado",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  nuevo: "gold",
  en_proceso: "negocio",
  enviado: "negocio",
  completado: "done",
};

export const ORDER_ORIGIN_LABELS: Record<OrderOrigin, string> = {
  tienda: "Pedido de la tienda",
  manual: "Cargado en el admin",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export function orderStatusMessage(order: Order, storeName: string) {
  const firstName = order.customerName.split(" ")[0];
  switch (order.status) {
    case "nuevo":
      return `Hola ${firstName}! Te escribimos de ${storeName} por tu pedido ${order.id}. Ya lo tenemos registrado y lo estamos preparando.`;
    case "en_proceso":
      return `Hola ${firstName}! Tu pedido ${order.id} está en preparación. Te avisamos apenas esté listo para el envío.`;
    case "enviado":
      return `Hola ${firstName}! Tu pedido ${order.id} ya está en camino a ${order.customerCity}. ¡Gracias por tu compra!`;
    case "completado":
      return `Hola ${firstName}! Tu pedido ${order.id} fue entregado. Cualquier consulta sobre tus productos, escribinos por acá.`;
    default:
      return `Hola ${firstName}! Te escribimos de ${storeName} por tu pedido ${order.id}.`;
  }
}

// Datos de ejemplo — se reemplazan por los pedidos reales que lleguen
// desde la tienda (WhatsApp) una vez conectada a Supabase.
export const ORDERS: Order[] = [
  {
    id: "P-1001",
    customerName: "Cliente de ejemplo 4",
    customerPhone: "+54 9 3754 000004",
    customerCity: "Puerto Iguazú, Misiones",
    items: [
      { productId: "panel-550w", qty: 6 },
      { productId: "inversor-hibrido-5kw", qty: 1 },
    ],
    shippingZoneId: "nea",
    status: "en_proceso",
    paymentMethod: "transferencia",
    origin: "tienda",
    createdAt: "2026-09-10",
  },
  {
    id: "P-1002",
    customerName: "Cliente de ejemplo 1",
    customerPhone: "+54 9 3754 000001",
    customerCity: "Posadas, Misiones",
    items: [{ productId: "bateria-litio-5kwh", qty: 1 }],
    shippingZoneId: "nea",
    status: "completado",
    paymentMethod: "efectivo",
    origin: "tienda",
    createdAt: "2026-08-20",
  },
  {
    id: "P-1003",
    customerName: "Cliente de ejemplo 3",
    customerPhone: "+54 9 3755 000003",
    customerCity: "Oberá, Misiones",
    items: [
      { productId: "conectores-mc4", qty: 4 },
      { productId: "cable-solar-6mm", qty: 1 },
    ],
    shippingZoneId: "nea",
    status: "nuevo",
    paymentMethod: "efectivo",
    origin: "tienda",
    createdAt: "2026-09-11",
  },
  {
    id: "P-1004",
    customerName: "Cliente de ejemplo 2",
    customerPhone: "+54 9 3754 000002",
    customerCity: "Eldorado, Misiones",
    items: [{ productId: "panel-450w", qty: 4 }],
    shippingZoneId: "nea",
    status: "completado",
    paymentMethod: "efectivo",
    origin: "manual",
    createdAt: "2026-09-14",
  },
];

export function getOrderItemsWithProduct(order: Order) {
  return order.items.map((item) => ({
    ...item,
    product: PRODUCTS.find((p) => p.id === item.productId),
  }));
}
