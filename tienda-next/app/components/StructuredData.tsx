/**
 * Componente para agregar estructuras de datos JSON-LD (Schema.org)
 * Esto ayuda a Google a entender mejor tu sitio
 */

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TecnoThings",
    url: "https://tecnothings.ec",
    logo: "https://tecnothings.ec/logo.png",
    description: "Tienda online especializada en PC Gamer y componentes",
    sameAs: [
      "https://www.facebook.com/tecnothings",
      "https://www.instagram.com/tecnothings",
      "https://www.youtube.com/tecnothings",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "EC",
      addressLocality: "Quito", // Ajusta según tu ubicación
      postalCode: "170103",
      streetAddress: "Tu dirección aquí", // Actualiza
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      telephone: "+593-XXX-XXXX", // Actualiza
      email: "soporte@tecnothings.ec",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TecnoThings",
    url: "https://tecnothings.ec",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://tecnothings.ec/products-by-category?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TecnoThings",
    image: "https://tecnothings.ec/logo.png",
    description:
      "Tienda online de PC Gamer y componentes gaming con envíos a Ecuador",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tu dirección aquí",
      addressLocality: "Quito",
      addressRegion: "Pichincha",
      postalCode: "170103",
      addressCountry: "EC",
    },
    telephone: "+593-XXX-XXXX",
    email: "soporte@tecnothings.ec",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: "EC",
    priceRange: "$$",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
    </>
  );
}

