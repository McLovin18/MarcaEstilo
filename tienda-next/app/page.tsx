"use client";


import BottomBarPublic from "./components/BottomBarPublic";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import { useUser } from "./context/UserContext";

import { useEffect, useState, useRef } from "react";
import { getLandingPage } from "./lib/landing-db";
import ProductoCard from "./components/ProductoCard";
import { SectionRenderer } from "./landing/sectionRegistry";
import Hero360Section from "./landing/sections/Hero360Section";
import VideoSection from "./landing/sections/VideoSection";
import QuickProductsSection from "./landing/sections/QuickProductsSection";
import type { LandingSection } from "./lib/landing-types";
import { obtenerProductos, obtenerProductosDestacados, onProductosDestacadosChange } from "./lib/productos-db";
import { Loading3DIcon } from "./components/Loading3DIcon";

export default function Home() {
  const { isLogged } = useUser();
  const [landing, setLanding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [productosDestacados, setProductosDestacados] = useState<any[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLanding() {
      const landingData = await getLandingPage();
      setLanding(landingData);
    }
    fetchLanding();
  }, []);

  useEffect(() => {
    // Usar listener en tiempo real para que se actualice cuando cambien los productos destacados
    const unsubscribe = onProductosDestacadosChange((destacados) => {
      setProductosDestacados(destacados);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen  sm:py-6">
        <Loading3DIcon />
      </div>
    );
  }

  // Usar productos destacados dinámicos obtenidos del listener
  // Los productos destacados se actualizan en tiempo real cuando se marcan/desmarcan en el inventario
  const destacados = productosDestacados;

  // Normalizar secciones a LandingSection (migrando legacy si hace falta)
  const rawSections: any[] = landing?.sections || [];
  const sections: LandingSection[] = rawSections.map((s: any, index: number) => {
    let base: LandingSection;
    if (s && s.props) {
      base = s as LandingSection;
    } else {
      base = {
        id: s.id || `section-${index}`,
        type: s.type || "banner",
        props: {
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          image: s.image || s.imageUrl || null,
        },
        styles: {},
        order: s.order ?? index + 1,
        hidden: false,
      };
    }

    // Si la sección es de tipo featuredProducts, inyectamos los
    // productos destacados dinámicos desde Firestore.
    if (base.type === "featuredProducts") {
      return {
        ...base,
        props: {
          ...(base.props || {}),
          products: destacados,
        },
      };
    }

    return base;
  });

  // Agregar secciones estáticas al inicio: Video y QuickProducts
  const staticSections: LandingSection[] = [
    {
      id: "video-static",
      type: "video",
      order: 0,
      props: {
        videoUrl: "/video.mp4",
        title: "",
        subtitle: "",
        height: "280px",
      },
      styles: {},
      hidden: false,
    },
    {
      id: "quickproducts-static",
      type: "quickProducts",
      order: 1,
      props: {
        defaultCategoryId: "1776073836098",
        defaultCategoryName: "Camisetas Deportivas",
        title: "Últimas actualizaciones",
        subtitle: "Descubre nuestros productos destacados",
      },
      styles: {},
      hidden: false,
    },
  ];

  // Filtrar para excluir secciones de tipo hero360
  // Luego insertar secciones estáticas al inicio
  const allSections = [...staticSections, ...sections.filter((s) => s.type !== "hero360")];

  return (
    <>
      {/* Botón flotante de WhatsApp aún más arriba */}
      <WhatsAppFloatingButton />
      <div className="bg-white dark:bg-black text-slate-900 dark:text-white min-h-screen flex flex-col w-full">
        <main className="flex-1 w-full flex flex-col gap-0">
          {/* Todas las secciones incluyendo Hero360 renderizadas por orden */}
          {allSections
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => (
              <div key={section.id}>
                <SectionRenderer section={section} />
                {/* Mostrar PlansSection después de Hero360 */}
                {section.id === "hero360-static" && showPlans && (
                  <div ref={plansRef}>
                  </div>
                )}
              </div>
            ))}
        </main>
      </div>
      {/* Mostrar BottomBarPublic solo si NO está autenticado */}
      {!isLogged && <BottomBarPublic />}
    </>
  );
}

