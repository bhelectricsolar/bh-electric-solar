import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "../admin/admin-globals.css";

const displayFont = Outfit({ variable: "--font-display", weight: ["700", "800"], subsets: ["latin"] });
const bodyFont = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ingresar | BH Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
      <body className="min-h-dvh bg-[#081127] text-white">{children}</body>
    </html>
  );
}
