import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/store/CheckoutForm";
import { getExchangeRate } from "@/lib/exchange-rate";
import { getPublicShippingZones, type PublicShippingZone } from "@/lib/store-checkout";

export const metadata: Metadata = {
  title: "Finalizar pedido | BH Electric Solar",
  description: "Dejá tus datos y elegí cómo recibir tu pedido. Un asesor coordina el pago con vos.",
  robots: { index: false },
};

export const revalidate = 0;

export default async function CheckoutPage() {
  const [exchangeRate, zones] = await Promise.all([
    getExchangeRate(),
    getPublicShippingZones().catch((): PublicShippingZone[] => []),
  ]);
  return (
    <section className="bg-cream-100/40 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <nav className="text-xs text-body">
          <Link href="/tienda" className="hover:text-ink">
            Tienda
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">Finalizar pedido</span>
        </nav>
        <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Finalizá tu pedido</h1>
        <p className="mt-2 max-w-2xl text-sm text-body">
          Dejá tus datos y elegí cómo recibirlo. No pagás ahora: un asesor te contacta para confirmar y coordinar el pago.
        </p>
        <div className="mt-8">
          <CheckoutForm zones={zones} exchangeRate={exchangeRate} storeName="BH Electric Solar" />
        </div>
      </div>
    </section>
  );
}
