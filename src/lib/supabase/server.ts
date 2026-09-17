import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llama desde un Server Component — el middleware ya refresca la sesión.
          }
        },
      },
      global: {
        // El fetch server-side a veces falla de forma intermitente (red local /
        // antivirus interceptando TLS) — reintentamos una vez antes de rendirnos.
        fetch: async (input, init) => {
          const opts = { ...init, cache: "no-store" as const };
          try {
            return await fetch(input, opts);
          } catch {
            return fetch(input, opts);
          }
        },
      },
    },
  );
}
