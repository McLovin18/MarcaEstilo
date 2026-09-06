import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export const metadata: Metadata = {
  title: "Blog de moda masculina y camisetas | Marca Estilo",
  description: "Consejos de estilo, tendencias y novedades de Marca Estilo para vestir mejor con camisetas exclusivas en Ecuador.",
  keywords: ["blog de moda masculina", "camisetas hombre", "tendencias de moda", "Marca Estilo"],
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: { type: "website", url: `${SITE_URL}/blogs`, title: "Blog de Marca Estilo", description: "Tendencias, consejos de estilo y novedades de moda masculina." },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}