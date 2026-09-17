import { supabase } from "./supabase";
import type { Product } from "./products";
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

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_city: string | null;
  shipping_zone_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  origin: OrderOrigin;
  created_at: string;
};

type OrderItemRow = { order_id: string; product_id: string; qty: number };

function fromRows(order: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone ?? "",
    customerCity: order.customer_city ?? "",
    items: items
      .filter((i) => i.order_id === order.id)
      .map((i) => ({ productId: i.product_id, qty: i.qty })),
    shippingZoneId: order.shipping_zone_id ?? "",
    status: order.status,
    paymentMethod: order.payment_method,
    origin: order.origin,
    createdAt: order.created_at,
  };
}

export async function getOrders(): Promise<Order[]> {
  const [{ data: orders, error }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
  ]);
  if (error) throw error;
  if (itemsError) throw itemsError;
  return (orders ?? []).map((o) => fromRows(o, items ?? []));
}

export async function createOrder(order: Order) {
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_city: order.customerCity,
    shipping_zone_id: order.shippingZoneId,
    status: order.status,
    payment_method: order.paymentMethod,
    origin: order.origin,
    created_at: order.createdAt,
  });
  if (error) throw error;

  if (order.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      order.items.map((i) => ({ order_id: order.id, product_id: i.productId, qty: i.qty })),
    );
    if (itemsError) throw itemsError;
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export function getOrderItemsWithProduct(order: Order, products: Product[]) {
  return order.items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));
}
