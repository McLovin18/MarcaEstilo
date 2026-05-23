"use client";

import { useEffect, useMemo, useState } from "react";

import BottomBarPublic from "./components/BottomBarPublic";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import { SectionRenderer } from "./landing/sectionRegistry";
import { getLandingPage } from "./lib/landing-db";
import type { LandingSection } from "./lib/landing-types";
import { useUser } from "./context/UserContext";

export default function Home() {
  const { isLogged } = useUser();
  const [landing, setLanding] = useState<{
    hero?: Record<string, any> | null;
    sections?: LandingSection[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadLanding = async () => {
      try {
        const data = await getLandingPage();
        if (mounted) {
          setLanding(data);
        }
      } catch (error) {
        console.error("Error cargando landing publicada:", error);
        if (mounted) {
          setLanding(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLanding();

    return () => {
      mounted = false;
    };
  }, []);





  const landingSections = useMemo(() => {
    const sections = landing?.sections ?? [];
    const heroSection = landing?.hero
      ? [
          {
            id: "landing-hero",
            type: "hero",
            props: landing.hero,
            order: -1,
            hidden: false,
          } as LandingSection,
        ]
      : [];

    return [...heroSection, ...sections]
      .filter((section) => !section.hidden)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [landing]);


    // Detecta el índice del último hero
const lastHeroIndex = useMemo(() => {
  let last = -1;
  landingSections.forEach((s, i) => {
    if (s.type === "hero") last = i;
  });
  return last;
}, [landingSections]);

  return (
    <>
      <WhatsAppFloatingButton />
      <main className="min-h-screen w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        {loading ? (
        <div
            className="w-full bg-slate-950 relative overflow-hidden"
            style={{ aspectRatio: "2400 / 1000", minHeight: "300px" }}
        >
            <div className="absolute inset-0 bg-slate-900" />
            <div
            className="absolute inset-0"
            style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
                animation: "shimmer 1.8s infinite",
                backgroundSize: "200% 100%",
            }}
            />
            <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            `}</style>
        </div>
        ) : landingSections.length > 0 ? (
          <div className="flex flex-col">
            {landingSections.map((section, index) => (
            <SectionRenderer 
                key={section.id} 
                section={section}
                isLastHero={section.type === "hero" && index === lastHeroIndex}
            />
            ))}
          </div>
        ) : (
          <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-slate-500">
            No hay secciones publicadas para mostrar.
          </div>
        )}
      </main>
      {!isLogged && <BottomBarPublic />}
    </>
  );
}
