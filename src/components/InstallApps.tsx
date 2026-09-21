"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type Platform = "windows" | "mac" | "android" | "ios" | "other";

const PLATFORMS: {
  id: Exclude<Platform, "other">;
  name: string;
  sub: string;
  steps: string[];
  icon: React.ReactNode;
}[] = [
  {
    id: "windows",
    name: "Computadora con Windows",
    sub: "Chrome o Edge",
    steps: [
      "Abrí esta página en Google Chrome o Microsoft Edge.",
      "Tocá «Instalar ahora» (o el ícono ⊕ que aparece a la derecha de la barra de direcciones).",
      "Confirmá con «Instalar». Se crea el ícono en el escritorio y en el menú Inicio.",
      "Opcional: clic derecho sobre el ícono → «Anclar a la barra de tareas».",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M3 5.5 11 4.4v7H3v-5.9Zm9 -1.2L21 3v8.4h-9V4.3ZM3 12.6h8v7l-8-1.1v-5.9Zm9 0h9V21l-9-1.3v-7.1Z" />
      </svg>
    ),
  },
  {
    id: "mac",
    name: "Mac (MacBook / iMac)",
    sub: "Chrome, Edge o Safari",
    steps: [
      "Con Chrome o Edge: tocá «Instalar ahora» y confirmá.",
      "Con Safari (macOS Sonoma o más nuevo): menú Archivo → «Agregar al Dock».",
      "La app queda en Launchpad y en el Dock, con su propio ícono y sin barra de navegador.",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.3.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8ZM14.1 5.9c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.6-1.3Z" />
      </svg>
    ),
  },
  {
    id: "android",
    name: "Celular o tablet Android",
    sub: "Chrome",
    steps: [
      "Abrí esta página desde Chrome en tu celular.",
      "Tocá «Instalar ahora». Si no aparece, abrí el menú ⋮ y elegí «Instalar aplicación».",
      "Confirmá. El ícono aparece en la pantalla de inicio y se abre a pantalla completa.",
    ],
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M7 9h10v8a1 1 0 0 1-1 1h-1v3h-2v-3h-2v3H9v-3H8a1 1 0 0 1-1-1V9Zm-3 .5a1.2 1.2 0 0 1 2.4 0v5a1.2 1.2 0 0 1-2.4 0v-5Zm13.6 0a1.2 1.2 0 0 1 2.4 0v5a1.2 1.2 0 0 1-2.4 0v-5ZM8 8a4 4 0 0 1 8 0H8Z" />
      </svg>
    ),
  },
];

export default function InstallApps() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
    else if (/Macintosh|Mac OS X/i.test(ua)) setPlatform("mac");
    else if (/Windows/i.test(ua)) setPlatform("windows");

    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    setMessage(null);
    if (!prompt) {
      setMessage(
        platform === "ios"
          ? "En iPhone y iPad: tocá Compartir y elegí «Agregar a inicio»."
          : "Tu navegador no ofrece la instalación con un botón. Seguí los pasos de tu equipo, más abajo, o abrí esta página en Chrome o Edge.",
      );
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  const ordered = [...PLATFORMS].sort((a, b) => (a.id === platform ? -1 : b.id === platform ? 1 : 0));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto max-w-2xl text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="BH Electric Solar" className="mx-auto h-24 w-auto drop-shadow-[0_10px_25px_rgba(245,154,31,0.45)]" />
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Descargá el software de gestión
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Caja, stock, cotizador solar, proyectos y pedidos en una app propia: con su ícono, a pantalla completa y
          sincronizada en todos tus equipos. Sin APK ni instaladores pesados.
        </p>

        {installed ? (
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-300">
            ✓ La app ya está instalada en este equipo
          </div>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-6 cursor-pointer touch-manipulation rounded-xl bg-gold-500 px-8 py-4 text-base font-extrabold text-navy-950 shadow-[0_18px_40px_-14px_rgba(245,154,31,0.75)] transition-all hover:brightness-105 hover:shadow-[0_0_34px_rgba(245,154,31,0.55)]"
          >
            Instalar ahora
          </button>
        )}
        {message && <p className="mx-auto mt-3 max-w-md text-xs font-semibold text-gold-300">{message}</p>}
        <div className="mt-4">
          <Link href="/admin-login" className="text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">
            O entrar directo desde el navegador →
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {ordered.map((p) => (
          <article
            key={p.id}
            className={`rounded-2xl border p-6 ${
              p.id === platform
                ? "border-gold-500/60 bg-white/[0.09] shadow-[0_25px_60px_-30px_rgba(245,154,31,0.55)]"
                : "border-white/10 bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-400">{p.icon}</span>
              <div>
                <h2 className="text-base font-bold text-white">{p.name}</h2>
                <p className="text-xs text-white/60">{p.sub}</p>
              </div>
            </div>
            {p.id === platform && (
              <span className="mt-3 inline-block rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-950">
                Tu equipo
              </span>
            )}
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/75">
              {p.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <h2 className="text-base font-bold text-white">iPhone y iPad</h2>
        <p className="mt-1.5 text-sm text-white/70">
          Abrí esta página en Safari, tocá <b className="text-white">Compartir</b> y elegí{" "}
          <b className="text-white">«Agregar a inicio»</b>. La app queda en tu pantalla de inicio como cualquier otra.
        </p>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-white/45">
        Se actualiza sola cada vez que mejoramos el sistema. Para entrar necesitás tu usuario y contraseña de BH Electric Solar.
      </p>
    </div>
  );
}
