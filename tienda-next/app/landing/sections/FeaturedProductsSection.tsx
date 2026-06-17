"use client";

import React from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";
import ProductoCard from "../../components/ProductoCard";

export type FeaturedProductsSectionProps = {
  title?: string;
  products?: any[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
};

export default function FeaturedProductsSection({
  title = "Productos destacados",
  products = [],
  styles,
  fieldStyles,
}: FeaturedProductsSectionProps) {
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "0.5rem");

  // ── Return condicional DESPUÉS de todos los hooks ──
  if (!products.length) return null;

  return (
    <section
      style={{ paddingTop, paddingBottom }}
      className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
    >
      {/* Título */}
      {title && (
        <h2
          className="section-title text-center py-2"
          style={fieldStyles?.title || { color: "var(--text)" }}
        >
          {title}
        </h2>
      )}

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-12">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products
            .filter((prod: any) => prod && prod.id)
            .map((prod: any, idx: number) => (
              <div
                key={prod.id}
                className="transition-all duration-300 flex flex-col items-stretch justify-stretch h-full w-full"
                style={{ minWidth: 0 }}
              >
                <ProductoCard producto={prod} index={idx} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
