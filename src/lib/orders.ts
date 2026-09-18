import { createClient } from "./supabase/client";

const supabase = createClient();
import type { Product } from "./products";
import type { StatusTone } from "@/components/admin/StatusBadge";

export type OrderStatus = "nuevo" | "en_proceso" | "enviado" | "completado";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "cheque" | "cuotas" | "combinado";
export type PaymentCurrency = "ARS" | "USD";
export type OrderOrigin = "tienda" | "manual";

// Una venta puede cobrarse con más de una forma de pago a la vez (ej: dos
// cheques distintos, o mitad efectivo mitad transferencia).
export type OrderPayment = {
  method: Exclude<PaymentMethod, "combinado">;
  currency: PaymentCurrency;
  amount: number;
  notes?: string;
};

// Los métodos que se pueden elegir para UNA línea de pago — "combinado" no
// es un método real, es lo que queda cuando hay más de una línea.
export const PAYMENT_LINE_METHODS: Exclude<PaymentMethod, "combinado">[] = [
  "efectivo",
  "transferencia",
  "tarjeta",
  "cheque",
  "cuotas",
];

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  items: { productId: string; qty: number }[];
  shippingZoneId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentCurrency: PaymentCurrency;
  amountReceived?: number;
  changeGiven?: number;
  paymentNotes?: string;
  payments: OrderPayment[];
  origin: OrderOrigin;
  soldBy: string | null;
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
  cheque: "Cheque",
  cuotas: "Cuotas",
  combinado: "Pago combinado",
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
  payment_currency: PaymentCurrency | null;
  amount_received: number | null;
  change_given: number | null;
  payment_notes: string | null;
  origin: OrderOrigin;
  sold_by: string | null;
  created_at: string;
};

type OrderItemRow = { order_id: string; product_id: string; qty: number };
type OrderPaymentRow = {
  order_id: string;
  method: Exclude<PaymentMethod, "combinado">;
  currency: PaymentCurrency;
  amount: number;
  notes: string | null;
};

function fromRows(order: OrderRow, items: OrderItemRow[], payments: OrderPaymentRow[]): Order {
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
    paymentCurrency: order.payment_currency ?? "ARS",
    amountReceived: order.amount_received != null ? Number(order.amount_received) : undefined,
    changeGiven: order.change_given != null ? Number(order.change_given) : undefined,
    paymentNotes: order.payment_notes ?? undefined,
    payments: payments
      .filter((p) => p.order_id === order.id)
      .map((p) => ({
        method: p.method,
        currency: p.currency,
        amount: Number(p.amount),
        notes: p.notes ?? undefined,
      })),
    origin: order.origin,
    soldBy: order.sold_by,
    createdAt: order.created_at,
  };
}

export async function getOrders(): Promise<Order[]> {
  const [
    { data: orders, error },
    { data: items, error: itemsError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("order_payments").select("*"),
  ]);
  if (error) throw error;
  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;
  return (orders ?? []).map((o) => fromRows(o, items ?? [], payments ?? []));
}

export async function createOrder(order: Order) {
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_city: order.customerCity,
    shipping_zone_id: order.shippingZoneId || null,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_currency: order.paymentCurrency,
    amount_received: order.amountReceived ?? null,
    change_given: order.changeGiven ?? null,
    payment_notes: order.paymentNotes ?? null,
    origin: order.origin,
    sold_by: order.soldBy,
    created_at: order.createdAt,
  });
  if (error) throw error;

  if (order.payments.length > 0) {
    const { error: paymentsError } = await supabase.from("order_payments").insert(
      order.payments.map((p) => ({
        order_id: order.id,
        method: p.method,
        currency: p.currency,
        amount: p.amount,
        notes: p.notes || null,
      })),
    );
    if (paymentsError) throw paymentsError;
  }

  if (order.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      order.items.map((i) => ({ order_id: order.id, product_id: i.productId, qty: i.qty })),
    );
    if (itemsError) throw itemsError;

    // Vender descuenta stock solo — antes había que ajustarlo a mano en
    // Stock después de cada venta.
    await Promise.all(
      order.items.map((i) =>
        supabase.rpc("decrement_product_stock", { p_id: i.productId, p_qty: i.qty }),
      ),
    );
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
