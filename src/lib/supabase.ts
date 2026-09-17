import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente anónimo — lo usan también las páginas públicas (Server Components
// de /tienda), así que a propósito NUNCA lleva la sesión de un admin
// logueado (si la llevara, en el server ese estado quedaría compartido
// entre pedidos de distintos usuarios). Para escrituras de admin, que
// requieren estar autenticado, usar el cliente de "./supabase/client" en
// su lugar (ver src/lib/team.ts, orders.ts, etc.).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
