import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export const metadata: Metadata = {
  title: "Detalle de producto | Marca Estilo",
  description: "Conoce los detalles, materiales, tallas y disponibilidad de nuestros productos exclusivos para hombre en Marca Estilo.",
  keywords: ["detalle de producto", "camisetas exclusivas", "camisetas hombre", "Marca Estilo", "moda masculina Ecuador"],
  alternates: { canonical: `${SITE_URL}/product-detail` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/product-detail`,
    title: "Detalle de producto | Marca Estilo",
    description: "Consulta características, tallas y disponibilidad de productos Marca Estilo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Detalle de producto | Marca Estilo",
    description: "Conoce todos los detalles de tus productos favoritos.",
  },
};

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
