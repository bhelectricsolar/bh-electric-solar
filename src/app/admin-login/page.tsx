"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${username.trim().toLowerCase()}@bhelectricsolar.internal`,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    router.replace(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <svg viewBox="0 0 32 32" className="h-8 w-8">
              <path d="M16 2 29 9v14L16 30 3 23V9Z" fill="none" stroke="#ffb648" strokeWidth="1.6" />
              <circle cx="16" cy="16" r="3.4" fill="#ffb648" />
            </svg>
          </span>
          <h1 className="mt-4 text-xl font-extrabold">BH Admin</h1>
          <p className="mt-1 text-sm text-white/60">Ingresá con tu usuario y contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Usuario</span>
            <input
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu.usuario"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#ffb648]/60 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Contraseña</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#ffb648]/60 focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer touch-manipulation rounded-lg bg-[#ffb648] py-3 text-sm font-bold text-navy-950 shadow-[0_10px_30px_-10px_rgba(255,182,72,0.5)] transition-all hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
