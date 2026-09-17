import { supabase } from "./supabase";

export type ProductCategory =
  | "paneles"
  | "inversores"
  | "baterias"
  | "estructuras"
  | "accesorios";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  priceUSD: number;
  costUSD?: number;
  stock: number;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  gradient: string;
  // false = existe en el inventario interno pero todavía no se publicó en /tienda.
  publishedOnline?: boolean;
};

export type Category = { value: ProductCategory; label: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_usd: number;
  cost_usd: number | null;
  stock: number;
  short_description: string;
  description: string;
  specs: { label: string; value: string }[];
  gradient: string;
  published_online: boolean;
};

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ProductCategory,
    priceUSD: Number(row.price_usd),
    costUSD: row.cost_usd != null ? Number(row.cost_usd) : undefined,
    stock: row.stock,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    specs: row.specs ?? [],
    gradient: row.gradient ?? "",
    publishedOnline: row.published_online,
  };
}

function toRow(patch: Partial<Product>) {
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.priceUSD !== undefined) row.price_usd = patch.priceUSD;
  if (patch.costUSD !== undefined) row.cost_usd = patch.costUSD;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.shortDescription !== undefined) row.short_description = patch.shortDescription;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.specs !== undefined) row.specs = patch.specs;
  if (patch.gradient !== undefined) row.gradient = patch.gradient;
  if (patch.publishedOnline !== undefined) row.published_online = patch.publishedOnline;
  return row;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("value");
  if (error) throw error;
  return (data ?? []).map((c) => ({ value: c.value as ProductCategory, label: c.label as string }));
}

export async function createCategory(value: string, label: string) {
  const { error } = await supabase.from("categories").insert({ value, label });
  if (error) throw error;
}

export async function updateCategoryLabel(value: string, label: string) {
  const { error } = await supabase.from("categories").update({ label }).eq("value", value);
  if (error) throw error;
}

export async function deleteCategory(value: string) {
  const { error } = await supabase.from("categories").delete().eq("value", value);
  if (error) throw error;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
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
  return (data ?? []).map(fromRow);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await supabase.from("products").select("slug").eq("published_online", true);
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .eq("published_online", true)
    .neq("id", product.id)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createProduct(product: Product) {
  const { error } = await supabase.from("products").insert({ id: product.id, ...toRow(product) });
  if (error) throw error;
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  const { error } = await supabase.from("products").update(toRow(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
