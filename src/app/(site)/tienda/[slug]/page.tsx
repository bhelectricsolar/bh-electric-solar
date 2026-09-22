import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getCategories, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getExchangeRate } from "@/lib/exchange-rate";
import { formatUSD, formatARS } from "@/lib/currency";
import Badge from "@/components/Badge";
import AddToCartButton from "@/components/store/AddToCartButton";
import ProductCard from "@/components/store/ProductCard";
import ProductGallery from "@/components/store/ProductGallery";

export const revalidate = 0;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
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
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, exchangeRate, categories] = await Promise.all([
    getRelatedProducts(product),
    getExchangeRate(),
    getCategories().catch(() => []),
  ]);
  const categoryLabel = categories.find((c) => c.value === product.category)?.label ?? product.category;
  const arsPrice = product.priceARS ?? product.priceUSD * exchangeRate;

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
          <ProductGallery
            images={product.images ?? []}
            gradient={product.gradient}
            name={product.name}
            lowStock={product.stock <= 8}
          />

          <div>
            <Badge>{categoryLabel}</Badge>
            <h1 className="balance mt-4 text-3xl font-extrabold leading-tight text-ink">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-body">
              {product.description}
            </p>

            <div className="premium-surface mt-6 rounded-2xl border border-ink/10 bg-cream-100 p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-data text-4xl font-extrabold text-ink">
                  {formatUSD(product.priceUSD)}
                </span>
                <span className="font-data text-base font-medium text-body">
                  {formatARS(arsPrice)}
                </span>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-body/70">
                Precio de contado · pesos estimado al dólar blue
              </p>
              <p className="mt-3 text-xs font-semibold text-ink">
                {product.stock > 0
                  ? `${product.stock} unidades disponibles`
                  : "Sin stock — consultanos por próximo ingreso"}
              </p>
            </div>

            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TrustItem
                icon="M3 12l2-6h14l2 6M5 12v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h6v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-7M5 12h14"
                title="Envío a todo el país"
                detail="Coordinado por zona"
              />
              <TrustItem
                icon="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4Z"
                title="Garantía de fábrica"
                detail="Según especificación"
              />
              <TrustItem
                icon="M2.5 12a9.5 9.5 0 1 1 3.6 7.4L2 20l.6-4a9.4 9.4 0 0 1-.1-4Z"
                title="Pago coordinado"
                detail="Directo por WhatsApp"
              />
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
                <ProductCard key={p.id} product={p} exchangeRate={exchangeRate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TrustItem({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-white px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-900/5 text-navy-900">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold leading-tight text-ink">{title}</p>
        <p className="text-[11px] leading-tight text-body">{detail}</p>
      </div>
    </div>
  );
}
