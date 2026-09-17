import { supabase } from "./supabase";

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
  source: "Formulario" | "Calculadora" | "WhatsApp" | "Tienda";
  createdAt: string;
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

export async function createCustomer(customer: Omit<Customer, "id" | "createdAt">) {
  const { error } = await supabase.from("customers").insert({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    status: customer.status,
    source: customer.source,
  });
  if (error) throw error;
}
