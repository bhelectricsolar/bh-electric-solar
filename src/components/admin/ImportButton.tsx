"use client";

import { useRef, useState } from "react";
import { parseCSV } from "@/lib/csv-import";

export default function ImportButton({
  label,
  onRows,
}: {
  label: string;
  onRows: (rows: Record<string, string>[]) => number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setMessage("El archivo no tiene filas para importar.");
      } else {
        const added = onRows(rows);
        setMessage(`Se importaron ${added} de ${rows.length} filas.`);
      }
    } catch {
      setMessage("No se pudo leer el archivo. Verificá que sea un CSV válido.");
    }
    window.setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream-200"
      >
        {label}
      </button>
      {message && (
        <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-ink/10 bg-surface p-2 text-[11px] text-body shadow-lg">
          {message}
        </p>
      )}
    </div>
  );
}
