import type { Metadata } from "next";
import ProductsByCategoryPage from "../page";
import { obtenerCategorias } from "../../lib/categorias-db";
import { slugify } from "../../lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : "https://marcaestilo.com");

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categories = await obtenerCategorias();
  const current = categories.find((item: any) => slugify(item.nombre) === category);
  const name = current?.nombre || category.replace(/-/g, " ");
  const title = `${name} | Ropa y camisetas | Marca Estilo`;
  const description = `Descubre ${name} en Marca Estilo: camisetas y moda masculina con diseños exclusivos, envíos a todo Ecuador.`;
  return { title, description, keywords: [name, "Marca Estilo", "camisetas Ecuador", "moda masculina"], alternates: { canonical: `${SITE_URL}/products-by-category/${category}` }, openGraph: { type: "website", url: `${SITE_URL}/products-by-category/${category}`, title, description } };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categories = await obtenerCategorias();
  const current = categories.find((item: any) => slugify(item.nombre) === category);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: current?.nombre || category.replace(/-/g, " "),
    description: `Productos de ${current?.nombre || category.replace(/-/g, " ")} en Marca Estilo.`,
    url: `${SITE_URL}/products-by-category/${category}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProductsByCategoryPage routeCategory={category} />
    </>
  );
}