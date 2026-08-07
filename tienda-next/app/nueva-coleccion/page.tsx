"use client";
import BottomBarPublic from "../components/BottomBarPublic";
import ProductoCard from "../components/ProductoCard";
import { Loading3DIcon } from "../components/Loading3DIcon";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { 
  obtenerProductosPorBodega
} from "../lib/productos-db";
import { obtenerBodegas } from "../lib/bodegas-db";
import {
  obtenerCategorias,
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
} from "../lib/categorias-db";
import { useUser } from "../context/UserContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function NuevaColeccionPage() {
  const isLogged = useUser();

  // --- Estados de datos ---
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [bodegaNombre, setBodegaNombre] = useState("");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

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

  // --- Estados de filtros ---
  const [search, setSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mapeo de nombres de categorías
  const [catMap, setCatMap] = useState<any>({});
  
  function getCategoryName(id: string) {
    return catMap[id] || id;
  }

  // 1. Control de Montaje
  useEffect(() => {
    setIsMounted(true);
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
  }, []);

  // 2. Cargar categorías
  useEffect(() => {
    async function fetchCategorias() {
      const cats = await obtenerCategorias();
      const catObj: any = {};
      cats.forEach((cat: any) => {
        catObj[cat.id] = cat.nombre || cat.id;
      });
      setCatMap(catObj);
    }
    fetchCategorias();
  }, []);

  // 3. Cargar categorías en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "categorias"),
      (snap) => {
        setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snap.docs)));
      }
    );
    return () => unsub();
  }, []);

  // 4. Fetch bodega Nueva Colección y luego productos
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        // Obtener todas las bodegas y buscar la que tiene esNuevaColeccion: true
        const bodegas = await obtenerBodegas();
        const bodegaNuevaColeccion = bodegas.find(b => b.esNuevaColeccion === true);
        
        if (bodegaNuevaColeccion) {
          setBodegaNombre(bodegaNuevaColeccion.nombre);
          // Obtener productos de esa bodega
          const prods = await obtenerProductosPorBodega(bodegaNuevaColeccion.id);
          setProductos(prods || []);
        } else {
          // Si no hay bodega marcada, mostrar vacío
          setProductos([]);
          setBodegaNombre("");
        }
      } catch (error) {
        console.error("Error fetching Nueva Colección:", error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, []);

  // 5. Filtrado (Memoizado)
  const productosFiltrados = useMemo(() => {
    let filtered = [...productos];
    
    // Filtro por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        (p.nombre?.toLowerCase() || "").includes(searchLower) ||
        (p.descripcion?.toLowerCase() || "").includes(searchLower)
      );
    }
    
    // Filtro por categoría
    if (categoriaId) {
      filtered = filtered.filter((p: any) =>
        sameCategoryId(p.categoria, categoriaId)
      );
    }
    
    return filtered;
  }, [productos, search, categoriaId]);

  // --- Paginación responsive: 10 productos en móvil, cols*3 en desktop ---
  const [currentPage, setCurrentPage] = useState(1);
  const getProductsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 10; // móvil
      if (window.innerWidth >= 1024) return 4 * 3; // lg: 4 cols x 3 filas
      if (window.innerWidth >= 768) return 3 * 3; // md: 3 cols x 3 filas
      if (window.innerWidth >= 640) return 2 * 3; // sm: 2 cols x 3 filas
    }
    return 10;
  };
  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());
  useEffect(() => {
    function handleResize() {
      setProductsPerPage(getProductsPerPage());
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  
  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [productosFiltrados.length, search, categoriaId]);
  
  const paginatedProducts = useMemo(() => {
    return productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  }, [productosFiltrados, currentPage, productsPerPage]);

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

  // --- Helpers de Estilo ---
  const inputCls =
    "px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-black dark:bg-black text-slate-900 dark:text-white transition-colors">
      <BottomBarPublic />

      <main className="max-w-350 mx-auto w-full px-3 sm:px-5 py-8 flex-1">
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">
            Nueva Colección
          </h1>
          {bodegaNombre && (
            <p className="text-sm text-slate-500 dark:text-white/50">
              {bodegaNombre}
            </p>
          )}
        </div>

        {/* Búsqueda */}
        <div className="dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 mb-5 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-40 max-w-[min(75vw,300px)] sm:max-w-sm">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 text-[17px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} w-full pl-9 pr-8`}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white/80">
                  <span className="material-icons-round text-[15px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Categorías Filter - Scroll Horizontal ────────────── */}
        {categorias.length > 0 && (
          <div className="mb-6 relative z-50">
            <div className={`${isMobile && !hoveredCatId ? 'overflow-x-auto' : ''} ${isMobile && hoveredCatId ? 'overflow-hidden' : ''} pb-2`}>
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => {
                    setCategoriaId("");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                    !categoriaId
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
                          setCategoriaId(cat.id);
                          setCurrentPage(1);
                        }
                      }}
                      className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                        categoriaId === cat.id
                          ? "shadow-sm scale-105 bg-black text-white border border-black"
                          : "bg-white text-slate-900 border border-slate-300 hover:border-black/60 hover:shadow-sm"
                      }`}
                    >
                      {cat.icono && <span className="mr-1">🏷️</span>}
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
                              setCategoriaId(cat.id);
                              setCurrentPage(1);
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
        )}

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
                      setCategoriaId(hoveredCat.id);
                      setCurrentPage(1);
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

        {/* Grid de productos o Loading */}
        {(!isMounted || loading) ? (
          <div className="flex flex-col items-center justify-center py-32 transition-opacity duration-500">
            <Loading3DIcon />
            <p className="text-xs text-slate-400 dark:text-white/20 mt-6 font-medium tracking-widest uppercase">Cargando catálogo</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-slate-300 dark:text-white/20">search_off</span>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-white/80">Sin resultados</p>
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-60">Prueba otros términos o selecciona otra categoría</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-2 lg:grid-cols-5 animate-in fade-in duration-700`}>
              {paginatedProducts.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  showCart
                  showEye
                  showFav={isAuthenticated}
                  isCompact={false}
                />
              ))}
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none w-full">
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? 'bg-black border-black text-white shadow-sm' : 'bg-white border-slate-300 text-slate-900 hover:border-black/60'}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}