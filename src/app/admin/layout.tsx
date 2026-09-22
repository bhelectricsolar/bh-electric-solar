import type { Metadata, Viewport } from "next";
import SheetManager from "@/components/SheetManager";
import { Outfit, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./admin-globals.css";
import InstallServiceWorker from "./InstallServiceWorker";
import { ThemeProvider, THEME_INIT_SCRIPT } from "./ThemeProvider";
import { AdminSettingsProvider } from "@/lib/admin-settings";
import AdminShell from "./AdminShell";

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
  title: "BH Admin",
  description: "Panel de administración de la tienda BH Electric Solar.",
  robots: { index: false, follow: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BH Admin",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // El ícono de iPhone lo pone solo Next desde src/app/apple-icon.png,
    // igual en todas las páginas (sitio, login y admin) — así da lo mismo
    // desde cuál la agregues a la pantalla de inicio.
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1a38",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background text-ink">
        <InstallServiceWorker />
        <SheetManager />
        <ThemeProvider>
          <AdminSettingsProvider>
            <AdminShell>{children}</AdminShell>
          </AdminSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
