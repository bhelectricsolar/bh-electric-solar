"use client";

import { useRef, useState } from "react";

export type UploadedImage = { id: string; url: string; name: string };

const ACCEPTED = ".png,.jpg,.jpeg,.webp,.gif,.svg,.avif";

export default function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: UploadedImage[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(f),
        name: f.name,
      }));
    if (next.length) onChange([...images, ...next]);
  }

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-gold-500 bg-gold-500/5" : "border-ink/15 hover:border-ink/30"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-body" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M12 4 7 9M12 4l5 5" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
        <p className="text-sm font-semibold text-ink">
          Arrastrá imágenes acá o tocá para elegir
        </p>
        <p className="text-xs text-body">
          PNG, JPG, WEBP, GIF, SVG o AVIF — incluye imágenes sin fondo (PNG
          transparente).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div key={img.id} className="group relative">
              <div className="bg-checkerboard aspect-square overflow-hidden rounded-lg border border-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-navy-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label="Quitar imagen"
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 cursor-pointer touch-manipulation place-items-center rounded-full bg-red-500 text-white shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-body">
        Vista previa local — las imágenes se ven acá pero todavía no se suben
        a ningún servidor. Con Supabase Storage conectado, se van a guardar
        de verdad y quedar disponibles en <b className="text-ink">/tienda</b>.
      </p>
    </div>
  );
}
