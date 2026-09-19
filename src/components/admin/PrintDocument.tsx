"use client";

import { useRef, useState } from "react";
import { useAdminSettings } from "@/lib/admin-settings";

export default function PrintDocument({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { settings } = useAdminSettings();
  const paperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Comparte el documento como texto: menú nativo de compartir en celular y
  // Mac; si el equipo no lo tiene, abre WhatsApp con el texto ya escrito.
  async function share() {
    const text = paperRef.current?.innerText.trim() ?? title;
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin portapapeles: seguimos con WhatsApp
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div data-sheet className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="bh-no-print absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
      />
      <div className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none">
        <div className="bh-no-print mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
        <div className="bh-no-print flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div ref={paperRef} className="bh-recibo mt-4 border border-black/10">
          <div className="text-center">
            <div className="text-base font-bold">{settings.storeName}</div>
            {settings.whatsapp && <div className="text-xs opacity-80">WhatsApp: {settings.whatsapp}</div>}
            {settings.email && <div className="text-xs opacity-80">{settings.email}</div>}
          </div>
          <div className="bh-recibo-line" />
          {children}
          <div className="mt-4 text-center text-xs opacity-70">¡Gracias por confiar en nosotros!</div>
        </div>

        <div className="bh-no-print mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream-200"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={share}
            className="cursor-pointer touch-manipulation rounded-lg border border-gold-500/50 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-600 hover:bg-gold-500/20"
          >
            {copied ? "Texto copiado ✓" : "Compartir"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
