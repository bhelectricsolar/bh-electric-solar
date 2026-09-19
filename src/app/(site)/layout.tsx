import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import SheetManager from "@/components/SheetManager";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/store/CartDrawer";
import { getExchangeRate } from "@/lib/exchange-rate";

const displayFont = Outfit({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const dataFont = IBM_Plex_Mono({
  variable: "--font-data",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paneles Solares en Misiones Argentina | BH Electric Solar",
  description:
    "Diseñamos e instalamos sistemas de energía solar fotovoltaica para hogares, empresas e industrias en Misiones, Argentina.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const exchangeRate = await getExchangeRate();
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <SheetManager />
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <CartDrawer exchangeRate={exchangeRate} />
        </CartProvider>
      </body>
    </html>
  );
}
