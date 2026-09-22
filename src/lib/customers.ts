import { createClient } from "./supabase/client";

const supabase = createClient();

export const CUSTOMER_STATUS_TONE: Record<"lead" | "cliente", import("@/components/admin/StatusBadge").StatusTone> = {
  lead: "gold",
  cliente: "done",
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: "lead" | "cliente";
  source: "Formulario" | "Calculadora" | "WhatsApp" | "Tienda" | "Manual";
  createdAt: string;
  // Detalle que trae el formulario de presupuesto personalizado — no todos
  // los clientes lo tienen (los cargados a mano desde el admin, no).
  propertyType?: string;
  billAmount?: number;
  kwhMonthly?: number;
  roofType?: string;
  message?: string;
  invoicePath?: string;
  // Última vez que alguien del equipo habló con este lead — sin esto, un
  // lead contactado hoy seguía marcado "sin atender" para siempre.
  lastContactedAt?: string;
  // Quién lo cargó desde el admin (nulo = llegó solo por el formulario
  // público) — sirve para no mezclar las pruebas del desarrollador con los
  // leads/clientes reales del dueño.
  createdBy?: string;
  // Marca manual para ocultar un lead de prueba que llegó por el
  // formulario público (ahí no hay forma automática de saber quién lo cargó).
  isTest?: boolean;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: "lead" | "cliente";
  source: string | null;
  created_at: string;
  property_type: string | null;
  bill_amount: number | null;
  kwh_monthly: number | null;
  roof_type: string | null;
  message: string | null;
  invoice_path: string | null;
  last_contacted_at: string | null;
  created_by: string | null;
  is_test: boolean | null;
};

function fromRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    city: row.city ?? "",
    status: row.status,
    source: (row.source as Customer["source"]) ?? "Formulario",
    createdAt: row.created_at,
    propertyType: row.property_type ?? undefined,
    billAmount: row.bill_amount != null ? Number(row.bill_amount) : undefined,
    kwhMonthly: row.kwh_monthly != null ? Number(row.kwh_monthly) : undefined,
    roofType: row.roof_type ?? undefined,
    message: row.message ?? undefined,
    invoicePath: row.invoice_path ?? undefined,
    lastContactedAt: row.last_contacted_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    isTest: row.is_test ?? false,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.lastContactedAt !== undefined) row.last_contacted_at = patch.lastContactedAt;
  if (patch.isTest !== undefined) row.is_test = patch.isTest;
  const { error } = await supabase.from("customers").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function createCustomer(customer: Omit<Customer, "id" | "createdAt">) {
  const { error } = await supabase.from("customers").insert({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    status: customer.status,
    source: customer.source,
    property_type: customer.propertyType ?? null,
    bill_amount: customer.billAmount ?? null,
    kwh_monthly: customer.kwhMonthly ?? null,
    roof_type: customer.roofType ?? null,
    message: customer.message ?? null,
    invoice_path: customer.invoicePath ?? null,
    created_by: customer.createdBy ?? null,
  });
  if (error) throw error;
}

export type ContactFormSubmission = {
  name: string;
  whatsapp: string;
  email: string;
  city: string;
  propertyType: string;
  billAmount: string;
  kwhMonthly: string;
  roofType: string;
  message: string;
  invoiceFile: File | null;
};

// Lo usa el formulario público de /contacto — el visitante no está
// logueado, así que sube al bucket privado y crea el lead con el
// cliente anónimo (las políticas de Supabase ya permiten ambas cosas).
export async function submitContactForm(form: ContactFormSubmission) {
  let invoicePath: string | undefined;
  if (form.invoiceFile) {
    const ext = form.invoiceFile.name.split(".").pop() ?? "pdf";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("customer-invoices")
      .upload(path, form.invoiceFile);
    if (uploadError) throw uploadError;
    invoicePath = path;
  }

  await createCustomer({
    name: form.name,
    email: form.email,
    phone: form.whatsapp,
    city: form.city,
    status: "lead",
    source: "Formulario",
    propertyType: form.propertyType || undefined,
    billAmount: form.billAmount ? Number(form.billAmount) : undefined,
    kwhMonthly: form.kwhMonthly ? Number(form.kwhMonthly) : undefined,
    roofType: form.roofType || undefined,
    message: form.message || undefined,
    invoicePath,
  });
}

export async function getInvoiceSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("customer-invoices")
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
