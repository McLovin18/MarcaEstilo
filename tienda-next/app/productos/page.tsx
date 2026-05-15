"use client";
import { useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Producto } from "../lib/productos-db";
import { obtenerProductos, obtenerProductosPorCategoria, obtenerProductosPorSubcategoria, obtenerProductosPorSubsubcategoria } from "../lib/productos-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProductsByCategoryPage() {
  const searchParams = useSearchParams();
  const categoria = searchParams?.get("cat") || searchParams?.get("category") || "";
  const subcategoria = searchParams?.get("subcat") || searchParams?.get("subcategory") || "";
  const subsubcategoria = searchParams?.get("subsubcat") || searchParams?.get("subsubcategory") || "";

   const [currentPage, setCurrentPage] = useState(1);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [showPrecio, setShowPrecio] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch productos ───────────────────────────────
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      let prods = [];
      if (subsubcategoria && subcategoria && categoria) {
        prods = await obtenerProductosPorSubsubcategoria(subsubcategoria, subcategoria, categoria);
      } else if (subcategoria && categoria) {
        prods = await obtenerProductosPorSubcategoria(subcategoria, categoria);
      } else if (categoria) {
        prods = await obtenerProductosPorCategoria(categoria);
      } else {
        prods = await obtenerProductos();
      }
      setProductos(prods);
      setLoading(false);
    }
    fetchProductos();
  }, [categoria, subcategoria, subsubcategoria]);

  // ── Cargar categorías ───────────────────────────
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

  // ── Chequear autenticación ───────────────────────
  useEffect(() => {
    // Reemplaza con tu lógica real de autenticación
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
  }, []);

  // ── Filtrado y orden ─────────────────────────────
  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        // Validación estricta de jerarquía
        if (subsubcategoria && subcategoria && categoria) {
          if (
            p.categoria !== categoria ||
            p.subcategoria !== subcategoria ||
            p.subsubcategoria !== subsubcategoria
          ) {
            return false;
          }
        } else if (subcategoria && categoria) {
          if (
            p.categoria !== categoria ||
            p.subcategoria !== subcategoria
          ) {
            return false;
          }
        } else if (categoria) {
          if (p.categoria !== categoria) {
            return false;
          }
        }

        const texto = search.toLowerCase().trim();
        const matchTexto =
          !texto ||
          (p.nombre?.toLowerCase() || "").includes(texto) ||
          (p.descripcion?.toLowerCase() || "").includes(texto);

        const base = Number(p.precio || 0);
        const disc = Number(p.descuento || 0);
        const finalPrice = disc > 0 && disc < 100 ? base * (1 - disc / 100) : base;
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
  }, [productos, categoria, subcategoria, subsubcategoria, search, precioMin, precioMax, orden]);



    // --- Paginación ---
  // Paginación responsive: 10 productos en móvil, cols*3 en desktop
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
  const paginatedProducts = productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);




  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");

  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
  }, []);

  const ordenOpciones = [
    { value: "newest",     label: "Más nuevos"    },
    { value: "price-low",  label: "Menor precio"  },
    { value: "price-high", label: "Mayor precio"  },
  ];

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap ${
      active
        ? "bg-#E0A11A border-#E0A11A text-white shadow-sm"
        : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-#e8c862 dark:hover:border-purple-500 hover:text-#E0A11A dark:hover:text-#f5d890"
    }`;

  const inputCls =
    "px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-slate-900 dark:text-white transition-colors">

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">

        {/* ── Cabecera ─────────────────────────────────────────── */}
        {(categoria || subcategoria) && (
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight"></h1>
            {subcategoria && categoria && (
              <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">
                {categoria}{subsubcategoria ? ` › ${subsubcategoria}` : ""}
              </p>
            )}
          </div>
        )}

        {/* ── Filtros horizontales ─────────────────────────────── */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 mb-5 space-y-3">

          {/* Fila 1: buscador + precio + limpiar */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-sm">
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

            {/* Toggle precio */}
            <button
              onClick={() => setShowPrecio((v) => !v)}
              className={chip(showPrecio || !!(precioMin || precioMax))}
            >
              <span className="material-icons-round text-[15px]">attach_money</span>
              Precio
              {(precioMin || precioMax) && !showPrecio && (
                <span className="w-1.5 h-1.5 rounded-full bg-#f5d890" />
              )}
            </button>

            {/* Limpiar */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              
                <span className="material-icons-round text-[14px]">close</span>
                Limpiar
              </button>
            )}
          </div>

          {/* Precio expandible */}
          {showPrecio && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-white/40 font-medium">Rango:</span>
              <input
                type="number"
                placeholder="Mín"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                min={0}
                className={`${inputCls} w-24`}
              />
              <span className="text-slate-300 dark:text-white/20">—</span>
              <input
                type="number"
                placeholder="Máx"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                min={0}
                className={`${inputCls} w-24`}
              />
            </div>
          )}

          {/* Fila 2: orden + conteo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-white/30 font-medium">Ordenar:</span>
            {ordenOpciones.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrden(opt.value)}
                className={chip(orden === opt.value)}
              >
                {opt.label}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto text-xs text-slate-400 dark:text-white/75 tabular-nums">
                {productosFiltrados.length}{" "}
                {productosFiltrados.length === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </div>
        </div>

        {/* ── Categorías Filter - Scroll Horizontal ────────────── */}
        {categorias.length > 0 && (
          <div className="mb-6 overflow-x-auto pb-2" ref={categoriesScrollRef}>
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => {
                  // Al hacer click, navegar sin filtro de categoría
                  window.location.href = `/productos`;
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                  !categoria
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
                    window.location.href = `/productos?cat=${cat.id}`;
                  }}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                    categoria === cat.id
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

        {/* ── Grid de productos ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductoCard
                key={i} // skeleton, solo necesita key única
                producto={{} as Producto} // placeholder vacío
                showCart
                showEye
                showFav={false}
                onClick={() => {}}
                onAddCart={() => {}}
                onEye={() => {}}
                isCompact={false}
              />
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
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-[240px]">
                Prueba otros términos o ajusta los filtros de precio
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
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4`}>
              {paginatedProducts.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
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

