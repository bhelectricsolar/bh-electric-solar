import { supabase } from "./supabase";
import { createClient } from "./supabase/client";

// Lecturas públicas (usadas también en Server Components de /tienda) van
// por el cliente anónimo de arriba. Todo lo que solo corre en el admin
// (listar TODO el catálogo incluyendo lo no publicado, y cualquier
// escritura) necesita ir autenticado o las políticas RLS lo rechazan.
const supabaseAuth = createClient();

export type ProductCategory =
  | "paneles"
  | "inversores"
  | "baterias"
  | "estructuras"
  | "accesorios"
  | "kits"
  | "controladores"
  | "protecciones"
  | "iluminacion"
  | "bombeo";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  priceUSD: number;
  // Precio de lista fijo en pesos, opcional — si no se carga, la tienda
  // muestra priceUSD convertido con la cotización de Configuración.
  priceARS?: number;
  costUSD?: number;
  stock: number;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  gradient: string;
  images: string[];
  // false = existe en el inventario interno pero todavía no se publicó en /tienda.
  publishedOnline?: boolean;
  // true = oculto de la lista de Stock del admin (sigue existiendo).
  hiddenStock?: boolean;
  // true = oculto de la tienda pública pero sigue en la lista del admin, marcado.
  hiddenStore?: boolean;
};

export type Category = {
  value: ProductCategory;
  label: string;
  // Categoría oculta: no aparece en la tienda / no aparece en el Stock.
  hiddenStore?: boolean;
  hiddenStock?: boolean;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_usd: number;
  price_ars: number | null;
  cost_usd: number | null;
  stock: number;
  short_description: string;
  description: string;
  specs: { label: string; value: string }[];
  gradient: string;
  images: string[] | null;
  published_online: boolean;
  hidden_stock?: boolean | null;
  hidden_store?: boolean | null;
};

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ProductCategory,
    priceUSD: Number(row.price_usd),
    priceARS: row.price_ars != null ? Number(row.price_ars) : undefined,
    costUSD: row.cost_usd != null ? Number(row.cost_usd) : undefined,
    stock: row.stock,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    specs: row.specs ?? [],
    gradient: row.gradient ?? "",
    images: row.images ?? [],
    publishedOnline: row.published_online,
    hiddenStock: row.hidden_stock ?? false,
    hiddenStore: row.hidden_store ?? false,
  };
}

function toRow(patch: Partial<Product>) {
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.priceUSD !== undefined) row.price_usd = patch.priceUSD;
  if (patch.priceARS !== undefined) row.price_ars = patch.priceARS ?? null;
  if (patch.costUSD !== undefined) row.cost_usd = patch.costUSD;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.shortDescription !== undefined) row.short_description = patch.shortDescription;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.specs !== undefined) row.specs = patch.specs;
  if (patch.gradient !== undefined) row.gradient = patch.gradient;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.publishedOnline !== undefined) row.published_online = patch.publishedOnline;
  if (patch.hiddenStock !== undefined) row.hidden_stock = patch.hiddenStock;
  if (patch.hiddenStore !== undefined) row.hidden_store = patch.hiddenStore;
  return row;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("value");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    value: c.value as ProductCategory,
    label: c.label as string,
    hiddenStore: c.hidden_store ?? false,
    hiddenStock: c.hidden_stock ?? false,
  }));
}

// Lo que ve el público: sin las categorías ocultas de la tienda.
export async function getPublicCategories(): Promise<Category[]> {
  return (await getCategories()).filter((c) => !c.hiddenStore);
}

async function hiddenStoreCategories(): Promise<Set<string>> {
  try {
    const cats = await getCategories();
    return new Set(cats.filter((c) => c.hiddenStore).map((c) => c.value));
  } catch {
    return new Set();
  }
}

export async function setCategoryHidden(
  value: string,
  patch: { hiddenStore?: boolean; hiddenStock?: boolean },
) {
  const row: Record<string, boolean> = {};
  if (patch.hiddenStore !== undefined) row.hidden_store = patch.hiddenStore;
  if (patch.hiddenStock !== undefined) row.hidden_stock = patch.hiddenStock;
  const { error } = await supabaseAuth.from("categories").update(row).eq("value", value);
  if (error) throw error;
}

export async function createCategory(value: string, label: string) {
  const { error } = await supabaseAuth.from("categories").insert({ value, label });
  if (error) throw error;
}

export async function updateCategoryLabel(value: string, label: string) {
  const { error } = await supabaseAuth.from("categories").update({ label }).eq("value", value);
  if (error) throw error;
}

export async function deleteCategory(value: string) {
  const { error } = await supabaseAuth.from("categories").delete().eq("value", value);
  if (error) throw error;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAuth
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published_online", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const hidden = await hiddenStoreCategories();
  return (data ?? []).map(fromRow).filter((p) => !hidden.has(p.category) && !p.hiddenStore);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const product = fromRow(data);
  if (product.hiddenStore || (await hiddenStoreCategories()).has(product.category)) return undefined;
  return product;
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await supabase.from("products").select("slug,category,hidden_store").eq("published_online", true);
  if (error) throw error;
  const hidden = await hiddenStoreCategories();
  return (data ?? [])
    .filter((r) => !hidden.has(r.category as string) && !r.hidden_store)
    .map((r) => r.slug as string);
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .eq("published_online", true)
    .neq("id", product.id)
    .limit(limit + 10);
  if (error) throw error;
  return (data ?? []).map(fromRow).filter((p) => !p.hiddenStore).slice(0, limit);
}

export async function createProduct(product: Product) {
  const { error } = await supabaseAuth.from("products").insert({ id: product.id, ...toRow(product) });
  if (error) throw error;
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  const { error } = await supabaseAuth.from("products").update(toRow(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabaseAuth.from("products").delete().eq("id", id);
  if (error) throw error;
}
