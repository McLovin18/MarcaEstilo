"use client";
import BottomBarPublic from "../components/BottomBarPublic";
import { useUser } from "../context/UserContext";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { Loading3DIcon } from "../components/Loading3DIcon";
import { obtenerProductos } from "../lib/productos-db";
import { productMatches } from "../lib/search-utils";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("query") || "";
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
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

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
      const cats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(cats.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Filtrado
  const productosFiltrados = useMemo(() => {
    return productos
      .filter(p => {
        const coincideTexto = productMatches(p, search);
        const coincideMarca = !marca || p.marca === marca;

        const basePrice = Number(p.precio || 0);
        const discount = Number(p.descuento || 0);
        const finalPrice = discount > 0 && discount < 100 ? basePrice * (1 - discount / 100) : basePrice;

        const min = precioMin ? parseFloat(precioMin) : null;
        const max = precioMax ? parseFloat(precioMax) : null;
        const matchMin = min === null || finalPrice >= min;
        const matchMax = max === null || finalPrice <= max;

        return coincideTexto && coincideMarca && matchMin && matchMax;
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
  }, [productos, search, precioMin, precioMax, orden, marca]);



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
    "w-full px-3 py-1.5 sm:py-2.5 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-gray-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-#e8c862 transition-all";

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

      <div className="hidden md:block">
        <label className="text-xs font-semibold mb-1 sm:mb-2 block text-slate-700 dark:text-white">Rango de precio</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Mín"
            className={inputClass}
            value={precioMin}
            onChange={e => setPrecioMin(e.target.value)}
          />
          <input
            type="number"
            placeholder="Máx"
            className={inputClass}
            value={precioMax}
            onChange={e => setPrecioMax(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 sm:mb-2 block text-slate-700 dark:text-white">Marca</label>
        <select className={inputClass} value={marca} onChange={e => setMarca(e.target.value)}>
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 sm:mb-2 block text-slate-700 dark:text-white">Ordenar</label>
        <select className={inputClass} value={orden} onChange={e => setOrden(e.target.value)}>
          <option value="newest">Más nuevos</option>
          <option value="price-low">Menor precio</option>
          <option value="price-high">Mayor precio</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-red-500 border border-red-300 dark:border-red-500"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  ), [search, precioMin, precioMax, marca, orden, hasFilters, clearFilters]);

  return (
    <div className=" min-h-screen flex flex-col mt-2 bg-white dark:bg-black">
      <BottomBarPublic/>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 sm:py-15 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">{FilterPanel}</aside>

          <section className="lg:col-span-3">
            {/* ── Categorías Filter - Scroll Horizontal ────────────── */}
            {categorias.length > 0 && (
              <div className="mb-6 overflow-x-auto pb-2" ref={categoriesScrollRef}>
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => {
                      window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}`;
                    }}
                    className="px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                  >
                    Todas
                  </button>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        window.location.href = `/search-results?query=${encodeURIComponent(queryParam)}&cat=${cat.id}`;
                      }}
                      className="px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      {cat.icono && <span className="mr-1">🏷️</span>}
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loading3DIcon />
              </div>
            ) : productosFiltrados.length === 0 ? (
              <p className="text-slate-700 dark:text-white/50">No hay resultados</p>
            ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-700`}>
              {paginatedProducts.map((p: any) => (
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
          </section>
        </div>
      </main>
    </div>
  );
}

