"use client";

import { useEffect, useState } from "react";
import {
  getProducts,
  getCategories,
  updateProduct,
  setCategoryHidden,
  type Product,
  type Category,
} from "@/lib/products";
import { useAdminSettings } from "@/lib/admin-settings";
import Chip from "@/components/admin/Chip";
import StatusBadge from "@/components/admin/StatusBadge";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

type Filter = "todos" | "publicados" | "internos" | "poco_stock" | "ocultos";

export default function AdminStockPage() {
  const { settings } = useAdminSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [showHidden, setShowHidden] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const lowStock = (p: Product) => p.stock <= settings.lowStockThreshold;

  const hiddenCats = new Set(categories.filter((c) => c.hiddenStock).map((c) => c.value));
  const isHidden = (p: Product) => p.hiddenStock === true || hiddenCats.has(p.category);
  const shown = products;
  const selectedCategory = categories.find((c) => c.value === categoryFilter);

  const visible = products.filter((p) => {
    if (!p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (categoryFilter !== "todas" && p.category !== categoryFilter) return false;
    if (filter === "ocultos") return isHidden(p);
    if (isHidden(p) && !showHidden) return false;
    if (filter === "publicados") return p.publishedOnline !== false;
    if (filter === "internos") return p.publishedOnline === false;
    if (filter === "poco_stock") return lowStock(p);
    return true;
  });

  async function adjustStock(id: string, delta: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    await updateProduct(id, { stock: newStock });
  }

  async function toggleHiddenStock(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const next = product.hiddenStock !== true;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, hiddenStock: next } : p)));
    try {
      await updateProduct(id, { hiddenStock: next });
    } catch (e) {
      console.error("Ocultar del stock:", e);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, hiddenStock: !next } : p)));
    }
  }

  async function toggleCategoryStock(cat: Category) {
    const next = !cat.hiddenStock;
    setCategories((prev) => prev.map((c) => (c.value === cat.value ? { ...c, hiddenStock: next } : c)));
    try {
      await setCategoryHidden(cat.value, { hiddenStock: next });
    } catch (e) {
      console.error("Ocultar categoría:", e);
      setCategories((prev) => prev.map((c) => (c.value === cat.value ? { ...c, hiddenStock: !next } : c)));
    }
  }

  async function togglePublished(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const next = product.publishedOnline === false;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, publishedOnline: next } : p)),
    );
    await updateProduct(id, { publishedOnline: next });
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Stock</h1>
        <p className="mt-1 text-sm text-body">
          Inventario interno completo — incluye lo publicado en /tienda y lo que
          todavía es solo de uso interno.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — es la misma base de datos que usa Productos,
          así que un ajuste acá se refleja ahí también.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando inventario…</p>}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en el inventario..."
          className="mt-5 w-full rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm text-ink shadow-sm"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip active={filter === "todos"} onClick={() => setFilter("todos")}>
            Todos ({shown.length})
          </Chip>
          <Chip active={filter === "publicados"} onClick={() => setFilter("publicados")} tone="negocio">
            Publicados ({shown.filter((p) => p.publishedOnline !== false).length})
          </Chip>
          <Chip active={filter === "internos"} onClick={() => setFilter("internos")} tone="negocio">
            Solo interno ({shown.filter((p) => p.publishedOnline === false).length})
          </Chip>
          <Chip active={filter === "poco_stock"} onClick={() => setFilter("poco_stock")} tone="danger">
            Poco stock ({shown.filter(lowStock).length})
          </Chip>
          <Chip active={filter === "ocultos"} onClick={() => setFilter("ocultos")} title="Productos marcados como ocultos del stock">
            Ocultos ({products.filter(isHidden).length})
          </Chip>
          <Chip active={!showHidden} onClick={() => setShowHidden((v) => !v)} title="Sacar de la lista los marcados como ocultos">
            {showHidden ? "Sacar ocultos de la lista" : "Ver también los ocultos"}
          </Chip>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink shadow-sm sm:flex-none"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} ({products.filter((p) => p.category === c.value).length})
                {c.hiddenStock ? " · oculta" : ""}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => toggleCategoryStock(selectedCategory)}
              className={`cursor-pointer touch-manipulation rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${
                selectedCategory.hiddenStock
                  ? "border-red-500/40 bg-red-500/10 text-red-500"
                  : "border-ink/15 bg-surface text-ink shadow-sm hover:shadow-md"
              }`}
            >
              {selectedCategory.hiddenStock ? "Mostrar categoría en el stock" : "Ocultar categoría del stock"}
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {visible.map((product) => (
            <div
              key={product.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                isHidden(product) ? "border-dashed border-red-500/50 opacity-75" : "border-ink/10"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg ${
                    product.images?.[0] ? "bg-white" : `bg-gradient-to-br ${product.gradient}`
                  }`}
                >
                  {product.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-1"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{product.name}</p>
                    {product.publishedOnline === false ? (
                      <StatusBadge tone="neutral">Solo interno</StatusBadge>
                    ) : (
                      <StatusBadge tone="negocio">Publicado</StatusBadge>
                    )}
                    {lowStock(product) && <StatusBadge tone="danger">Poco stock</StatusBadge>}
                    {isHidden(product) && (
                      <StatusBadge tone="danger">
                        {hiddenCats.has(product.category) ? "Categoría oculta del stock" : "Oculto del stock"}
                      </StatusBadge>
                    )}
                    {product.hiddenStore && <StatusBadge tone="danger">Oculto en la tienda</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-xs text-body">
                    {categories.find((c) => c.value === product.category)?.label}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-background px-2 py-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustStock(product.id, -1)}
                    className="grid h-7 w-7 cursor-pointer touch-manipulation place-items-center rounded-lg border border-ink/15 bg-surface text-ink shadow-sm hover:bg-cream-200"
                  >
                    −
                  </button>
                  <span className="font-data w-8 text-center text-sm font-semibold text-ink">
                    {product.stock}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustStock(product.id, 1)}
                    className="grid h-7 w-7 cursor-pointer touch-manipulation place-items-center rounded-lg border border-ink/15 bg-surface text-ink shadow-sm hover:bg-cream-200"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => togglePublished(product.id)}
                  className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-cream-200"
                >
                  {product.publishedOnline === false ? "Publicar en tienda" : "Quitar de tienda"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleHiddenStock(product.id)}
                  disabled={hiddenCats.has(product.category)}
                  title={hiddenCats.has(product.category) ? "Su categoría está oculta" : undefined}
                  className="cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-background px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-cream-200 disabled:opacity-50"
                >
                  {product.hiddenStock ? "Mostrar en stock" : "Ocultar del stock"}
                </button>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-body">No hay items con ese filtro.</p>
          )}
        </div>
      </div>
    </section>
  );
}
