import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { formatUSD } from "@/lib/currency";
import Badge from "@/components/Badge";
import AddToCartButton from "@/components/store/AddToCartButton";
import ProductCard from "@/components/store/ProductCard";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | BH Electric Solar`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);

  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <nav className="text-xs text-body">
          <Link href="/tienda" className="hover:text-ink">
            Tienda
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div
            className={`flex h-72 items-end justify-end rounded-2xl bg-gradient-to-br p-4 sm:h-96 ${product.gradient}`}
          >
            {product.stock <= 8 && (
              <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
                Últimas unidades
              </span>
            )}
          </div>

          <div>
            <Badge>
              {product.category === "paneles" && "Paneles solares"}
              {product.category === "inversores" && "Inversores"}
              {product.category === "baterias" && "Baterías"}
              {product.category === "estructuras" && "Estructuras de montaje"}
              {product.category === "accesorios" && "Accesorios"}
            </Badge>
            <h1 className="balance mt-4 text-3xl font-extrabold leading-tight text-ink">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-body">
              {product.description}
            </p>

            <p className="font-data mt-6 text-4xl font-semibold text-ink">
              {formatUSD(product.priceUSD)}
            </p>
            <p className="mt-1 text-xs text-body">
              {product.stock > 0
                ? `${product.stock} unidades disponibles`
                : "Sin stock — consultanos por próximo ingreso"}
            </p>

            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>

            <div className="mt-10 border-t border-ink/10 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-body">
                Especificaciones
              </h2>
              <dl className="mt-4 flex flex-col gap-3">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-4 border-b border-ink/5 pb-3 text-sm"
                  >
                    <dt className="text-body">{spec.label}</dt>
                    <dd className="font-data font-medium text-ink">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-xl font-bold text-ink">
              También te puede interesar
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
