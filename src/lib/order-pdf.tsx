// Comprobante de pedido (PDF real, con texto e imágenes) para que el
// cliente lo guarde en su celular o PC. Se genera en el navegador, solo se
// carga cuando hace falta.
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export type OrderPdfItem = { name: string; qty: number; priceUSD: number; image?: string };

export type OrderPdfData = {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDoc: string;
  method: "retiro" | "envio";
  address: string;
  city: string;
  province: string;
  zoneRegion?: string;
  zoneEta?: string;
  items: OrderPdfItem[];
  subtotalUSD: number;
  shippingUSD: number;
  totalUSD: number;
  exchangeRate: number;
  store: { name: string; whatsapp: string; email: string };
  logoUrl?: string;
};

const NAVY = "#0c1a38";
const NAVY2 = "#16264a";
const GOLD = "#f59a1f";
const INK = "#0c1830";
const BODY = "#56617a";
const LINE = "#dfe5f0";
const SOFT = "#f3f6fc";

const s = StyleSheet.create({
  page: { paddingBottom: 46, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  band: { backgroundColor: NAVY, paddingHorizontal: 36, paddingTop: 28, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bandStore: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  bandSub: { color: "#ffb648", fontSize: 8, marginTop: 3, letterSpacing: 1.5 },
  bandRight: { alignItems: "flex-end" },
  bandDoc: { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold" },
  bandMeta: { color: "#c6d2ea", fontSize: 8, marginTop: 3 },
  goldRule: { height: 3, backgroundColor: GOLD },
  body: { paddingHorizontal: 36, paddingTop: 18 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: LINE },
  kv: { flexDirection: "row", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: LINE },
  k: { width: 120, color: BODY },
  v: { flex: 1, fontFamily: "Helvetica-Bold" },
  th: { flexDirection: "row", backgroundColor: NAVY2, paddingVertical: 5, paddingHorizontal: 6, alignItems: "center" },
  thText: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: LINE },
  small: { fontSize: 8, color: BODY, lineHeight: 1.4 },
});

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const usd = (v: number) => `US$ ${nf0.format(v)}`;
const ars = (v: number) => `$ ${nf0.format(v)}`;

function OrderDoc({ data }: { data: OrderPdfData }) {
  const date = new Date(data.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const rate = data.exchangeRate || 1;

  return (
    <Document title={`Comprobante ${data.id}`} author={data.store.name}>
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {data.logoUrl ? <Image src={data.logoUrl} style={{ width: 40, height: 34, objectFit: "contain" }} /> : null}
            <View>
              <Text style={s.bandStore}>{data.store.name}</Text>
              <Text style={s.bandSub}>ENERGÍA SOLAR · INGENIERÍA</Text>
            </View>
          </View>
          <View style={s.bandRight}>
            <Text style={s.bandDoc}>COMPROBANTE DE PEDIDO</Text>
            <Text style={s.bandMeta}>N° {data.id} · {date}</Text>
          </View>
        </View>
        <View style={s.goldRule} />

        <View style={s.body}>
          <Text style={{ fontSize: 9, color: BODY }}>PEDIDO A NOMBRE DE</Text>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 2 }}>{data.customerName}</Text>

          <Text style={s.h2}>Datos de contacto</Text>
          <View style={s.kv}>
            <Text style={s.k}>WhatsApp / teléfono</Text>
            <Text style={s.v}>{data.customerPhone}</Text>
          </View>
          {data.customerEmail && (
            <View style={s.kv}>
              <Text style={s.k}>Email</Text>
              <Text style={s.v}>{data.customerEmail}</Text>
            </View>
          )}
          {data.customerDoc && (
            <View style={s.kv}>
              <Text style={s.k}>DNI / CUIT</Text>
              <Text style={s.v}>{data.customerDoc}</Text>
            </View>
          )}

          <Text style={s.h2}>Entrega</Text>
          <View style={s.kv}>
            <Text style={s.k}>Método</Text>
            <Text style={s.v}>{data.method === "envio" ? "Envío a domicilio" : "Retiro en el local"}</Text>
          </View>
          {data.method === "envio" ? (
            <>
              <View style={s.kv}>
                <Text style={s.k}>Dirección</Text>
                <Text style={s.v}>{[data.address, data.city, data.province].filter(Boolean).join(", ")}</Text>
              </View>
              {data.zoneRegion && (
                <View style={s.kv}>
                  <Text style={s.k}>Zona de envío</Text>
                  <Text style={s.v}>
                    {data.zoneRegion}
                    {data.zoneEta ? ` · llega en ${data.zoneEta}` : ""}
                  </Text>
                </View>
              )}
            </>
          ) : null}

          <Text style={s.h2}>Productos</Text>
          <View style={s.th}>
            <Text style={[s.thText, { width: 34 }]}></Text>
            <Text style={[s.thText, { flex: 1 }]}>Ítem</Text>
            <Text style={[s.thText, { width: 34, textAlign: "right" }]}>Cant.</Text>
            <Text style={[s.thText, { width: 76, textAlign: "right" }]}>Subtotal</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <View style={{ width: 34 }}>
                {it.image ? (
                  <Image src={it.image} style={{ width: 24, height: 24, objectFit: "contain" }} />
                ) : null}
              </View>
              <Text style={{ flex: 1 }}>{it.name}</Text>
              <Text style={{ width: 34, textAlign: "right" }}>{it.qty}</Text>
              <Text style={{ width: 76, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{usd(it.priceUSD * it.qty)}</Text>
            </View>
          ))}

          <View style={{ marginTop: 14, backgroundColor: SOFT, borderRadius: 5, padding: 12, borderWidth: 1, borderColor: LINE }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
              <Text style={{ color: BODY }}>Subtotal</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{usd(data.subtotalUSD)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
              <Text style={{ color: BODY }}>{data.method === "envio" ? "Envío" : "Retiro en el local"}</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.method === "envio" ? usd(data.shippingUSD) : "Sin costo"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: LINE }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, color: NAVY }}>Total</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, color: NAVY }}>{usd(data.totalUSD)}</Text>
                <Text style={{ fontSize: 8, color: BODY, marginTop: 1 }}>{ars(data.totalUSD * rate)} al dólar de referencia</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14, backgroundColor: "#fff7e8", borderRadius: 5, padding: 10, borderWidth: 1, borderColor: "#f0d9a8" }}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#7a5a12" }}>Pago a coordinar</Text>
            <Text style={[s.small, { marginTop: 2 }]}>
              Este pedido todavía no está pagado. Un asesor de {data.store.name} te va a contactar para coordinar la
              forma de pago
              {data.store.whatsapp ? ` (WhatsApp ${data.store.whatsapp})` : ""}.
            </Text>
          </View>

          <Text style={[s.small, { marginTop: 18 }]}>
            {data.store.name}
            {data.store.whatsapp ? ` · WhatsApp ${data.store.whatsapp}` : ""}
            {data.store.email ? ` · ${data.store.email}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function buildOrderPdf(data: OrderPdfData): Promise<Blob> {
  return pdf(<OrderDoc data={data} />).toBlob();
}
