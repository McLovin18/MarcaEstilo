"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ProductoCard from "../components/ProductoCard";
import { obtenerProductos } from "../lib/productos-db";
import { getCatalogPricing } from "../lib/pricing";
import type { Producto } from "../lib/productos-db";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
} from "../lib/categorias-db";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function OfertasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Posición calculada del dropdown móvil (relativa al viewport, vía portal)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const catButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cierra el dropdown móvil solo si el scroll/resize ocurre FUERA del propio dropdown
  useEffect(() => {
    if (!isMobile || !hoveredCatId) return;
    const close = (e: Event) => {
      if (
        mobileDropdownRef.current &&
        e.target instanceof Node &&
        mobileDropdownRef.current.contains(e.target)
      ) {
        return;
      }
      setHoveredCatId(null);
      setDropdownPos(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isMobile, hoveredCatId]);

  useEffect(() => {
    let mounted = true;
    async function fetchProductos() {
      setLoading(true);
      const prods = await obtenerProductos({ incluirSinStock: true });
      if (!mounted) return;
      setProductos(prods);
      setLoading(false);
    }


    fetchProductos().catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);



    useEffect(() => {
      const categoriasRef = collection(db, "categorias");
      const q = query(categoriasRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
      });

      return () => unsubscribe();
    }, []);



  const productosOferta = useMemo(() => {
    return productos.filter((producto) => {
      const hasDiscount = getCatalogPricing(producto).hasDiscount;

      const matchCategory =
        !selectedCategoryId ||
        sameCategoryId(producto.categoria, selectedCategoryId);

      return hasDiscount && matchCategory;
    });
  }, [productos, selectedCategoryId]);

  // Abre el dropdown móvil calculando la posición real del botón en pantalla
  const openMobileSubcats = useCallback((catId: string) => {
    if (hoveredCatId === catId) {
      setHoveredCatId(null);
      setDropdownPos(null);
      return;
    }
    const btn = catButtonRefs.current[catId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const dropdownWidth = 220;
      const left = Math.min(
        Math.max(rect.left, 16),
        window.innerWidth - dropdownWidth - 16
      );
      setDropdownPos({
        top: rect.bottom + 6,
        left,
        width: dropdownWidth,
      });
    }
    setHoveredCatId(catId);
  }, [hoveredCatId]);

  const closeMobileSubcats = useCallback(() => {
    setHoveredCatId(null);
    setDropdownPos(null);
  }, []);

  const hoveredCat = categorias.find((c) => c.id === hoveredCatId);

  return (
    <div className="min-h-screen bg-black bg-linear-to-b dark:from-black dark:via-slate-950 dark:to-black text-slate-900 dark:text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Oferta especial</p>
            <h1 className="mt-2 text-3xl font-black text-white tracking-tight sm:text-4xl">Productos con descuento</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Aquí solo aparecen los productos que tienen descuento real aplicado al precio de compra.
            </p>
          </div>
          <Link
            href="/products-by-category"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Ver catálogo
            <span className="material-icons-round text-base">arrow_forward</span>
          </Link>
        </div>
        
        <div className="mb-8 relative z-50">
          <div className={`${isMobile && !hoveredCatId ? 'overflow-x-auto' : ''} ${isMobile && hoveredCatId ? 'overflow-hidden' : ''}`}>
            <div className="flex gap-2 min-w-max">

            <button
              onClick={() => setSelectedCategoryId("")}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                selectedCategoryId === ""
                  ? "shadow-sm scale-105 bg-black text-white border border-black"
                  : "bg-white text-slate-900 border border-slate-300 hover:border-black/60 hover:shadow-sm"
              }`}
            >
              Todas
            </button>

            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => !isMobile && setHoveredCatId(cat.id)}
                onMouseLeave={() => !isMobile && setHoveredCatId(null)}
              >
                <button
                  ref={(el) => {
                    catButtonRefs.current[cat.id] = el;
                  }}
                  onClick={() => {
                    if (isMobile && cat.subcategorias && cat.subcategorias.length > 0) {
                      openMobileSubcats(cat.id);
                    } else {
                      setSelectedCategoryId(cat.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                    selectedCategoryId === cat.id
                      ? "shadow-sm scale-105 bg-black text-white border border-black"
                      : "bg-white text-slate-900 border border-slate-300 hover:border-black/60 hover:shadow-sm"
                  }`}
                >
                  {cat.nombre}
                  {cat.subcategorias && cat.subcategorias.length > 0 && (
                    <span className="ml-1 text-xs">▼</span>
                  )}
                </button>
                {/* Dropdown desktop: se mantiene igual (funciona bien) */}
                {!isMobile && cat.subcategorias && cat.subcategorias.length > 0 && hoveredCatId === cat.id && (
                  <div className="absolute top-full mt-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[99999] min-w-[200px] max-h-[300px] overflow-y-auto py-2">
                    {cat.subcategorias.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategoryId(cat.id);
                          setHoveredCatId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm transition-colors text-slate-900 hover:bg-slate-100"
                      >
                        {sub.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Dropdown móvil: renderizado vía portal en document.body, posicionado con coordenadas reales del botón. Así escapa del scroll horizontal del carrusel de categorías y no se cierra al hacer scroll dentro de sí mismo. */}
        {isMobile && hoveredCatId && dropdownPos && hoveredCat?.subcategorias?.length > 0 &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[99998]"
                onClick={closeMobileSubcats}
              />
              <div
                ref={mobileDropdownRef}
                style={{
                  position: "fixed",
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                }}
                className="bg-white border border-slate-200 rounded-xl shadow-xl z-[99999] max-h-[300px] overflow-y-auto py-2"
              >
                {hoveredCat.subcategorias.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategoryId(hoveredCat.id);
                      closeMobileSubcats();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm transition-colors text-slate-900 hover:bg-slate-100"
                  >
                    {sub.nombre}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/3">
            Cargando ofertas...
          </div>
        ) : productosOferta.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm dark:border-white/15 dark:bg-white/3">
            <h2 className="text-xl font-semibold">No hay ofertas activas</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              En este momento no hay productos con descuento publicado.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
              <span className="material-icons-round text-base">local_offer</span>
              {productosOferta.length} productos en oferta
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {productosOferta.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  showCart
                  showEye
                  isCompact={false}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}