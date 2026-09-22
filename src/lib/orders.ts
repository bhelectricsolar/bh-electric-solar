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
  // Solo para pagos en cuotas — el plan elegido en el cotizador.
  cardType?: string;
  cardKind?: "credito" | "debito";
  installments?: number;
  surchargePct?: number;
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
  // Datos que deja el cliente en el checkout de la tienda online.
  customerEmail?: string;
  customerDoc?: string;
  customerProvince?: string;
  customerAddress?: string;
  customerPostal?: string;
  shippingMethod?: "retiro" | "envio";
  shippingCostUSD?: number;
  totalUSD?: number;
  notes?: string;
  // Los pedidos hechos desde la tienda online empiezan sin pagar: hasta que
  // no se marcan como pagados no entran en los resúmenes de ventas.
  paid: boolean;
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

// Mensaje para coordinar cómo va a pagar — el pago no se hace desde la
// tienda, así que hace falta preguntarlo aparte.
export function orderPaymentMessage(order: Order, storeName: string) {
  const firstName = order.customerName.split(" ")[0];
  const total = order.totalUSD ? ` (total US$ ${Math.round(order.totalUSD)})` : "";
  return (
    `Hola ${firstName}! Te escribimos de ${storeName} por tu pedido ${order.id}${total}. ` +
    "¿Cómo te gustaría abonarlo — transferencia, tarjeta, efectivo u otra forma? Así coordinamos y avanzamos con tu pedido."
  );
}

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
  customer_email?: string | null;
  customer_doc?: string | null;
  customer_province?: string | null;
  customer_address?: string | null;
  customer_postal?: string | null;
  shipping_method?: "retiro" | "envio" | null;
  shipping_cost_usd?: number | null;
  total_usd?: number | null;
  notes?: string | null;
  paid?: boolean | null;
};

type OrderItemRow = { order_id: string; product_id: string; qty: number };
type OrderPaymentRow = {
  order_id: string;
  method: Exclude<PaymentMethod, "combinado">;
  currency: PaymentCurrency;
  amount: number;
  notes: string | null;
  card_type: string | null;
  card_kind: "credito" | "debito" | null;
  installments: number | null;
  surcharge_pct: number | null;
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
        cardType: p.card_type ?? undefined,
        cardKind: p.card_kind ?? undefined,
        installments: p.installments ?? undefined,
        surchargePct: p.surcharge_pct != null ? Number(p.surcharge_pct) : undefined,
      })),
    origin: order.origin,
    soldBy: order.sold_by,
    createdAt: order.created_at,
    customerEmail: order.customer_email ?? undefined,
    customerDoc: order.customer_doc ?? undefined,
    customerProvince: order.customer_province ?? undefined,
    customerAddress: order.customer_address ?? undefined,
    customerPostal: order.customer_postal ?? undefined,
    shippingMethod: order.shipping_method ?? undefined,
    shippingCostUSD: order.shipping_cost_usd != null ? Number(order.shipping_cost_usd) : undefined,
    totalUSD: order.total_usd != null ? Number(order.total_usd) : undefined,
    notes: order.notes ?? undefined,
    paid: order.paid !== false,
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
        card_type: p.cardType ?? null,
        card_kind: p.cardKind ?? null,
        installments: p.installments ?? null,
        surcharge_pct: p.surchargePct ?? null,
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

// Recién al marcarlo pagado un pedido de la tienda entra en los resúmenes
// de ventas (Inicio y Reportes).
export async function updateOrderPaid(id: string, paid: boolean) {
  const { error } = await supabase.from("orders").update({ paid }).eq("id", id);
  if (error) throw error;
}

export function getOrderItemsWithProduct(order: Order, products: Product[]) {
  return order.items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));
}
