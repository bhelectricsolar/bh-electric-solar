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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-dvh items-center justify-center bg-[#081127] px-4 py-12">
      <style>{`
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0px 1000px #0c1a38 inset;
          box-shadow: 0 0 0px 1000px #0c1a38 inset;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BH Electric Solar" className="h-28 w-auto" />
          <h1 className="mt-4 text-xl font-extrabold text-white">BH Admin</h1>
          <p className="mt-1 text-sm text-white/70">Ingresá con tu usuario y contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-white/80">Usuario</span>
            <input
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu.usuario"
              className="login-input mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#ffb648]/70 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/80">Contraseña</span>
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-[#ffb648]/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-white/50 hover:text-white/90"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.5 5.3A9.9 9.9 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.2 6.6C4.3 8 3 9.9 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.4-.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer touch-manipulation rounded-lg bg-[#ffb648] py-3 text-sm font-bold text-[#081127] shadow-[0_10px_30px_-10px_rgba(255,182,72,0.5)] transition-all hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-white/60">
          ¿Querés la app en tu PC, Mac o celular?{" "}
          <a href="/descargar" className="font-semibold text-[#ffb648] underline-offset-2 hover:underline">
            Descargala acá
          </a>
        </p>
      </div>
    </div>
  );
}
