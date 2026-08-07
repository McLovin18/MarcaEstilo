"use client";
import { useRouter, useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { Producto } from "../lib/productos-db";
import { obtenerProductos } from "../lib/productos-db";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
  productMatchesCategoria,
  productMatchesSubcategoria,
  productMatchesSubsubcategoria,
} from "../lib/categorias-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProductosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaFromUrl = (
    searchParams?.get("cat") ||
    searchParams?.get("category") ||
    ""
  ).trim();
  const subcategoriaFromUrl = (
    searchParams?.get("subcat") ||
    searchParams?.get("subcategory") ||
    searchParams?.get("sub") ||
    ""
  ).trim();
  const subsubcategoriaFromUrl = (
    searchParams?.get("subsubcat") ||
    searchParams?.get("subsubcategory") ||
    searchParams?.get("subsub") ||
    ""
  ).trim();

  const [filterCat, setFilterCat] = useState(categoriaFromUrl);
  const [filterSub, setFilterSub] = useState(subcategoriaFromUrl);
  const [filterSubsub, setFilterSubsub] = useState(subsubcategoriaFromUrl);

  useEffect(() => {
    setFilterCat(categoriaFromUrl);
    setFilterSub(subcategoriaFromUrl);
    setFilterSubsub(subsubcategoriaFromUrl);
  }, [categoriaFromUrl, subcategoriaFromUrl, subsubcategoriaFromUrl]);

  const categoria = filterCat;
  const subcategoria = filterSub;
  const subsubcategoria = filterSubsub;

  const [currentPage, setCurrentPage] = useState(1);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const unsubscribe = onSnapshot(query(categoriasRef), (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });
    return () => unsubscribe();
  }, []);

  const selectCategoria = useCallback(
    (catId: string) => {
      setFilterCat(catId);
      setFilterSub("");
      setFilterSubsub("");
      const url = catId
        ? `/productos?cat=${encodeURIComponent(catId)}`
        : "/productos";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const selectTodas = useCallback(() => {
    setFilterCat("");
    setFilterSub("");
    setFilterSubsub("");
    router.replace("/productos", { scroll: false });
  }, [router]);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        const all = await obtenerProductos();
        let prods = all;

        if (categoria && categorias.length > 0) {
          prods = prods.filter((p) =>
            productMatchesCategoria(p, categoria, categorias)
          );
          if (subcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubcategoria(
                p,
                categoria,
                subcategoria,
                categorias
              )
            );
          }
          if (subsubcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubsubcategoria(
                p,
                categoria,
                subcategoria,
                subsubcategoria,
                categorias
              )
            );
          }
        } else if (categoria) {
          const needle = categoria.trim().toLowerCase();
          prods = all.filter(
            (p) =>
              String(p.categoria || "").trim().toLowerCase() === needle
          );
        }

        setProductos(prods);
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProductos();
  }, [categoria, subcategoria, subsubcategoria, categorias]);

  useEffect(() => {
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        if (categoria && categorias.length > 0) {
          if (!productMatchesCategoria(p, categoria, categorias)) return false;
        } else if (categoria && !sameCategoryId(p.categoria, categoria)) {
          return false;
        }

        if (subcategoria && categorias.length > 0) {
          if (
            !productMatchesSubcategoria(
              p,
              categoria,
              subcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (subcategoria && !sameCategoryId(p.subcategoria, subcategoria)) {
          return false;
        }

        if (subsubcategoria && categorias.length > 0) {
          if (
            !productMatchesSubsubcategoria(
              p,
              categoria,
              subcategoria,
              subsubcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (
          subsubcategoria &&
          !sameCategoryId(p.subsubcategoria, subsubcategoria)
        ) {
          return false;
        }

        const texto = search.toLowerCase().trim();
        const matchTexto =
          !texto ||
          (p.nombre?.toLowerCase() || "").includes(texto) ||
          (p.descripcion?.toLowerCase() || "").includes(texto);

        const base = Number(p.precio || 0);
        const disc = Number(p.descuento || 0);
        const finalPrice =
          disc > 0 && disc < 100 ? base * (1 - disc / 100) : base;

        const min = precioMin ? parseFloat(precioMin) : null;
        const max = precioMax ? parseFloat(precioMax) : null;
        const matchMin = min === null || finalPrice >= min;
        const matchMax = max === null || finalPrice <= max;

        return matchTexto && matchMin && matchMax;
      })
      .sort((a: any, b: any) => {
        const fp = (p: any) => {
          const base = Number(p.precio || 0);
          const d = Number(p.descuento || 0);
          return d > 0 && d < 100 ? base * (1 - d / 100) : base;
        };

        if (orden === "price-low") return fp(a) - fp(b);
        if (orden === "price-high") return fp(b) - fp(a);
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [
    productos,
    categoria,
    subcategoria,
    subsubcategoria,
    categorias,
    search,
    precioMin,
    precioMax,
    orden,
  ]);

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
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  const paginatedProducts = productosFiltrados.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [productosFiltrados.length, categoria, subcategoria, subsubcategoria, search, precioMin, precioMax]);

  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");

  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
  }, []);

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

  const inputCls =
    "px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-black dark:bg-black text-slate-900 dark:text-white transition-colors">
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">
        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 mb-5 space-y-3">
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
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white/80"
                >
                  <span className="material-icons-round text-[15px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categorías */}
        {categorias.length > 0 && (
          <div className="mb-6 relative z-50">
            <div className={`${isMobile && !hoveredCatId ? 'overflow-x-auto' : ''} ${isMobile && hoveredCatId ? 'overflow-hidden' : ''} pb-2`}>
              <div className="flex gap-2 min-w-max">
                <button
                  type="button"
                  onClick={selectTodas}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                    !categoria
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
                      type="button"
                      ref={(el) => {
                        catButtonRefs.current[cat.id] = el;
                      }}
                      onClick={() => {
                        if (isMobile && cat.subcategorias && cat.subcategorias.length > 0) {
                          openMobileSubcats(cat.id);
                        } else {
                          selectCategoria(cat.id);
                        }
                      }}
                      className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                        sameCategoryId(categoria, cat.id)
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterCat(cat.id);
                              setFilterSub(sub.id);
                              setFilterSubsub("");
                              router.replace(`/productos?cat=${encodeURIComponent(cat.id)}&sub=${encodeURIComponent(sub.id)}`, { scroll: false });
                              setHoveredCatId(null);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                              subcategoria === sub.id
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterCat(hoveredCat.id);
                      setFilterSub(sub.id);
                      setFilterSubsub("");
                      router.replace(
                        `/productos?cat=${encodeURIComponent(hoveredCat.id)}&sub=${encodeURIComponent(sub.id)}`,
                        { scroll: false }
                      );
                      closeMobileSubcats();
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      subcategoria === sub.id
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
  <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-white/4 border border-slate-100 dark:border-white/10 shadow-sm animate-pulse">
        {/* Imagen placeholder */}
        <div className="w-full h-32 sm:h-48 bg-slate-200 dark:bg-white/10" />
        {/* Contenido placeholder */}
        <div className="p-1.5 sm:p-4 flex flex-col gap-2">
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
          <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/3 mt-1" />
        </div>
      </div>
    ))}
  </div>
  ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-slate-300 dark:text-white/20">
                search_off
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-white/80">Sin resultados</p>
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-60">
                {categoria
                  ? `No hay productos en "${categorias.find((c) => sameCategoryId(c.id, categoria))?.nombre || "esta categoría"}".`
                  : "Prueba otros términos o ajusta los filtros de precio"}
              </p>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-500 dark:text-#e8c862 underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5 animate-in fade-in duration-700">
              {paginatedProducts.map((p: any, index: number) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  index={index}
                  showCart
                  showEye
              
                  showFav={isAuthenticated}
                  onClick={() => {}}
                  onAddCart={() => {}}
                  onEye={() => {}}
                  isCompact={false}
                />
              ))}
            </div>
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
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? "bg-black border-black text-white shadow-sm" : "bg-white border-slate-300 text-slate-900 hover:border-black/60"}`}
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