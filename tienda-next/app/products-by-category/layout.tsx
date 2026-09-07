import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export const metadata: Metadata = {
  title: "Categorías | Camisetas y moda masculina",
  description: "Descubre las categorías de Marca Estilo y encuentra camisetas exclusivas, ropa urbana y moda masculina para cada estilo.",
  keywords: ["categorías de ropa", "camisetas hombre", "moda masculina", "ropa urbana Ecuador", "Marca Estilo"],
  alternates: { canonical: `${SITE_URL}/products-by-category` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/products-by-category`,
    title: "Categorías | Marca Estilo",
    description: "Explora camisetas exclusivas y moda masculina organizadas por categorías.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorías | Marca Estilo",
    description: "Encuentra tu próximo estilo en las categorías de Marca Estilo.",
  },
};

export default function ProductsByCategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
