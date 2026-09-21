import { createClient } from "./supabase/client";
import type { QuoteInputs, QuoteResults } from "./solar-quote";

const supabase = createClient();

export type SolarQuote = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  customerId: string | null;
  projectId: string | null;
  clientName: string;
  address: string;
  province: string;
  systemKwp: number;
  panels: number;
  monthlyProduction: number;
  coveragePct: number;
  monthlySavings: number;
  costUSD: number;
  paybackYears: number | null;
  inputs: QuoteInputs;
  results: QuoteResults;
  summary: string;
  fromInvoicePhoto: boolean;
};

type Row = {
  id: string;
  created_at: string;
  created_by: string | null;
  customer_id: string | null;
  project_id: string | null;
  client_name: string | null;
  address: string | null;
  province: string | null;
  system_kwp: number | null;
  panels: number | null;
  monthly_production: number | null;
  coverage_pct: number | null;
  monthly_savings: number | null;
  cost_usd: number | null;
  payback_years: number | null;
  inputs: QuoteInputs;
  results: QuoteResults;
  summary: string | null;
  from_invoice_photo: boolean;
};

function fromRow(r: Row): SolarQuote {
  return {
    id: r.id,
    createdAt: r.created_at,
    createdBy: r.created_by,
    customerId: r.customer_id,
    projectId: r.project_id,
    clientName: r.client_name ?? "",
    address: r.address ?? "",
    province: r.province ?? "",
    systemKwp: Number(r.system_kwp ?? 0),
    panels: r.panels ?? 0,
    monthlyProduction: Number(r.monthly_production ?? 0),
    coveragePct: Number(r.coverage_pct ?? 0),
    monthlySavings: Number(r.monthly_savings ?? 0),
    costUSD: Number(r.cost_usd ?? 0),
    paybackYears: r.payback_years != null ? Number(r.payback_years) : null,
    inputs: r.inputs,
    results: r.results,
    summary: r.summary ?? "",
    fromInvoicePhoto: r.from_invoice_photo,
  };
}

export async function getSolarQuotes(): Promise<SolarQuote[]> {
  const { data, error } = await supabase
    .from("solar_quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createSolarQuote(q: {
  createdBy: string | null;
  customerId: string | null;
  projectId: string | null;
  clientName: string;
  address: string;
  inputs: QuoteInputs;
  results: QuoteResults;
  summary: string;
  fromInvoicePhoto: boolean;
}): Promise<SolarQuote> {
  const { data, error } = await supabase
    .from("solar_quotes")
    .insert({
      created_by: q.createdBy,
      customer_id: q.customerId,
      project_id: q.projectId,
      client_name: q.clientName || null,
      address: q.address || null,
      province: q.inputs.province,
      system_kwp: q.results.realKwp,
      panels: q.results.panels,
      monthly_production: q.results.monthlyProduction,
      coverage_pct: q.results.realCoveragePct,
      monthly_savings: q.results.monthlySavingsARS,
      cost_usd: q.results.costUSD,
      payback_years: q.results.paybackYears,
      inputs: q.inputs,
      results: q.results,
      summary: q.summary,
      from_invoice_photo: q.fromInvoicePhoto,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Sube el recorte del gráfico (data URL) al almacenamiento y devuelve su URL pública.
export async function uploadChartImage(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `cotizaciones/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export async function linkQuoteToProject(id: string, projectId: string) {
  const { error } = await supabase.from("solar_quotes").update({ project_id: projectId }).eq("id", id);
  if (error) throw error;
}

export async function deleteSolarQuote(id: string) {
  const { error } = await supabase.from("solar_quotes").delete().eq("id", id);
  if (error) throw error;
}
