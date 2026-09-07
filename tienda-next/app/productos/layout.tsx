import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export const metadata: Metadata = {
  title: "Productos | Camisetas exclusivas para hombre",
  description: "Explora el catálogo de Marca Estilo: camisetas exclusivas, moda masculina y ropa urbana con envíos a todo Ecuador.",
  keywords: ["productos Marca Estilo", "camisetas para hombre", "camisetas Ecuador", "ropa urbana", "moda masculina"],
  alternates: { canonical: `${SITE_URL}/productos` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/productos`,
    title: "Productos | Marca Estilo",
    description: "Compra camisetas exclusivas y moda masculina de Marca Estilo en Ecuador.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Productos | Marca Estilo",
    description: "Camisetas exclusivas y moda masculina para hombre.",
  },
};

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
