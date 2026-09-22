import type { Order, OrderPayment, OrderStatus, PaymentCurrency, PaymentMethod } from "./orders";
import type { Product } from "./products";
import type { ShippingZone } from "./shipping";
import type { TeamMember } from "./team";
import type { CashSession } from "./caja";

export type Range = "hoy" | "semana" | "mes" | "todo";
export type Channel = "tienda" | "local";

export const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "7 días" },
  { value: "mes", label: "30 días" },
  { value: "todo", label: "Todo" },
];

export function rangeBounds(range: Range) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (range === "hoy") {
    const prevFrom = new Date(startOfToday);
    prevFrom.setDate(prevFrom.getDate() - 1);
    return { from: startOfToday, prevFrom, prevTo: startOfToday };
  }
  if (range === "semana" || range === "mes") {
    const days = range === "semana" ? 7 : 30;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);
    return { from, prevFrom, prevTo: from };
  }
  return { from: null, prevFrom: null, prevTo: null };
}

export type MethodRow = {
  key: string;
  method: Exclude<PaymentMethod, "combinado">;
  currency: PaymentCurrency;
  amount: number;
  amountARS: number;
  count: number;
  byChannel: Record<Channel, number>;
};

export type InstallmentRow = {
  key: string;
  label: string;
  installments: number | null;
  surchargePct: number | null;
  count: number;
  baseARS: number;
  withSurchargeARS: number;
};

export type ChequeRow = {
  orderId: string;
  date: string;
  customer: string;
  amountARS: number;
  currency: PaymentCurrency;
  amount: number;
  notes: string;
};

export type ChannelSummary = {
  orders: number;
  productsUSD: number;
  shippingUSD: number;
  totalUSD: number;
  marginUSD: number;
  avgTicketUSD: number;
  byStatus: Record<OrderStatus, number>;
  combined: number;
};

export type SellerRow = { id: string; name: string; orders: number; totalUSD: number };
export type ProductRow = { id: string; name: string; units: number; revenueUSD: number };

export type CashRow = {
  sessionId: string;
  name: string;
  openedAt: string;
  opening: number;
  ingresos: number;
  egresos: number;
  cashSales: number;
  expected: number;
};

export function computeStats(input: {
  orders: Order[];
  prevOrders: Order[];
  products: Product[];
  zones: ShippingZone[];
  team: TeamMember[];
  openSessions: CashSession[];
  closedSessions: CashSession[];
  exchangeRate: number;
}) {
  const { products, zones, team, openSessions, closedSessions, exchangeRate } = input;
  // Un pedido de la tienda sin pagar todavía no es una venta: se excluye de
  // todos los resúmenes hasta que alguien lo marque como pagado.
  const orders = input.orders.filter((o) => o.paid !== false);
  const prevOrders = input.prevOrders.filter((o) => o.paid !== false);

  const productById = new Map(products.map((p) => [p.id, p]));
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const toARS = (amount: number, currency: PaymentCurrency) =>
    currency === "USD" ? amount * exchangeRate : amount;

  const channelOf = (o: Order): Channel => (o.origin === "tienda" ? "tienda" : "local");
  const productsUSD = (o: Order) =>
    o.items.reduce((s, i) => s + (productById.get(i.productId)?.priceUSD ?? 0) * i.qty, 0);
  const shippingUSD = (o: Order) => zoneById.get(o.shippingZoneId)?.priceUSD ?? 0;
  const costUSD = (o: Order) =>
    o.items.reduce((s, i) => s + (productById.get(i.productId)?.costUSD ?? 0) * i.qty, 0);

  // Las ventas viejas o de la tienda no tienen líneas de pago: se arma una
  // sola línea con el método guardado en la venta.
  const effectivePayments = (o: Order): OrderPayment[] => {
    if (o.payments.length > 0) return o.payments;
    const total = productsUSD(o) + shippingUSD(o);
    const method = o.paymentMethod === "combinado" ? "efectivo" : o.paymentMethod;
    return [
      {
        method,
        currency: o.paymentCurrency,
        amount: o.paymentCurrency === "USD" ? total : total * exchangeRate,
        notes: o.paymentNotes,
      },
    ];
  };

  const emptyStatus = (): Record<OrderStatus, number> => ({ nuevo: 0, en_proceso: 0, enviado: 0, completado: 0 });
  const summarize = (list: Order[]): ChannelSummary => {
    const s: ChannelSummary = {
      orders: list.length,
      productsUSD: 0,
      shippingUSD: 0,
      totalUSD: 0,
      marginUSD: 0,
      avgTicketUSD: 0,
      byStatus: emptyStatus(),
      combined: 0,
    };
    list.forEach((o) => {
      const p = productsUSD(o);
      s.productsUSD += p;
      s.shippingUSD += shippingUSD(o);
      s.marginUSD += p - costUSD(o);
      s.byStatus[o.status] += 1;
      if (o.payments.length > 1) s.combined += 1;
    });
    s.totalUSD = s.productsUSD + s.shippingUSD;
    s.avgTicketUSD = list.length > 0 ? s.totalUSD / list.length : 0;
    return s;
  };

  const all = summarize(orders);
  const tienda = summarize(orders.filter((o) => channelOf(o) === "tienda"));
  const local = summarize(orders.filter((o) => channelOf(o) === "local"));
  const prevTotalUSD = summarize(prevOrders).totalUSD;

  const methodMap = new Map<string, MethodRow>();
  const installmentMap = new Map<string, InstallmentRow>();
  const cheques: ChequeRow[] = [];
  orders.forEach((o) => {
    const ch = channelOf(o);
    effectivePayments(o).forEach((p) => {
      const key = `${p.method}-${p.currency}`;
      const row =
        methodMap.get(key) ??
        ({
          key,
          method: p.method,
          currency: p.currency,
          amount: 0,
          amountARS: 0,
          count: 0,
          byChannel: { tienda: 0, local: 0 },
        } as MethodRow);
      row.amount += p.amount;
      row.amountARS += toARS(p.amount, p.currency);
      row.count += 1;
      row.byChannel[ch] += toARS(p.amount, p.currency);
      methodMap.set(key, row);

      if (p.method === "cuotas") {
        const label = p.cardType
          ? `${p.cardType} ${p.cardKind === "debito" ? "Débito" : "Crédito"}`
          : (p.notes?.split(" · ")[0] ?? "Sin plan registrado");
        const ikey = `${label}|${p.installments ?? ""}|${p.surchargePct ?? ""}`;
        const irow =
          installmentMap.get(ikey) ??
          ({
            key: ikey,
            label,
            installments: p.installments ?? null,
            surchargePct: p.surchargePct ?? null,
            count: 0,
            baseARS: 0,
            withSurchargeARS: 0,
          } as InstallmentRow);
        const base = toARS(p.amount, p.currency);
        irow.count += 1;
        irow.baseARS += base;
        irow.withSurchargeARS += base * (1 + (p.surchargePct ?? 0) / 100);
        installmentMap.set(ikey, irow);
      }

      if (p.method === "cheque") {
        cheques.push({
          orderId: o.id,
          date: o.createdAt,
          customer: o.customerName,
          amountARS: toARS(p.amount, p.currency),
          currency: p.currency,
          amount: p.amount,
          notes: p.notes ?? "",
        });
      }
    });
  });
  const methods = [...methodMap.values()].sort((a, b) => b.amountARS - a.amountARS);
  const installments = [...installmentMap.values()].sort((a, b) => b.baseARS - a.baseARS);
  cheques.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const collectedARS = methods.reduce((s, m) => s + m.amountARS, 0);

  const sellerMap = new Map<string, SellerRow>();
  orders.forEach((o) => {
    const id = o.soldBy ?? "none";
    const name = o.soldBy ? (team.find((m) => m.id === o.soldBy)?.name ?? "Vendedor eliminado") : "Sin vendedor (tienda online)";
    const row = sellerMap.get(id) ?? { id, name, orders: 0, totalUSD: 0 };
    row.orders += 1;
    row.totalUSD += productsUSD(o) + shippingUSD(o);
    sellerMap.set(id, row);
  });
  const sellers = [...sellerMap.values()].sort((a, b) => b.totalUSD - a.totalUSD);

  const productMap = new Map<string, ProductRow>();
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const p = productById.get(i.productId);
      if (!p) return;
      const row = productMap.get(p.id) ?? { id: p.id, name: p.name, units: 0, revenueUSD: 0 };
      row.units += i.qty;
      row.revenueUSD += p.priceUSD * i.qty;
      productMap.set(p.id, row);
    }),
  );
  const topProducts = [...productMap.values()].sort((a, b) => b.units - a.units).slice(0, 6);

  const today = new Date().toDateString();
  const cashRows: CashRow[] = openSessions.map((s) => {
    const ingresos = s.movements.filter((m) => m.type === "ingreso").reduce((x, m) => x + m.amount, 0);
    const egresos = s.movements.filter((m) => m.type === "egreso").reduce((x, m) => x + m.amount, 0);
    const cashSales = orders
      .filter((o) => o.soldBy === s.openedBy && new Date(o.createdAt).toDateString() === today)
      .reduce(
        (sum, o) =>
          sum +
          effectivePayments(o)
            .filter((p) => p.method === "efectivo")
            .reduce((x, p) => x + toARS(p.amount, p.currency), 0),
        0,
      );
    return {
      sessionId: s.id,
      name: team.find((m) => m.id === s.openedBy)?.name ?? "—",
      openedAt: s.openedAt,
      opening: s.openingAmount,
      ingresos,
      egresos,
      cashSales,
      expected: s.openingAmount + cashSales + ingresos - egresos,
    };
  });

  const closes = {
    count: closedSessions.length,
    difference: closedSessions.reduce((s, c) => s + ((c.countedAmount ?? 0) - (c.expectedAmount ?? 0)), 0),
  };

  const inventory = {
    units: products.reduce((s, p) => s + p.stock, 0),
    costValueUSD: products.reduce((s, p) => s + p.stock * (p.costUSD ?? 0), 0),
    saleValueUSD: products.reduce((s, p) => s + p.stock * p.priceUSD, 0),
  };

  return {
    all,
    tienda,
    local,
    prevTotalUSD,
    methods,
    installments,
    cheques,
    collectedARS,
    sellers,
    topProducts,
    cashRows,
    closes,
    inventory,
  };
}
