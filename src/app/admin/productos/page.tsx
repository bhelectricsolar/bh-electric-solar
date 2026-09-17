"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS, type Product, type ProductCategory } from "@/lib/products";
import { useAdminSettings } from "@/lib/admin-settings";
import { downloadCSV } from "@/lib/csv-export";
import { pickField } from "@/lib/csv-import";
import ImageUploader, { type UploadedImage } from "@/components/admin/ImageUploader";
import ImportButton from "@/components/admin/ImportButton";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

const GRADIENTS = [
  "from-[#1d3474] to-[#0a1733]",
  "from-[#2a4a8a] to-[#0c1a38]",
  "from-[#12274d] to-[#081127]",
  "from-[#4a4f63] to-[#171b2c]",
  "from-[#6b5a3a] to-[#241d0f]",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type DraftProduct = {
  name: string;
  category: ProductCategory;
  priceUSD: string;
  costUSD: string;
  stock: string;
  shortDescription: string;
  description: string;
};

const EMPTY_DRAFT: DraftProduct = {
  name: "",
  category: "paneles",
  priceUSD: "",
  costUSD: "",
  stock: "",
  shortDescription: "",
  description: "",
};

const CATEGORY_BY_LABEL = new Map(
  CATEGORIES.map((c) => [c.label.toLowerCase(), c.value]),
);

function matchCategory(value: string): ProductCategory {
  const normalized = value.trim().toLowerCase();
  const byValue = CATEGORIES.find((c) => c.value === normalized);
  if (byValue) return byValue.value;
  return CATEGORY_BY_LABEL.get(normalized) ?? "accesorios";
}

export default function AdminProductosPage() {
  const { formatPrice } = useAdminSettings();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProduct>(EMPTY_DRAFT);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [fromInventoryOpen, setFromInventoryOpen] = useState(false);
  const [query, setQuery] = useState("");

  const published = products.filter((p) => p.publishedOnline !== false);
  const internalOnly = products.filter((p) => p.publishedOnline === false);
  const visible = published.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  function openNewChoice() {
    setChoiceOpen(true);
  }

  function openNewBlank() {
    setChoiceOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setImages([]);
    setPanelOpen(true);
  }

  function openFromInventory() {
    setChoiceOpen(false);
    setFromInventoryOpen(true);
  }

  function publishFromInventory(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, publishedOnline: true } : p)),
    );
    setFromInventoryOpen(false);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      category: product.category,
      priceUSD: String(product.priceUSD),
      costUSD: product.costUSD !== undefined ? String(product.costUSD) : "",
      stock: String(product.stock),
      shortDescription: product.shortDescription,
      description: product.description,
    });
    setImages([]);
    setPanelOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: draft.name,
                category: draft.category,
                priceUSD: Number(draft.priceUSD) || 0,
                costUSD: draft.costUSD ? Number(draft.costUSD) : undefined,
                stock: Number(draft.stock) || 0,
                shortDescription: draft.shortDescription,
                description: draft.description,
              }
            : p,
        ),
      );
    } else {
      const newProduct: Product = {
        id: slugify(draft.name) + "-" + Date.now().toString(36),
        slug: slugify(draft.name),
        name: draft.name,
        category: draft.category,
        priceUSD: Number(draft.priceUSD) || 0,
        costUSD: draft.costUSD ? Number(draft.costUSD) : undefined,
        stock: Number(draft.stock) || 0,
        shortDescription: draft.shortDescription,
        description: draft.description || draft.shortDescription,
        specs: [],
        gradient: GRADIENTS[products.length % GRADIENTS.length],
        publishedOnline: true,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setPanelOpen(false);
  }

  function exportCSV() {
    downloadCSV(
      "productos.csv",
      products.map((p) => ({
        nombre: p.name,
        categoria: CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category,
        precio_usd: p.priceUSD,
        costo_usd: p.costUSD ?? "",
        stock: p.stock,
        slug: p.slug,
      })),
    );
  }

  function importRows(rows: Record<string, string>[]) {
    const imported: Product[] = [];
    rows.forEach((row, idx) => {
      const name = pickField(row, ["nombre", "name", "producto"]);
      if (!name.trim()) return;
      const priceUSD = Number(pickField(row, ["precio_usd", "precio", "price"])) || 0;
      const costUSD = Number(pickField(row, ["costo_usd", "costo", "cost"])) || undefined;
      const stock = Number(pickField(row, ["stock", "cantidad"])) || 0;
      const category = matchCategory(pickField(row, ["categoria", "category"]) || "accesorios");
      imported.push({
        id: slugify(name) + "-" + Date.now().toString(36) + "-" + idx,
        slug: slugify(name),
        name,
        category,
        priceUSD,
        costUSD,
        stock,
        shortDescription: "",
        description: "",
        specs: [],
        gradient: GRADIENTS[(products.length + idx) % GRADIENTS.length],
      });
    });
    if (imported.length > 0) {
      setProducts((prev) => [...imported, ...prev]);
    }
    return imported.length;
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectorEyebrow />
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Productos</h1>
            <p className="mt-1 text-sm text-body">
              {published.length} productos publicados en /tienda
              {internalOnly.length > 0 && ` · ${internalOnly.length} más en el inventario interno`}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ImportButton label="Importar CSV" onRows={importRows} />
            <button
              type="button"
              onClick={exportCSV}
              className="flex-1 cursor-pointer touch-manipulation rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:shadow-md sm:flex-none"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={openNewChoice}
              className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md sm:flex-none"
            >
              + Nuevo
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Vista previa — estos cambios solo existen en esta pestaña (se
          pierden al recargar). Cuando conectemos Supabase, se van a guardar
          de verdad y reflejar en <b className="text-ink">/tienda</b>.
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="mt-5 w-full rounded-lg border border-ink/10 bg-surface px-4 py-2.5 text-sm text-ink"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-surface shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`flex h-24 items-end justify-between bg-gradient-to-br p-3 ${product.gradient}`}>
                <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {CATEGORIES.find((c) => c.value === product.category)?.label}
                </span>
                {product.stock <= 8 && (
                  <span className="rounded bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-navy-950">
                    Stock: {product.stock}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-semibold leading-snug text-ink">{product.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-data text-lg font-semibold text-ink">
                    {formatPrice(product.priceUSD)}
                  </span>
                  <span className="font-data text-xs text-body">
                    Stock {product.stock}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-cream-200 py-2 text-xs font-semibold text-ink"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 cursor-pointer touch-manipulation rounded-lg bg-red-500/10 py-2 text-xs font-semibold text-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-body">
              No se encontraron productos.
            </p>
          )}
        </div>
      </div>

      {choiceOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setChoiceOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <div className="animate-sheet-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-md sm:rounded-t-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <h2 className="text-lg font-bold text-ink">¿Cómo querés agregarlo?</h2>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={openNewBlank}
                className="flex cursor-pointer touch-manipulation flex-col gap-1 rounded-2xl border border-ink/15 bg-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-sm font-bold text-ink">Producto nuevo</span>
                <span className="text-xs text-body">Cargar un producto desde cero, con nombre, precio y descripción propios.</span>
              </button>
              <button
                type="button"
                onClick={openFromInventory}
                disabled={internalOnly.length === 0}
                className="flex cursor-pointer touch-manipulation flex-col gap-1 rounded-2xl border border-ink/15 bg-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-sm font-bold text-ink">Publicar desde inventario interno</span>
                <span className="text-xs text-body">
                  {internalOnly.length > 0
                    ? `Elegir uno de los ${internalOnly.length} items que ya están en Stock pero no se venden online todavía.`
                    : "No hay items internos sin publicar ahora mismo."}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {fromInventoryOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setFromInventoryOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <div className="animate-sheet-in absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <h2 className="text-lg font-bold text-ink">Inventario interno</h2>
            <div className="mt-4 flex flex-col gap-3">
              {internalOnly.map((product) => (
                <div key={product.id} className="rounded-2xl border border-ink/15 bg-background p-4 shadow-sm">
                  <p className="text-sm font-bold text-ink">{product.name}</p>
                  <p className="mt-1 text-xs text-body">Stock: {product.stock} · {formatPrice(product.priceUSD)}</p>
                  <button
                    type="button"
                    onClick={() => publishFromInventory(product.id)}
                    className="mt-3 w-full cursor-pointer touch-manipulation rounded-lg bg-navy-900 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
                  >
                    Publicar en /tienda
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 cursor-pointer touch-manipulation bg-navy-950/60"
          />
          <form
            onSubmit={handleSave}
            className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[0_0_60px_-10px_rgba(12,24,48,0.5)] sm:animate-panel-in sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-t-none"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">
                {editingId ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 cursor-pointer touch-manipulation place-items-center rounded-full text-body hover:bg-cream-200 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <Field label="Imágenes del producto">
                <ImageUploader images={images} onChange={setImages} />
              </Field>

              <Field label="Nombre">
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ej: Panel Solar Monocristalino 550W"
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>

              <Field label="Categoría">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as ProductCategory })
                  }
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio (USD)">
                  <input
                    required
                    type="number"
                    min={0}
                    value={draft.priceUSD}
                    onChange={(e) => setDraft({ ...draft, priceUSD: e.target.value })}
                    placeholder="145"
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
                <Field label="Costo (USD)">
                  <input
                    type="number"
                    min={0}
                    value={draft.costUSD}
                    onChange={(e) => setDraft({ ...draft, costUSD: e.target.value })}
                    placeholder="92"
                    className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                  />
                </Field>
              </div>

              <Field label="Stock">
                <input
                  required
                  type="number"
                  min={0}
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  placeholder="20"
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>

              <Field label="Descripción corta (aparece en el catálogo)">
                <input
                  value={draft.shortDescription}
                  onChange={(e) =>
                    setDraft({ ...draft, shortDescription: e.target.value })
                  }
                  placeholder="Alta eficiencia para instalaciones residenciales."
                  className="w-full rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>

              <Field label="Descripción completa (ficha de producto)">
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
                />
              </Field>
            </div>

            <button
              type="submit"
              className="sticky bottom-0 mt-6 rounded-lg bg-navy-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              {editingId ? "Guardar cambios" : "Crear producto"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
