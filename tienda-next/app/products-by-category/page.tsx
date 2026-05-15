"use client";
import BottomBarPublic from "../components/BottomBarPublic";
import { useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { Loading3DIcon } from "../components/Loading3DIcon";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { 
  obtenerProductos,
  obtenerProductosPorCategoria,
  obtenerProductosPorSubcategoria,
  obtenerProductosPorSubsubcategoria
} from "../lib/productos-db";
import { obtenerCategorias } from "../lib/categorias-db";
import { useUser } from "../context/UserContext";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProductsByCategoryPage() {
  // Estado para el mapeo de nombres
  const [catMap, setCatMap] = useState<any>({});
  const [subcatMap, setSubcatMap] = useState<any>({});
  const [subsubcatMap, setSubsubcatMap] = useState<any>({});

  useEffect(() => {
    async function fetchCategorias() {
      const cats = await obtenerCategorias();
      const catObj: any = {};
      const subcatObj: any = {};
      const subsubcatObj: any = {};
      cats.forEach((cat: any) => {
        catObj[cat.id] = cat.nombre || cat.id;
        if (cat.subcategorias) {
          cat.subcategorias.forEach((sub: any) => {
            subcatObj[sub.id] = sub.nombre || sub.id;
            if (sub.subcategorias) {
              sub.subcategorias.forEach((subsub: any) => {
                subsubcatObj[subsub.id] = subsub.nombre || subsub.id;
              });
            }
          });
        }
      });
      setCatMap(catObj);
      setSubcatMap(subcatObj);
      setSubsubcatMap(subsubcatObj);
    }
    fetchCategorias();
  }, []);

  function getCategoryName(id: string) {
    return catMap[id] || id;
  }
  function getSubcategoryName(id: string) {
    return subcatMap[id] || id;
  }
  function getSubsubcategoryName(id: string) {
    return subsubcatMap[id] || id;
  }



  const isLogged = useUser();
  const searchParams = useSearchParams();
  const categoriaId = (searchParams?.get("cat") || searchParams?.get("category") || "").trim();
  const subcategoriaId = (searchParams?.get("subcat") || searchParams?.get("subcategory") || searchParams?.get("sub") || "").trim();
  const subsubcategoriaId = (searchParams?.get("subsubcat") || searchParams?.get("subsubcategory") || searchParams?.get("subsub") || "").trim();
  
  // Leer parámetros de precio DIRECTAMENTE desde URL
  const urlMinPrice = searchParams?.get("minPrice") || "";
  const urlMaxPrice = searchParams?.get("maxPrice") || "";

  // --- Estados de datos ---
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // --- Estados de filtros ---
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [showPrecio, setShowPrecio] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // 1. Control de Montaje - Inicializa filtros desde URL
  useEffect(() => {
    setIsMounted(true);
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
    
    // Sincronizar filtros de precio desde URL params después del montaje
    const minPrice = searchParams?.get("minPrice") || "";
    const maxPrice = searchParams?.get("maxPrice") || "";
    if (minPrice) setPrecioMin(minPrice);
    if (maxPrice) setPrecioMax(maxPrice);
    
    // Mostrar los inputs de precio si hay parámetros en la URL
    if (minPrice || maxPrice) {
      setShowPrecio(true);
    }
  }, [searchParams]);

  // 2. Fetch productos
useEffect(() => {
  async function fetchProductos() {
    setLoading(true);
    try {
      let prods = [];
      if (subsubcategoriaId) {
        // Nivel más específico
        prods = await obtenerProductosPorSubsubcategoria(subsubcategoriaId, subcategoriaId, categoriaId);
      } else if (subcategoriaId) {
        prods = await obtenerProductosPorSubcategoria(subcategoriaId, categoriaId);
      } else if (categoriaId) {
        prods = await obtenerProductosPorCategoria(categoriaId);
      } else {
        prods = await obtenerProductos();
      }
      setProductos(prods || []);
    } catch (error) {
      // Error fetching products
    } finally {
      setLoading(false);
    }
  }
  fetchProductos();
}, [categoriaId, subcategoriaId, subsubcategoriaId]);

  // 2.5. Cargar categorías
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

  // 3. Filtrado y orden (Memoizado)
  const productosFiltrados = useMemo(() => {
    // Usar URL params primero, luego estado local como fallback
    const effectiveMin = urlMinPrice || precioMin;
    const effectiveMax = urlMaxPrice || precioMax;
    
    const minNum = effectiveMin && effectiveMin !== "" ? parseFloat(effectiveMin) : null;
    const maxNum = effectiveMax && effectiveMax !== "" ? parseFloat(effectiveMax) : null;
    
    const filtered = productos
      .filter((p: any) => {
        // Filtrado estricto por ID
        if (subsubcategoriaId && subcategoriaId && categoriaId) {
          if (
            p.categoria !== categoriaId ||
            p.subcategoria !== subcategoriaId ||
            p.subsubcategoria !== subsubcategoriaId
          ) {
            return false;
          }
        } else if (subcategoriaId && categoriaId) {
          if (
            p.categoria !== categoriaId ||
            p.subcategoria !== subcategoriaId
          ) {
            return false;
          }
        } else if (categoriaId) {
          // Mostrar todos los productos de la categoría, sin importar subcategoría o subsubcategoría
          if (p.categoria !== categoriaId) {
            return false;
          }
        }

        const texto = search.toLowerCase().trim();
        const matchTexto =
          !texto ||
          (p.nombre?.toLowerCase() || "").includes(texto) ||
          (p.descripcion?.toLowerCase() || "").includes(texto);

        const basePrice = Number(p.precio || 0);
        
        const matchMin = minNum === null || basePrice >= minNum;
        const matchMax = maxNum === null || basePrice <= maxNum;

        return matchTexto && matchMin && matchMax;
      })
      .sort((a: any, b: any) => {
        const basePrice = (p: any) => Number(p.precio || 0);
        if (orden === "price-low") return basePrice(a) - basePrice(b);
        if (orden === "price-high") return basePrice(b) - basePrice(a);
        return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
      });
    return filtered;
  }, [productos, categoriaId, subcategoriaId, subsubcategoriaId, search, precioMin, precioMax, orden, urlMinPrice, urlMaxPrice]);

  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");




  
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
    }, [productosFiltrados.length, urlMinPrice, urlMaxPrice, search]);
    
    const paginatedProducts = useMemo(() => {
      return productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
    }, [productosFiltrados, currentPage, productsPerPage]);


  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
  }, []);

  // --- Helpers de Estilo ---
  const chip = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap ${
      active
        ? "bg-[#E0A11A] border-#E0A11A text-white shadow-sm"
        : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-#e8c862 dark:hover:border-purple-500 hover:text-#E0A11A dark:hover:text-#f5d890"
    }`;

  const inputCls =
    "px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

  return (
    <div className="min-h-screen flex flex-col mt-2 bg-white dark:bg-black text-slate-900 dark:text-white transition-colors">
        <BottomBarPublic />


      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-8 flex-1">
        {/* Cabecera */}
        {(categoriaId || subcategoriaId || subsubcategoriaId) && (
          <div className="mb-4">
            <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-white/30 mb-1 select-none">
              <span className="hover:underline cursor-pointer" onClick={() => window.location.href = '/products-by-category'}>Categorías</span>
              {categoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="hover:underline cursor-pointer" onClick={() => window.location.href = `/products-by-category?cat=${encodeURIComponent(categoriaId)}`}>{getCategoryName(categoriaId)}</span>
                </>
              )}
              {subcategoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="hover:underline cursor-pointer" onClick={() => window.location.href = `/products-by-category?cat=${encodeURIComponent(categoriaId)}&subcat=${encodeURIComponent(subcategoriaId)}`}>{getSubcategoryName(subcategoriaId)}</span>
                </>
              )}
              {subsubcategoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="font-semibold text-slate-600 dark:text-white/80">{getSubsubcategoryName(subsubcategoriaId)}</span>
                </>
              )}
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
              {subsubcategoriaId
                ? getSubsubcategoryName(subsubcategoriaId)
                : subcategoriaId
                  ? getSubcategoryName(subcategoriaId)
                  : getCategoryName(categoriaId)}
            </h1>
          </div>
        )}

        {/* Filtros horizontales */}
        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 mb-5 space-y-3 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-40 max-w-sm">
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

            <button onClick={() => setShowPrecio((v) => !v)} className={chip(showPrecio || !!(precioMin || precioMax))}>
              <span className="material-icons-round text-[15px]">attach_money</span>
              Precio
            </button>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                <span className="material-icons-round text-[14px]">close</span>
                Limpiar
              </button>
            )}
          </div>

          {showPrecio && (
            <div className="flex items-center gap-2 flex-wrap pt-1 animate-in fade-in slide-in-from-top-1">
              <span className="text-xs text-slate-500 dark:text-white/40 font-medium">Rango:</span>
              <input type="number" placeholder="Mín" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} className={`${inputCls} w-24`} />
              <span className="text-slate-300 dark:text-white/20">—</span>
              <input type="number" placeholder="Máx" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} className={`${inputCls} w-24`} />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-white/5 pt-3">
            <span className="text-xs text-slate-400 dark:text-white/30 font-medium">Ordenar:</span>
            {[
              { v: "newest", l: "Más nuevos" },
              { v: "price-low", l: "Menor precio" },
              { v: "price-high", l: "Mayor precio" }
            ].map((opt) => (
              <button key={opt.v} onClick={() => setOrden(opt.v)} className={chip(orden === opt.v)}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Categorías Filter - Scroll Horizontal ────────────── */}
        {categorias.length > 0 && (
          <div className="mb-6 overflow-x-auto pb-2" ref={categoriesScrollRef}>
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => {
                  window.location.href = `/products-by-category`;
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                  !categoriaId
                    ? "shadow-md scale-105 bg-[#E0A11A] text-white"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    window.location.href = `/products-by-category?cat=${cat.id}`;
                  }}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                    categoriaId === cat.id
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
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-60">Prueba otros términos o ajusta los filtros</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-700`}>
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
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-#e8c862 dark:hover:border-purple-500 hover:text-#E0A11A dark:hover:text-#f5d890 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? 'bg-[#E0A11A] border-#E0A11A text-white shadow-sm' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-#e8c862 dark:hover:border-purple-500 hover:text-#E0A11A dark:hover:text-#f5d890'}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-#e8c862 dark:hover:border-purple-500 hover:text-#E0A11A dark:hover:text-#f5d890 transition-all disabled:opacity-40"
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

