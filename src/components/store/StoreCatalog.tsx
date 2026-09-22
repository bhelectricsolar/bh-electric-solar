"use client";

import { useState } from "react";
import type { Category, Product, ProductCategory } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function StoreCatalog({
  products,
  categories,
  exchangeRate,
}: {
  products: Product[];
  categories: Category[];
  exchangeRate: number;
}) {
  const [category, setCategory] = useState<ProductCategory | "todos">("todos");

  const visible =
    category === "todos"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
        <FilterPill
          active={category === "todos"}
          onClick={() => setCategory("todos")}
        >
          Todos
        </FilterPill>
        {categories.map((cat) => (
          <FilterPill
            key={cat.value}
            active={category === cat.value}
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </FilterPill>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} exchangeRate={exchangeRate} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-sm text-body">
          No hay productos en esta categoría todavía.
        </p>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer touch-manipulation rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-ink/10 bg-white text-ink shadow-[0_6px_16px_-8px_rgba(12,24,48,0.25)] hover:-translate-y-0.5 hover:border-navy-900/30 hover:shadow-[0_10px_22px_-10px_rgba(12,24,48,0.35)]"
      }`}
    >
      {children}
    </button>
  );
}
