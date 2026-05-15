"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ProductoCard from "../../components/ProductoCard";
import type { LandingSectionStyles, LandingFieldStyle } from "../../lib/landing-types";

export type QuickProductsSectionProps = {
  defaultCategoryId?: string;
  defaultCategoryName?: string;
  title?: string;
  subtitle?: string;
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
};

export default function QuickProductsSection({
  defaultCategoryId = "1776073836098", // Camisetas deportivas
  defaultCategoryName = "Camisetas Deportivas",
  title = "Últimas actualizaciones",
  subtitle = "Descubre nuestros productos destacados",
  styles,
  fieldStyles,
}: QuickProductsSectionProps) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategoryId);
  const [productos, setProductos] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Cargar categorías
  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const q = query(categoriasRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(cats.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
    });

    return () => unsubscribe();
  }, []);

  // Cargar productos de la categoría seleccionada
  useEffect(() => {
    if (!selectedCategoryId) {
      setProductos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const productosRef = collection(db, "productos");
    const q = query(productosRef, where("categoria", "==", selectedCategoryId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(prods.slice(0, 12)); // Limitar a 12 productos
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategoryId]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      const query = encodeURIComponent(searchValue.trim());
      window.location.href = `/search-results?query=${query}`;
    }
  };

  return (
    <section className="w-full m-0" style={{ background: "var(--background)" }}>
      <div className="w-full px-5 md:px-10 py-3 md:py-4 lg:py-4">

        {/* Search Input */}
        <div className="mb-4 relative">
          <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/10 focus-within:border-[#E0A11A] transition-colors">
            <span className="material-icons-round text-xl text-slate-400 dark:text-slate-500">
              manage_search
            </span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              className="flex-1 outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>
        </div>

        {/* Categorías Filter - Scroll Horizontal */}
        <div className="mb-8 overflow-x-auto " ref={categoriesScrollRef}>
          <div className="flex gap-2 min-w-max">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                  selectedCategoryId === cat.id
                    ? "shadow-md scale-105 bg-[#E0A11A] text-white"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {cat.icono && <span className="mr-1">🏷️</span>}
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Productos Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E0A11A]" />
          </div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {productos
              .filter((producto: any) => producto && producto.id)
              .map((producto: any) => (
              <div key={producto.id} className="h-full">
                <ProductoCard producto={producto} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No hay productos en esta categoría</p>
          </div>
        )}

        {/* Ver más link */}
        {productos.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href={`/products-by-category?cat=${selectedCategoryId}`}
              className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#E0A11A] text-white hover:bg-[#d89213] transition-all shadow-md hover:shadow-lg"
            >
              Ver más productos
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

