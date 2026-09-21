"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  getProducts,
  createCategory,
  updateCategoryLabel,
  deleteCategory,
  setCategoryHidden,
  type ProductCategory,
} from "@/lib/products";
import SectorEyebrow from "@/components/admin/SectorEyebrow";

type CategoryRow = { value: string; label: string; hiddenStore?: boolean; hiddenStock?: boolean };

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([cats, products]) => {
        setCategories(cats);
        const counts: Record<string, number> = {};
        products.forEach((p) => {
          counts[p.category] = (counts[p.category] ?? 0) + 1;
        });
        setProductCounts(counts);
      })
      .finally(() => setLoading(false));
  }, []);

  function countProducts(value: string) {
    return productCounts[value as ProductCategory] ?? 0;
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim()) return;
    const value = newLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await createCategory(value, newLabel.trim());
    setCategories((prev) => [...prev, { value, label: newLabel.trim() }]);
    setNewLabel("");
  }

  function startEdit(cat: CategoryRow) {
    setEditingValue(cat.value);
    setEditingLabel(cat.label);
  }

  async function saveEdit() {
    if (!editingValue) return;
    await updateCategoryLabel(editingValue, editingLabel);
    setCategories((prev) =>
      prev.map((c) => (c.value === editingValue ? { ...c, label: editingLabel } : c)),
    );
    setEditingValue(null);
  }

  async function toggleHidden(cat: CategoryRow, field: "hiddenStore" | "hiddenStock") {
    const next = !cat[field];
    setCategories((prev) => prev.map((c) => (c.value === cat.value ? { ...c, [field]: next } : c)));
    try {
      await setCategoryHidden(cat.value, { [field]: next });
    } catch (e) {
      console.error("Ocultar categoría:", e);
      setCategories((prev) => prev.map((c) => (c.value === cat.value ? { ...c, [field]: !next } : c)));
    }
  }

  async function handleDelete(value: string) {
    const inUse = countProducts(value);
    if (inUse > 0) {
      alert(
        `No podés eliminar esta categoría: tiene ${inUse} producto(s) asignado(s). Reasigná esos productos primero.`,
      );
      return;
    }
    await deleteCategory(value);
    setCategories((prev) => prev.filter((c) => c.value !== value));
  }

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <SectorEyebrow />
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Categorías</h1>
        <p className="mt-1 text-sm text-body">
          Organizá el catálogo de la tienda en categorías.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-surface p-4 text-xs text-body">
          Conectado a Supabase — los cambios acá se guardan de verdad y
          afectan el catálogo real de <b className="text-ink">/tienda</b>.
        </div>

        {loading && <p className="mt-5 text-sm text-body">Cargando categorías…</p>}

        <form
          onSubmit={handleAdd}
          className="mt-6 flex gap-3 rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm"
        >
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ej: Cargadores de vehículos eléctricos"
            className="flex-1 rounded-lg border border-ink/10 bg-background px-3 py-2.5 text-sm text-ink"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer touch-manipulation rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md"
          >
            + Agregar
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          {categories.map((cat) => (
            <div
              key={cat.value}
              className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              {editingValue === cat.value ? (
                <input
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  autoFocus
                  className="flex-1 rounded-lg border border-navy-900/30 bg-background px-3 py-1.5 text-sm text-ink"
                />
              ) : (
                <div>
                  <p className="font-semibold text-ink">{cat.label}</p>
                  <p className="text-xs text-body">
                    {countProducts(cat.value)} producto(s)
                  </p>
                </div>
              )}

              <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-semibold">
                {(["hiddenStore", "hiddenStock"] as const).map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleHidden(cat, field)}
                    className={`cursor-pointer touch-manipulation rounded-full border px-3 py-1.5 transition-all ${
                      cat[field]
                        ? "border-red-500/40 bg-red-500/10 text-red-500"
                        : "border-ink/15 bg-background text-ink hover:bg-cream-200"
                    }`}
                  >
                    {field === "hiddenStore" ? "Tienda" : "Stock"}: {cat[field] ? "oculta" : "visible"}
                  </button>
                ))}
                {editingValue === cat.value ? (
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="text-ink hover:underline"
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="text-ink hover:underline"
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(cat.value)}
                  className="text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
