"use client";
import BottomBarPublic from "../components/BottomBarPublic";
import { useUser } from "../context/UserContext";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { Loading3DIcon } from "../components/Loading3DIcon";
import { obtenerProductos } from "../lib/productos-db";
import { productMatches } from "../lib/search-utils";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
} from "../lib/categorias-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("query") || "";
  const categoriaId = (searchParams?.get("cat") || searchParams?.get("category") || "").trim();
  const isLogger = useUser();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(queryParam);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [marca, setMarca] = useState("");
  const [marcas, setMarcas] = useState([]);
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

  // 🔥 Cargar productos
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const prods = await obtenerProductos();
      setProductos(prods);
      setLoading(false);
      const marcasUnicas = Array.from(new Set(prods.map(p => p.marca).filter(Boolean)));
      setMarcas(marcasUnicas);
    }
    fetchProductos();
  }, []);

  // 🔥 Cargar categorías
  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const q = query(categoriasRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Filtrado
  const productosFiltrados = useMemo(() => {
    return productos
      .filter(p => {
        const coincideTexto = productMatches(p, search);
        const coincideMarca = !marca || p.marca === marca;
        const coincideCategoria =
          !categoriaId || sameCategoryId(p.categoria, categoriaId);

        const basePrice = Number(p.precio || 0);
        const discount = Number(p.descuento || 0);
        const finalPrice = discount > 0 && discount < 100 ? basePrice * (1 - discount / 100) : basePrice;

        const min = precioMin ? parseFloat(precioMin) : null;
        const max = precioMax ? parseFloat(precioMax) : null;
        const matchMin = min === null || finalPrice >= min;
        const matchMax = max === null || finalPrice <= max;

        return coincideTexto && coincideMarca && coincideCategoria && matchMin && matchMax;
      })
      .sort((a, b) => {
        const getFinalPrice = (p: any) => {
          const base = Number(p.precio || 0);
          const disc = Number(p.descuento || 0);
          return disc > 0 && disc < 100 ? base * (1 - disc / 100) : base;
        };
        if (orden === "price-low") return getFinalPrice(a) - getFinalPrice(b);
        if (orden === "price-high") return getFinalPrice(b) - getFinalPrice(a);
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [productos, search, precioMin, precioMax, orden, marca, categoriaId]);



      // --- Paginación responsive: 10 productos en móvil, cols*3 en desktop ---
      const [currentPage, setCurrentPage] = useState(1);
      const getProductsPerPage = () => {
        if (typeof window !== "undefined") {
          if (window.innerWidth < 640) return 10;
          if (window.innerWidth >= 1024) return 15;
          if (window.innerWidth >= 768) return 9;
          if (window.innerWidth >= 640) return 6;
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
      const paginatedProducts = productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);



  const hasFilters = search || precioMin || precioMax || marca || orden !== "newest";
  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setMarca("");
    setOrden("newest");
  }, []);

  const inputClass =
    "w-[min(75vw,300px)] sm:w-[400px] px-3 py-1.5 sm:py-2.5 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-gray-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

  // 🔥 FilterPanel memoizado para no perder foco
  const FilterPanel = useMemo(() => (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <label className="text-xs font-semibold mb-1 sm:mb-2 block text-slate-700 dark:text-white">Buscar</label>
        <input
          type="text"
          placeholder="Nombre, descripción o categoría..."
          className={inputClass}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

    </div>
  ), [search]);

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
    <div className=" min-h-screen flex flex-col bg-black dark:bg-black">
      <BottomBarPublic/>

      <main className="max-w-350 mx-auto px-3 sm:px-5 py-8 flex-1">
        <div className="mb-6">
          {FilterPanel}
        </div>

        {/*Buscador de productos */}
        {categorias.length > 0 && (
          <div className="mb-6 relative z-50">
            <div className={`${isMobile && !hoveredCatId ? 'overflow-x-auto' : ''} ${isMobile && hoveredCatId ? 'overflow-hidden' : ''} pb-2`}>
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => {
                     window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}`;
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
                          window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}&cat=${encodeURIComponent(cat.id)}`;
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
                              window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}&cat=${encodeURIComponent(cat.id)}&sub=${encodeURIComponent(sub.id)}`;
                              setHoveredCatId(null);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                              searchParams?.get("sub") === sub.id
                                ? "bg-black text-white"
                                : "text-slate-900 hover:bg-slate-100"
                            }`}
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
                      window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}&cat=${encodeURIComponent(hoveredCat.id)}&sub=${encodeURIComponent(sub.id)}`;
                      closeMobileSubcats();
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      searchParams?.get("sub") === sub.id
                        ? "bg-black text-white"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {sub.nombre}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loading3DIcon />
              </div>
            ) : productosFiltrados.length === 0 ? (
              <p className="text-slate-700 dark:text-white/50">No hay resultados</p>
            ) : (
          <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-5 animate-in fade-in duration-700">              {paginatedProducts.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  showCart
                  showEye
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