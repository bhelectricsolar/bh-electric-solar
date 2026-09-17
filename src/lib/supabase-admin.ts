import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave service_role — SOLO se importa desde código de
// servidor (Route Handlers / Server Actions). El paquete "server-only"
// hace que el build falle si algún componente de cliente lo importa
// por error, para que esta clave nunca llegue al navegador.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
