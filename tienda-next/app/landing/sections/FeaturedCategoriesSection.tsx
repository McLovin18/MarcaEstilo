"use client";

import React from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";

export type FeaturedCategoryItem = {
  title?: string;
  image?: string | null;
  link?: string;
};

export type FeaturedCategoriesSectionProps = {
  title?: string;
  items?: FeaturedCategoryItem[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "desktop" | "mobile";
};

export default function FeaturedCategoriesSection({
  title,
  items,
  styles,
  fieldStyles,
  device,
}: FeaturedCategoriesSectionProps) {
  const bg = styles?.backgroundColor;
  const color = styles?.textColor;
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");

  const categories = (items || []).filter(
    (c) => c && (c.title || c.image || c.link)
  );

  if (!categories.length && !title) return null;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [itemsPerView, setItemsPerView] = React.useState(3);

  React.useEffect(() => {
    if (device === "mobile") {
      setItemsPerView(1);
      return;
    }

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(1); // móviles: 1 card a la vez
      else if (width < 1024) setItemsPerView(2); // tablets/medianas: 2 cards
      else setItemsPerView(3); // laptops y mayores: 3 cards
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [device]);

  const hasCarousel = categories.length > itemsPerView;

  React.useEffect(() => {
    if (!hasCarousel) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % categories.length);
    }, 3000);
    return () => clearInterval(id);
  }, [hasCarousel, categories.length]);

  const getVisibleItems = () => {
    if (!hasCarousel) return categories;
    const visible: FeaturedCategoryItem[] = [];
    for (let i = 0; i < itemsPerView; i++) {
      visible.push(categories[(currentIndex + i) % categories.length]);
    }
    return visible;
  };

  const visibleItems = getVisibleItems();

  const goPrev = () => {
    if (!hasCarousel) return;
    setCurrentIndex((prev) =>
      prev === 0 ? categories.length - 1 : (prev - 1) % categories.length
    );
  };

  const goNext = () => {
    if (!hasCarousel) return;
    setCurrentIndex((prev) => (prev + 1) % categories.length);
  };

  return (
    <section
      style={{
        ...(bg ? { backgroundColor: bg } : {}),
        ...(color ? { color } : {}),
        paddingTop,
        paddingBottom,
      }}
      className="px-4 lg:px-6 m-0"
    >
      <div className="max-w-6xl mx-auto text-slate-900 dark:text-white relative ">
        {title && (
          <h2
            className="section-title py-2 text-center"
            style={fieldStyles?.title || { color: "var(--text)" }}
          >
            {title}
          </h2>
        )}

        {hasCarousel && (
          <>
            <button
              type="button"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center"
              onClick={goPrev}
            >
              <span className="material-icons-round text-sm">chevron_left</span>
            </button>
            <button
              type="button"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center"
              onClick={goNext}
            >
              <span className="material-icons-round text-sm">chevron_right</span>
            </button>
          </>
        )}

        <div
          className={`grid gap-1 md:gap-4 ${
            visibleItems.length === 1
              ? "grid-cols-1 place-items-center"
              : visibleItems.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {visibleItems.map((cat, idx) => (
            <a
              key={idx}
              href={cat.link || "#"}
              className="group block w-full max-w-md md:max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 md:p-1 hover:border-[#E0A11A] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {cat.image && (
                <div className="aspect-square w-full h-80 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                  <img
                    src={cat.image}
                    alt={cat.title || "Categoría"}
                    className="w-full h-full rounded-2xl object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              {cat.title && (
                <h3
                  className="section-subtitle page-lead text-center md:text-left"
                  style={fieldStyles?.itemTitle || { color: "var(--text, #1e293b)" }}
                >
                  {cat.title}
                </h3>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

