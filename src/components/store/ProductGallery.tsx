"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  gradient,
  name,
  lowStock,
}: {
  images: string[];
  gradient: string;
  name: string;
  lowStock: boolean;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className={`flex h-72 items-end justify-end rounded-2xl bg-gradient-to-br p-4 sm:h-96 ${gradient}`}
      >
        {lowStock && (
          <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
            Últimas unidades
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="premium-surface relative flex h-72 items-end justify-end overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 sm:h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain p-6"
        />
        {lowStock && (
          <span className="relative rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
            Últimas unidades
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-white shadow-sm transition-colors ${
                i === active ? "border-gold-500" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
