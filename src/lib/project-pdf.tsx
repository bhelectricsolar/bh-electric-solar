// PDF del proyecto (documento real, con texto y gráfico vectorial) para
// imprimir o compartir con el cliente. Se carga solo al tocar el botón.
import { Document, G, Image, Line, Page, Rect, StyleSheet, Svg, Text, View, pdf } from "@react-pdf/renderer";
import type { Project } from "./projects";
import { PROJECT_STAGES } from "./projects";
import type { SolarQuote } from "./solar-quotes";
import { historyCoverage, summarizeHistory } from "./solar-quote";

export type ProjectPdfData = {
  project: Project;
  quote?: SolarQuote;
  store: { name: string; whatsapp: string; email: string };
  exchangeRate: number;
  salesperson: string;
  technician: string;
  logoUrl?: string; // URL del emblema (misma web), para el encabezado
};

const NAVY = "#0c1a38";
const NAVY2 = "#16264a";
const GOLD = "#f59a1f";
const BLUE = "#1f5fe6";
const GREEN = "#1a9a5c";
const INK = "#0c1830";
const BODY = "#56617a";
const LINE = "#dfe5f0";
const SOFT = "#f3f6fc";

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 46, paddingHorizontal: 0, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  band: { backgroundColor: NAVY, paddingHorizontal: 36, paddingTop: 28, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between" },
  bandStore: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  bandSub: { color: "#ffb648", fontSize: 8, marginTop: 3, letterSpacing: 1.5 },
  bandRight: { alignItems: "flex-end" },
  bandDoc: { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold" },
  bandMeta: { color: "#c6d2ea", fontSize: 8, marginTop: 3 },
  goldRule: { height: 3, backgroundColor: GOLD },
  body: { paddingHorizontal: 36, paddingTop: 16 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: LINE },
  row: { flexDirection: "row", gap: 8 },
  card: { flex: 1, backgroundColor: SOFT, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: LINE },
  cardLabel: { fontSize: 7, color: BODY, letterSpacing: 0.8 },
  cardValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 3 },
  cardSub: { fontSize: 7.5, color: BODY, marginTop: 2 },
  kv: { flexDirection: "row", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: LINE },
  k: { width: 110, color: BODY },
  v: { flex: 1, fontFamily: "Helvetica-Bold" },
  th: { flexDirection: "row", backgroundColor: NAVY2, paddingVertical: 4, paddingHorizontal: 6 },
  thText: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: LINE },
  total: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: SOFT },
  para: { lineHeight: 1.45, color: INK },
  small: { fontSize: 8, color: BODY, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 16, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: BODY, borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6 },
  stageRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
});

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const usd = (v: number) => `US$ ${nf0.format(v)}`;
const ars = (v: number) => `$ ${nf0.format(v)}`;

const SYSTEM_TEXT = { ongrid: "On-grid (conectado a la red)", hibrido: "Híbrido (red + baterías)", offgrid: "Off-grid (aislado con baterías)" } as const;

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label.toUpperCase()}</Text>
      <Text style={s.cardValue}>{value}</Text>
      {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.k}>{k}</Text>
      <Text style={s.v}>{v}</Text>
    </View>
  );
}

function HistoryChart({ rows, avg, prod }: { rows: { label: string; monthlyKwh: number }[]; avg: number; prod: number }) {
  const W = 500;
  const H = 170;
  const padL = 6;
  const padB = 22;
  const padT = 14;
  const top = Math.max(...rows.map((r) => r.monthlyKwh), prod, avg) * 1.1;
  const plotH = H - padB - padT;
  const gap = 4;
  const bw = (W - padL * 2 - gap * (rows.length - 1)) / rows.length;
  const max = Math.max(...rows.map((r) => r.monthlyKwh));
  const min = Math.min(...rows.map((r) => r.monthlyKwh));
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={padL} y1={padT + plotH} x2={W - padL} y2={padT + plotH} stroke={LINE} strokeWidth={1} />
      {rows.map((r, i) => {
        const x = padL + i * (bw + gap);
        const h = (r.monthlyKwh / top) * plotH;
        const color = r.monthlyKwh === max ? GOLD : r.monthlyKwh === min ? GREEN : r.monthlyKwh > avg ? BLUE : "#8aa9ee";
        return (
          <G key={i}>
            <Rect x={x} y={padT + plotH - h} width={bw} height={h} fill={color} />
            <Text x={x + bw / 2 - 8} y={padT + plotH - h - 3} style={{ fontSize: 6.5 }} fill={INK}>
              {nf0.format(r.monthlyKwh)}
            </Text>
            <Text x={x + bw / 2 - 9} y={H - 8} style={{ fontSize: 6.5 }} fill={BODY}>
              {r.label}
            </Text>
          </G>
        );
      })}
      <Line x1={padL} y1={y(avg)} x2={W - padL} y2={y(avg)} stroke="#555c70" strokeWidth={1} strokeDasharray="4 3" />
      {prod > 0 ? <Line x1={padL} y1={y(prod)} x2={W - padL} y2={y(prod)} stroke={GOLD} strokeWidth={1.4} /> : null}
    </Svg>
  );
}

function ProjectDoc({ data }: { data: ProjectPdfData }) {
  const { project, quote, store, exchangeRate, salesperson, technician } = data;
  const rate = quote?.inputs.exchangeRate ?? exchangeRate ?? 1450;
  const r = quote?.results;
  const stats = summarizeHistory(quote?.inputs.history);
  const price = quote?.inputs.pricePerKwh ?? 0;
  const cov = stats && r ? historyCoverage(stats, r.monthlyProduction, price) : null;
  const bom = (r?.bom ?? []).filter((l) => l.included);
  const budget = project.budgetUSD ?? quote?.costUSD ?? null;
  const stage = PROJECT_STAGES.find((st) => st.value === project.status);
  const stageIdx = PROJECT_STAGES.findIndex((st) => st.value === project.status);
  const date = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const code = project.id.slice(0, 8).toUpperCase();

  const header = (
    <View fixed>
      <View style={s.band}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {data.logoUrl ? <Image src={data.logoUrl} style={{ width: 40, height: 34, objectFit: "contain" }} /> : null}
          <View>
            <Text style={s.bandStore}>{store.name}</Text>
            <Text style={s.bandSub}>ENERGÍA SOLAR · INGENIERÍA</Text>
          </View>
        </View>
        <View style={s.bandRight}>
          <Text style={s.bandDoc}>PROYECTO SOLAR</Text>
          <Text style={s.bandMeta}>N° {code} · {date}</Text>
        </View>
      </View>
      <View style={s.goldRule} />
    </View>
  );
  const footer = (
    <View style={s.footer} fixed>
      <Text>
        {store.name}
        {store.whatsapp ? ` · WhatsApp ${store.whatsapp}` : ""}
        {store.email ? ` · ${store.email}` : ""}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`Proyecto solar - ${project.customerName}`} author={store.name}>
      <Page size="A4" style={s.page}>
        {header}
        <View style={s.body}>
          <Text style={{ fontSize: 9, color: BODY }}>PREPARADO PARA</Text>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 2 }}>{project.customerName}</Text>
          <Text style={{ fontSize: 9, color: BODY, marginTop: 2 }}>
            {[project.city, project.zone].filter(Boolean).join(" · ")}
            {project.customerPhone ? `  ·  Tel. ${project.customerPhone}` : ""}
          </Text>

          {project.description ? (
            <>
              <Text style={s.h2}>Descripción del proyecto</Text>
              <Text style={s.para}>{project.description}</Text>
            </>
          ) : null}

          <Text style={s.h2}>Resumen del sistema</Text>
          <View style={s.row}>
            <Kpi label="Potencia" value={`${nf1.format(project.systemKwp)} kWp`} sub={`${project.panelsCount} paneles`} />
            <Kpi label="Producción" value={r ? `${nf0.format(r.monthlyProduction)} kWh` : "—"} sub="por mes (estimada)" />
            <Kpi label="Cobertura" value={r ? `${nf0.format(r.realCoveragePct)} %` : "—"} sub="del consumo" />
          </View>
          {r ? (
            <View style={[s.row, { marginTop: 8 }]}>
              <Kpi label="Ahorro mensual" value={ars(r.monthlySavingsARS)} sub={usd(r.monthlySavingsARS / rate)} />
              <Kpi label="Ahorro anual" value={ars(r.monthlySavingsARS * 12)} sub={usd((r.monthlySavingsARS * 12) / rate)} />
              <Kpi label="Retorno de la inversión" value={r.paybackYears != null ? `${nf1.format(r.paybackYears)} años` : "—"} sub="estimado" />
            </View>
          ) : null}

          {budget ? (
            <View style={{ marginTop: 12, backgroundColor: NAVY, borderRadius: 5, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: "#ffb648", fontSize: 8, letterSpacing: 1.2 }}>PRESUPUESTO TOTAL</Text>
                <Text style={{ color: "#c6d2ea", fontSize: 8, marginTop: 3 }}>Dólar de referencia: {ars(rate)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: "Helvetica-Bold" }}>{usd(budget)}</Text>
                <Text style={{ color: "#c6d2ea", fontSize: 10, marginTop: 2 }}>{ars(budget * rate)}</Text>
              </View>
            </View>
          ) : null}

          {r ? (
            <>
              <Text style={s.h2}>Sistema propuesto</Text>
              <KV k="Tipo de sistema" v={SYSTEM_TEXT[r.systemType ?? "ongrid"]} />
              <KV k="Paneles" v={`${project.panelsCount} × ${quote?.inputs.panelW ?? ""} W = ${nf1.format(project.systemKwp)} kWp`} />
              {r.inverterKw ? <KV k="Inversor" v={`${r.inverterKw} kW`} /> : null}
              {r.batteryKwh ? <KV k="Almacenamiento" v={`${nf1.format(r.batteryKwh)} kWh en baterías`} /> : null}
              <KV k="Ubicación / radiación" v={`${quote?.province ?? project.zone} · ${quote?.inputs.hsp ?? "—"} horas sol pico`} />
              {r.systemReason ? <Text style={[s.small, { marginTop: 4 }]}>{r.systemReason}</Text> : null}
            </>
          ) : null}
        </View>
        {footer}
      </Page>

      {(bom.length > 0 || stats) && (
        <Page size="A4" style={s.page}>
          {header}
          <View style={s.body}>
            {bom.length > 0 && (
              <>
                <Text style={s.h2}>Equipos y materiales</Text>
                <View style={s.th}>
                  <Text style={[s.thText, { flex: 1 }]}>Ítem</Text>
                  <Text style={[s.thText, { width: 34, textAlign: "right" }]}>Cant.</Text>
                  <Text style={[s.thText, { width: 70, textAlign: "right" }]}>Precio</Text>
                  <Text style={[s.thText, { width: 76, textAlign: "right" }]}>Subtotal</Text>
                </View>
                {bom.map((l) => (
                  <View key={l.id} style={s.tr} wrap={false}>
                    <Text style={{ flex: 1 }}>{l.name}</Text>
                    <Text style={{ width: 34, textAlign: "right" }}>{l.qty}</Text>
                    <Text style={{ width: 70, textAlign: "right", color: BODY }}>{usd(l.unitPriceUSD)}</Text>
                    <Text style={{ width: 76, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{usd(l.qty * l.unitPriceUSD)}</Text>
                  </View>
                ))}
                <View style={s.total}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    Total {usd(quote?.costUSD ?? 0)}  ({ars((quote?.costUSD ?? 0) * rate)})
                  </Text>
                </View>
              </>
            )}

            {stats && r && (
              <>
                <Text style={s.h2}>Historial de consumo</Text>
                <Text style={[s.small, { marginBottom: 6 }]}>
                  {stats.periods} períodos de la factura de luz, de {stats.rows[0].label} a {stats.rows[stats.rows.length - 1].label}. Valores en kWh por mes.
                </Text>
                <HistoryChart rows={stats.rows} avg={stats.avgMonthlyKwh} prod={r.monthlyProduction} />
                <View style={{ flexDirection: "row", gap: 14, marginTop: 4, marginBottom: 8 }}>
                  <Text style={s.small}>--- Promedio {nf0.format(stats.avgMonthlyKwh)} kWh</Text>
                  <Text style={[s.small, { color: GOLD }]}>— Producción del sistema {nf0.format(r.monthlyProduction)} kWh/mes</Text>
                  <Text style={[s.small, { color: GOLD }]}>Máximo</Text>
                  <Text style={[s.small, { color: GREEN }]}>Mínimo</Text>
                </View>
                <View style={s.row}>
                  <Kpi label="Promedio mensual" value={`${nf0.format(stats.avgMonthlyKwh)} kWh`} sub={`${ars(stats.avgMonthlyKwh * price)} · ${usd((stats.avgMonthlyKwh * price) / rate)}`} />
                  <Kpi label={`Máximo (${stats.maxLabel})`} value={`${nf0.format(stats.maxMonthlyKwh)} kWh`} sub={ars(stats.maxMonthlyKwh * price)} />
                  <Kpi label={`Mínimo (${stats.minLabel})`} value={`${nf0.format(stats.minMonthlyKwh)} kWh`} sub={ars(stats.minMonthlyKwh * price)} />
                  <Kpi label="Consumo anual" value={`${nf0.format(stats.avgMonthlyKwh * 12)} kWh`} sub={`${ars(stats.avgMonthlyKwh * 12 * price)} / año`} />
                </View>
                {cov && (
                  <View style={[s.row, { marginTop: 8 }]}>
                    <Kpi label="Cobertura del historial" value={`${nf0.format(cov.annualCoveragePct)} %`} sub="lo cubre el sistema" />
                    <Kpi label="Ahorro mensual promedio" value={ars(cov.avgMonthlySavingsARS)} sub={usd(cov.avgMonthlySavingsARS / rate)} />
                    <Kpi label="Meses con excedente" value={`${cov.surplusPeriods} de ${stats.periods}`} sub="produce más de lo que consume" />
                  </View>
                )}
              </>
            )}
          </View>
          {footer}
        </Page>
      )}

      <Page size="A4" style={s.page}>
        {header}
        <View style={s.body}>
          <Text style={s.h2}>Estado y responsables</Text>
          <KV k="Etapa actual" v={stage?.label ?? project.status} />
          <KV k="Tipo de proyecto" v={project.type === "residencial" ? "Residencial" : "Comercial"} />
          <KV k="Fecha programada" v={project.scheduledDate ? new Date(project.scheduledDate).toLocaleDateString("es-AR") : "A definir"} />
          <KV k="Asesor comercial" v={salesperson} />
          <KV k="Técnico asignado" v={technician} />

          <Text style={s.h2}>Etapas del proyecto</Text>
          {PROJECT_STAGES.map((st, i) => (
            <View key={st.value} style={s.stageRow} wrap={false}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i <= stageIdx ? GREEN : LINE, marginRight: 8 }} />
              <View>
                <Text style={{ fontFamily: i === stageIdx ? "Helvetica-Bold" : "Helvetica", color: i <= stageIdx ? INK : BODY }}>{st.label}</Text>
                <Text style={{ fontSize: 7.5, color: BODY }}>{st.hint}</Text>
              </View>
            </View>
          ))}

          {quote && (
            <>
              <Text style={s.h2}>Datos y supuestos del cálculo</Text>
              <KV k="Consumo considerado" v={`${nf0.format(quote.inputs.kwh)} kWh en ${nf0.format(quote.inputs.days)} días`} />
              <KV k="Precio del kWh" v={ars(quote.inputs.pricePerKwh)} />
              <KV k="Rendimiento del sistema (PR)" v={`${nf1.format(quote.inputs.performanceRatio * 100)} %`} />
              <KV k="Cobertura objetivo" v={`${nf0.format(quote.inputs.coveragePct)} %`} />
              <KV k="Tipo de cambio" v={`${ars(rate)} por dólar`} />
              {(r?.warnings ?? []).length > 0 && (
                <View style={{ marginTop: 6 }}>
                  {r!.warnings.map((w, i) => (
                    <Text key={i} style={s.small}>
                      • {w}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={s.h2}>Condiciones</Text>
          <Text style={s.small}>
            Los valores de producción, ahorro y retorno son estimaciones basadas en el consumo informado y la radiación solar de la zona; la
            generación real puede variar según el clima, la orientación y el estado de la instalación. Los precios están expresados en dólares
            estadounidenses y su equivalente en pesos surge del tipo de cambio de referencia indicado, sujeto a variación al momento de la
            contratación. Este documento no constituye una factura.
          </Text>

          <View style={{ flexDirection: "row", gap: 40, marginTop: 44 }}>
            {["Firma del cliente", "Aclaración y DNI"].map((t) => (
              <View key={t} style={{ flex: 1, borderTopWidth: 0.8, borderTopColor: INK, paddingTop: 4 }}>
                <Text style={{ fontSize: 8, color: BODY, textAlign: "center" }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        {footer}
      </Page>
    </Document>
  );
}

export async function buildProjectPdf(data: ProjectPdfData): Promise<Blob> {
  return pdf(<ProjectDoc data={data} />).toBlob();
}
