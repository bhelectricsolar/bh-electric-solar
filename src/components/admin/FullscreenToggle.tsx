"use client";

import { useEffect, useState } from "react";

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

function isFull() {
  const d = document as FsDoc;
  return !!(document.fullscreenElement || d.webkitFullscreenElement);
}

// Pantalla completa para PC y Mac (también con la app instalada).
// No aparece donde el navegador no lo permite (iPhone).
export default function FullscreenToggle({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const el = document.documentElement as FsEl;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!(el.requestFullscreen || el.webkitRequestFullscreen));
    const sync = () => setFull(isFull());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!supported) return null;

  async function toggle() {
    const d = document as FsDoc;
    const el = document.documentElement as FsEl;
    try {
      if (isFull()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await d.webkitExitFullscreen?.();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        await el.webkitRequestFullscreen?.();
      }
    } catch (err) {
      console.error("Pantalla completa:", err);
    }
  }

  const label = full ? "Salir de pantalla completa" : "Pantalla completa";
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className={
        compact
          ? "hidden h-9 w-9 place-items-center rounded-lg border border-ink/15 bg-background text-ink shadow-sm hover:shadow-md lg:grid"
          : "hidden items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-cream-200 lg:flex"
      }
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {full ? (
          <path d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3" />
        ) : (
          <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" />
        )}
      </svg>
      {!compact && label}
    </button>
  );
}
