import type { Metadata } from "next";
import ProductDetailPage from "../page";
import { obtenerProductoPorSlug } from "../../lib/productos-db";
import { productSlug } from "../../lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await obtenerProductoPorSlug(slug);
  if (!product) return { title: "Producto no encontrado | Marca Estilo", robots: { index: false, follow: true } };

  const title = `${product.nombre || "Producto"} | Marca Estilo`;
  const description = String(product.descripcion || `Compra ${product.nombre || "este producto"} en Marca Estilo, moda masculina y camisetas exclusivas en Ecuador.`).slice(0, 160);
  const image = product.imagenes?.[0] || `${SITE_URL}/og-image.jpg`;
  const url = `${SITE_URL}/product-detail/${productSlug(product)}`;

  return {
    title,
    description,
    keywords: [product.nombre, "Marca Estilo", "camisetas para hombre", "moda masculina", "ropa urbana", "Ecuador"].filter((keyword): keyword is string => Boolean(keyword)),
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "Marca Estilo", images: [{ url: image, alt: product.nombre || "Producto Marca Estilo" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await obtenerProductoPorSlug(slug);
  const structuredData = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.nombre,
        description: product.descripcion,
        image: product.imagenes || [],
        brand: { "@type": "Brand", name: "Marca Estilo" },
        url: `${SITE_URL}/product-detail/${productSlug(product)}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: Number(product.precio || 0),
          availability: Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${SITE_URL}/product-detail/${productSlug(product)}`,
        },
      }
    : null;

  return (
    <>
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
      <ProductDetailPage params={{ slug }} />
    </>
  );
}