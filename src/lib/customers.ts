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

// Datos de ejemplo — se reemplazan por los leads/clientes reales
// una vez que el formulario de contacto y la tienda escriban en Supabase.
export const CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "Cliente de ejemplo 1",
    email: "ejemplo1@correo.com",
    phone: "+54 9 3754 000001",
    city: "Posadas, Misiones",
    status: "cliente",
    source: "Calculadora",
    createdAt: "2026-08-14",
  },
  {
    id: "c2",
    name: "Cliente de ejemplo 2",
    email: "ejemplo2@correo.com",
    phone: "+54 9 3754 000002",
    city: "Eldorado, Misiones",
    status: "lead",
    source: "Formulario",
    createdAt: "2026-08-22",
  },
  {
    id: "c3",
    name: "Cliente de ejemplo 3",
    email: "ejemplo3@correo.com",
    phone: "+54 9 3755 000003",
    city: "Oberá, Misiones",
    status: "lead",
    source: "WhatsApp",
    createdAt: "2026-09-02",
  },
  {
    id: "c4",
    name: "Cliente de ejemplo 4",
    email: "ejemplo4@correo.com",
    phone: "+54 9 3754 000004",
    city: "Puerto Iguazú, Misiones",
    status: "cliente",
    source: "Tienda",
    createdAt: "2026-09-10",
  },
];
