import { MetadataRoute } from 'next';
import admin from './lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { slugify, productSlug } from './lib/seo';

// Inicializar Firebase Admin (si no está ya inicializado)
let db: any;
try {
  db = getFirestore(admin.app());
} catch (error) {
  console.log('Firebase Admin init (sitemap):', error);
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_DOMAIN ? `https://${process.env.NEXT_PUBLIC_DOMAIN}` : 'https://marcaestilo.com');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    // Rutas estáticas principales
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/politicas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Agregar URLs dinámicas de productos
    const productosSnapshot = await db.collection('productos').get();
    const productosUrls = productosSnapshot.docs.map((doc: any) => ({
      url: `${BASE_URL}/product-detail/${productSlug({ id: doc.id, nombre: doc.data().nombre })}`,
      lastModified: doc.data().updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    routes.push(...productosUrls);

    // Agregar URLs dinámicas de blogs publicados
    const blogsSnapshot = await db
      .collection('blogs')
      .where('status', '==', 'published')
      .get();
    const blogsUrls = blogsSnapshot.docs.map((doc: any) => ({
      url: `${BASE_URL}/blogs/${doc.id}`,
      lastModified: doc.data().updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    routes.push(...blogsUrls);

    // Agregar URLs dinámicas de categorías
    const categoriasSnapshot = await db.collection('categorias').get();
    const categoriasUrls = categoriasSnapshot.docs
      .map((doc: any) => {
        const urls = [];
        const categoria = doc.data();
        // URL principal de la categoría
        urls.push({
          url: `${BASE_URL}/products-by-category/${slugify(categoria.nombre || doc.id)}`,
          lastModified: categoria.updatedAt || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
        return urls;
      })
      .flat();
    routes.push(...categoriasUrls);
  } catch (error) {
    console.error('Error generando sitemap:', error);
    // Continuar sin URLs dinámicas si hay error
  }

  return routes;
}
