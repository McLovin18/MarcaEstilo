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

  return (
    <>
      <WhatsAppFloatingButton />
      <main className="min-h-screen w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        {loading ? (
          <div className="flex min-h-screen items-center justify-center px-6 text-sm text-slate-500">
            Cargando landing...
          </div>
        ) : landingSections.length > 0 ? (
          <div className="flex flex-col">
            {landingSections.map((section) => (
              <SectionRenderer key={section.id} section={section} />
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
