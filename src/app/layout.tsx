import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { SITE_FULL_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { PageFooter } from "@/components/PageFooter";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "CONECTA",
  title: { default: SITE_FULL_NAME, template: "%s | CONECTA" },
  description: SITE_DESCRIPTION,
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-32px.png", sizes: "32x32", type: "image/png" }], apple: "/brand/favicon-192px.png" },
  openGraph: { type: "website", locale: "es_CU", url: SITE_URL, siteName: "CONECTA", title: "CONECTA · El conocimiento nos conecta", description: "Ciencia, tecnología y colaboración en un ecosistema digital para la educación superior cubana.", images: [{ url: "/brand/og-conecta-1200x630.png", width: 1200, height: 630, alt: "CONECTA · Ciencia, tecnología y colaboración" }] },
  twitter: { card: "summary_large_image", title: "CONECTA · El conocimiento nos conecta", description: SITE_DESCRIPTION, images: ["/brand/og-conecta-1200x630.png"] },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className={`${inter.variable} ${plexMono.variable} font-sans antialiased bg-gray-50 text-gray-900`}><AppShell />{children}<PageFooter /></body></html>;
}
