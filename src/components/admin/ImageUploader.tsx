"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UploadedImage = { id: string; url: string; name: string };

const ACCEPTED = ".png,.jpg,.jpeg,.webp,.gif,.svg,.avif";
const BUCKET = "product-images";

export default function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const toUpload = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!toUpload.length) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploaded: UploadedImage[] = [];

    for (const file of toUpload) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        setError(`No se pudo subir "${file.name}": ${uploadError.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({ id: path, url: data.publicUrl, name: file.name });
    }

    if (uploaded.length) onChange([...images, ...uploaded]);
    setUploading(false);
  }

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div>
      <label
        htmlFor="product-image-input"
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
        className={`flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-gold-500 bg-gold-500/5" : "border-ink/15 hover:border-ink/30"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-body" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M12 4 7 9M12 4l5 5" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
        <p className="text-sm font-semibold text-ink">
          {uploading ? "Subiendo…" : "Arrastrá imágenes acá o tocá para elegir"}
        </p>
        <p className="text-xs text-body">
          PNG, JPG, WEBP, GIF, SVG o AVIF — incluye imágenes sin fondo (PNG
          transparente).
        </p>
        <input
          ref={inputRef}
          id="product-image-input"
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </p>
      )}

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
        La primera imagen es la que se muestra como principal en /tienda. Se
        suben de verdad a Supabase — no hace falta guardar el producto para
        que queden cargadas, pero sí para que se asocien a él.
      </p>
    </div>
  );
}
