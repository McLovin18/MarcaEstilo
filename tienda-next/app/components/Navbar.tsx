"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { themeManager } from "./themeManager";
import ThemeToggle from "./ThemeToggle";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { obtenerProductos } from "../lib/productos-db";
import { useUser } from "../context/UserContext";
import { useTracking } from "../lib/useAnalytics";
import { productMatches } from "../lib/search-utils";

// ─────────────────────────────────────────────
// Acordeón de categorías para el drawer móvil
// ─────────────────────────────────────────────
function MobileCategoriesAccordion({ basePath }: { basePath: string }) {
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [openCat, setOpenCat] = React.useState<string | null>(null);
  const [openSub, setOpenSub] = React.useState<string | null>(null);

  // Ordenar categorías recursivamente por el campo 'orden'
  const sortByOrder = (items: any[]): any[] => {
    return items
      .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
      .map(item => ({
        ...item,
        subcategorias: item.subcategorias ? sortByOrder(item.subcategorias) : undefined
      }));
  };

  React.useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "categorias"),
      (snap) => {
        const cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategorias(sortByOrder(cats));
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col gap-1 my-3">
      <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1"
        style={{ color: "var(--textMuted)" }}>
        Categorías
      </p>
      {categorias.map((cat) => (
        <div key={cat.id}>
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text)" }}
            onClick={() =>
              setOpenCat(openCat === cat.id ? null : cat.id)
            }
          >
            <span className="flex items-center gap-2">
              {cat.icono && (
                <span className="material-icons-round text-base"
                  style={{ color: "var(--accent)" }}>
                  {cat.icono}
                </span>
              )}
              {cat.nombre}
            </span>
            {cat.subcategorias?.length > 0 && (
              <span
                className="material-icons-round text-sm transition-transform duration-200"
                style={{
                  color: "var(--textMuted)",
                  transform: openCat === cat.id ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                arrow_drop_down
              </span>
            )}
          </button>

          {cat.subcategorias?.length > 0 && openCat === cat.id && (
            <div className="ml-4 mb-1 rounded-xl overflow-hidden border"
              style={{ borderColor: "var(--border)" }}>
              {cat.subcategorias.map((sub: any) => (
                <div key={sub.id}>
                  {sub.subcategorias?.length > 0 ? (
                    <>
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                        style={{ color: "var(--text)" }}
                        onClick={() =>
                          setOpenSub(openSub === sub.id ? null : sub.id)
                        }
                      >
                        <span>{sub.nombre}</span>
                        <span
                          className="material-icons-round text-sm transition-transform duration-200"
                          style={{
                            color: "var(--textMuted)",
                            transform:
                              openSub === sub.id
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                          }}
                        >
                          arrow_drop_down
                        </span>
                      </button>
                      {openSub === sub.id && (
                        <div className="ml-3 border-l"
                          style={{ borderColor: "var(--border)" }}>
                          {sub.subcategorias.map((subsub: any) => (
                            <a
                              key={subsub.id}
                              href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                              className="block px-4 py-2 text-xs transition-colors"
                              style={{ color: "var(--textMuted)" }}
                            >
                              {subsub.nombre}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                      className="block px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                      style={{ color: "var(--text)" }}
                    >
                      {sub.nombre}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!cat.subcategorias?.length && openCat === cat.id && (
            <a
              href={`${basePath}?cat=${cat.id}`}
              className="block px-3 py-2 text-sm"
              style={{ color: "var(--text)" }}
            >
              {cat.nombre}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Navbar principal
// ─────────────────────────────────────────────
export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null); // Para dropdown nivel 1 en tablet/desktop
  const [openSubId, setOpenSubId] = useState<string | null>(null); // Para dropdown nivel 2 en tablet/desktop
  const { user, isLogged, carrito } = useUser();
  const { trackLinkClick } = useTracking();
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  

  // Barra de búsqueda
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categorías integradas
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    obtenerProductos().then((prods) => setAllProducts(prods));
  }, []);

  // Escuchar categorías desde Firestore
  useEffect(() => {
    const sortByOrder = (items: any[]): any[] => {
      return items
        .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
        .map(item => ({
          ...item,
          subcategorias: item.subcategorias ? sortByOrder(item.subcategorias) : undefined
        }));
    };

    const unsub = onSnapshot(
      collection(db, "categorias"),
      (snap) => {
        const cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategorias(sortByOrder(cats));
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    themeManager.applyTheme(
      themeManager.getStoredTheme() || themeManager.getSystemTheme()
    );
    setTheme(themeManager.getTheme());
    const handler = (e: any) => setTheme(e.detail.theme);
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Escuchar evento para activar el buscador desde home
  useEffect(() => {
    const handleActivateSearch = () => {
      const isMobile = windowWidth !== null && windowWidth < 1024;
      
      if (isMobile) {
        // En móvil: abrir el menú y enfocar el input
        setMobileOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else {
        // En desktop: solo enfocar el input
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("activateNavbarSearch", handleActivateSearch);
    return () => window.removeEventListener("activateNavbarSearch", handleActivateSearch);
  }, [windowWidth]);

  // Sugerencias de búsqueda
  useEffect(() => {
    if (!searchValue.trim()) { setSuggestions([]); return; }
    setSearchLoading(true);
    const filtered = allProducts.filter((p) => productMatches(p, searchValue));
    setSuggestions(filtered.slice(0, 6));
    setSearchLoading(false);
  }, [searchValue, allProducts]);

  if (!mounted) return null;

  const isAdmin = user?.role === "admin";
  const isMobileOrTablet = windowWidth !== null && windowWidth < 1024;

  const basePath = isAdmin
    ? "/admin/products-by-category"
    : "/products-by-category";

  const links = user
    ? [
        { href: "/admin", label: "Inicio" },
        { href: "/admin/blogs", label: "Blogs" },
      ]
    : [
        { href: "/", label: "Inicio" },
        { href: "/blogs", label: "Blogs" },
      ];

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    let target = `/search-results?query=${encodeURIComponent(searchValue.trim())}`;
    if (isAdmin) target = `/admin/search-results?query=${encodeURIComponent(searchValue.trim())}`;
    window.location.href = target;
    setSearchValue("");
    setSuggestions([]);
  };

  return (
    <>
      {/* ══════════════════ BANNER DE ENVIOS ══════════════════ */}
      <div 
        className="w-full text-center py-2 text-xs font-medium"
        style={{ background: "var(--navBg)", borderColor: "var(--border)", color:"var(--text)"}}
        
      >
        🚛 Envíos a todo el Ecuador incluyendo las Islas Galápagos
      </div>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        className="sticky top-0 z-40 border-b py-3 shadow-sm backdrop-blur-md"
        style={{ background: "var(--navBg)", borderColor: "var(--border)" }}
      >
        {/* ── Fila 1: Logo + Search | Centro: info + redes | Derecha: carrito + usuario ── */}
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 lg:px-6 lg:py-2"
          style={{ color: "var(--text)" }}
        >
          {/* ── LEFT: hamburger + logo + búsqueda ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Hamburger móvil */}
            <button
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: "var(--text)" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="material-icons-round text-2xl">menu</span>
            </button>

            {/* Logo - Image + Text */}
            <a
              href={user ? "/admin" : "/"}
              className="flex items-center gap-2 shrink-0"
              style={{ color: "var(--text)" }}
            >
              <Image
                src="/logo_ME.png"
                alt="Marca Estilo"
                width={56}
                height={56}
                priority={false}
                loading="lazy"
                className="rounded-lg"
              />
              <span className="font-bold tracking-tight whitespace-nowrap text-xl sm:text-base">
                Marca Estilo
              </span>
            </a>

            {/* Search bar — desktop */}
            <div className="hidden lg:flex items-center relative">
              <form
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{
                  background: "var(--hover)",
                  borderColor: "var(--border)",
                  minWidth: 260,
                }}
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              >
                <span className="material-icons-round text-lg" style={{ color: "var(--textMuted)" }}>
                  manage_search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar un producto..."
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: "var(--text)", minWidth: 140 }}
                  autoComplete="off"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => { setSearchValue(""); setSuggestions([]); }}
                    className="rounded-full p-0.5 transition-colors"
                    style={{ color: "var(--textMuted)" }}
                  >
                    <span className="material-icons-round text-base">highlight_off</span>
                  </button>
                )}

                {/* Dropdown sugerencias */}
                {searchValue.trim() && (
                  <div
                    className="absolute left-0 top-full mt-1 w-full rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{
                      background: "var(--cardBg)",
                      borderColor: "var(--border)",
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm" style={{ color: "var(--textMuted)" }}>
                        Buscando...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((prod) => {
                        let href = `/product-detail?id=${prod.id}`;
                        if (isAdmin) href = `/admin/product-detail?id=${prod.id}`;
                        return (
                          <a
                            key={prod.id}
                            href={href}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm"
                            style={{ color: "var(--text)" }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {prod.imagen && (
                              <img
                                src={prod.imagen}
                                alt={prod.nombre}
                                className="w-8 h-8 object-cover rounded-lg shrink-0"
                              />
                            )}
                            <span className="truncate flex-1">{prod.nombre}</span>
                            {prod.marca && (
                              <span className="text-xs shrink-0" style={{ color: "var(--textMuted)" }}>
                                {prod.marca}
                              </span>
                            )}
                          </a>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm" style={{ color: "var(--textMuted)" }}>
                        Sin resultados
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ── CENTER: Blogs + Hablemos + Dirección + Redes (solo desktop) ── */}
          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
            {/* Blogs link */}
            <a
              href={isAdmin ? "/admin/blogs" : "/blogs"}
              className="text-sm font-medium transition-opacity hover:opacity-70 whitespace-nowrap"
              style={{ color: "var(--text)" }}
            >
              Blogs
            </a>

            {/* Separador */}
            <span className="w-px h-4" style={{ background: "var(--border)" }} />

            <a
              href="https://wa.me/593999369105"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 whitespace-nowrap"
              style={{ color: "var(--text)" }}
            >
              <span className="material-icons-round text-base">
                contact_support
              </span>
              Hablemos
            </a>


            {/* Redes sociales */}
            <div className="flex items-center gap-1">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/marcaestilo593/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick().catch(console.error)}
                className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--text)" }}
                aria-label="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@marcaestilomen"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick().catch(console.error)}
                className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--text)" }}
                aria-label="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* ── RIGHT: ThemeToggle + Carrito + Usuario ── */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Mostrar ThemeToggle solo si no está autenticado */}
            {!user && <ThemeToggle />}

            {/* Carrito */}
            <div className="relative flex flex-col items-center">
              <a
                href={user ? "/admin/cart" : "/cart"}
                className="flex items-center dark:color-white justify-center px-1 rounded-xl transition-colors"
                style={{ background: "bg"}}
                aria-label="Carrito"
                data-onboarding="carrito"
              >
                <span className="material-icons-round dark:color-white text-xl">shopping_cart</span>
                {/* Badge solo cantidad, pequeño */}
                {carrito && carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-black z-10">
                    {carrito.length}
                  </span>
                )}
              </a>
            </div>

            {/* Usuario: si está logueado → avatar + menú; si no → botón "Ingresa" */}
            {user ? (
              <div className="relative">
                <button
                  className="rounded-full transition-opacity hover:opacity-80"
                  onClick={() => setUserMenu(!userMenu)}
                  title="Opciones de usuario"
                  data-onboarding="usuario"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Foto de perfil"
                      className="w-9 h-9 rounded-full object-cover border-2"
                      style={{  }}
                    />
                  ) : (
                    <span className="material-icons-round text-3xl" style={{ color: "bg" }}>
                      account_circle
                    </span>
                  )}
                </button>

                {userMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl overflow-hidden z-50"
                    style={{ background: "var(--cardBg)", borderColor: "var(--border)" }}
                  >
                    <a
                      href="/admin/perfil"
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: "var(--text)" }}
                    >
                      <span className="material-icons-round text-base">person_outline</span>
                      Perfil
                    </a>
                    <a
                      href="/admin/config"
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: "var(--text)" }}
                    >
                      <span className="material-icons-round text-base">tune</span>
                      Configuración
                    </a>
                    <div className="border-t" style={{ borderColor: "var(--border)" }} />
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-red-500 font-medium transition-colors"
                      onClick={async () => {
                        const { logoutUser } = await import("../lib/firebase-auth");
                        await logoutUser();
                        try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                        window.location.href = "/";
                      }}
                    >
                      <span className="material-icons-round text-base">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

            ) : null}
          </div>
        </div>

        {/* ── Fila 2: Categorías en móvil ── */}
        <div
          className="hidden items-center justify-center gap-1 px-6 border-t flex-wrap"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Categorías dinámicas */}
          {categorias.map((cat) => (
            <div 
              key={cat.id} 
              className="relative group shrink-0"
              onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(cat.id)}
              onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(null)}
            >
              {cat.subcategorias?.length > 0 ? (
                <button
                  onClick={() => setOpenCatId(openCatId === cat.id ? null : cat.id)}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm text-black dark:text-white"
                >
                  {cat.icono && (
                    <span className="material-icons-round dark:text-white" style={{ fontSize: 15 }}>{cat.icono}</span>
                  )}
                  <span className="dark:text-white">{cat.nombre}</span>
                  <span
                    className="material-icons-round dark:text-white transition-transform duration-200"
                    style={{ fontSize: 14, transform: openCatId === cat.id ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    arrow_drop_down
                  </span>
                </button>
              ) : (
                <Link
                  href={`${basePath}?cat=${cat.id}`}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm text-black dark:text-white"
                >
                  {cat.icono && (
                    <span className="material-icons-round dark:text-white" style={{ fontSize: 15 }}>{cat.icono}</span>
                  )}
                  <span className="dark:text-white">{cat.nombre}</span>
                </Link>
              )}

              {/* Dropdown nivel 1 */}
              {cat.subcategorias?.length > 0 && (
                <div
                  className="absolute left-0 top-full min-w-52 rounded-2xl border hover:text-[#E0A11A] shadow-xl py-1.5 z-50 bg-white dark:bg-[#181028]"
                  style={{
                    borderColor: "var(--border)",
                    opacity: openCatId === cat.id ? "1" : "0",
                    pointerEvents: openCatId === cat.id ? "auto" : "none",
                    transform: openCatId === cat.id ? "translateY(0)" : "translateY(-10px)",
                    transition: "all 150ms",
                  }}
                >
                  {cat.subcategorias.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className="relative group/sub"
                      onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(sub.id)}
                      onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(null)}
                    >
                      {sub.subcategorias?.length > 0 ? (
                        <button
                          onClick={() => setOpenSubId(openSubId === sub.id ? null : sub.id)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-shadow !text-black dark:!text-white hover:shadow-sm rounded-md"
                        >
                          <span className="!text-black dark:!text-white group-hover/sub:!text-[#E0A11A] dark:group-hover/sub:!text-[#E0A11A] transition-colors">{sub.nombre}</span>
                          <span 
                            className="material-icons-round text-sm dark:text-white hover:text-[#E0A11A] transition-transform duration-200"
                            style={{ transform: openSubId === sub.id ? "rotate(90deg)" : "rotate(0deg)" }}
                          >
                            chevron_right
                          </span>

                          {/* Dropdown nivel 2 */}
                          <div
                            className="absolute left-full top-0 ml-1 min-w-44 rounded-2xl border shadow-xl py-1.5 z-60 bg-white dark:bg-[#181028] hover:text-[#E0A11A]"
                            style={{
                              borderColor: "var(--border)",
                              opacity: openSubId === sub.id ? "1" : "0",
                              pointerEvents: openSubId === sub.id ? "auto" : "none",
                              transform: openSubId === sub.id ? "translateX(0)" : "translateX(-10px)",
                              transition: "all 150ms",
                            }}
                          >
                            {sub.subcategorias.map((subsub: any) => (
                              <Link
                                key={subsub.id}
                                href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                                className="block px-4 py-2.5 text-sm hover:text-[#E0A11A] transition-colors text-black dark:text-white"
                              >
                                <span className="dark:text-white hover:text-[#E0A11A]">{subsub.nombre}</span>
                              </Link>
                            ))}
                          </div>
                        </button>
                      ) : (
                        <Link
                          href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                          className="block px-4 py-2.5 text-sm transition-shadow !text-black dark:!text-white hover:shadow-sm rounded-md"
                        >
                          <span className="!text-black dark:!text-white group-hover/sub:!text-[#E0A11A] dark:group-hover/sub:!text-[#E0A11A] transition-colors">{sub.nombre}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ══════════════════ MOBILE DRAWER ══════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm mb-12"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 w-[85vw] max-w-xs max-h-[calc(100vh-80px)] overflow-y-auto shadow-2xl flex flex-col"
            style={{ background: "var(--cardBg)", color: "var(--text)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-bold text-base" style={{ color: "var(--text)" }}>
                TECNO THINGS
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl transition-colors"
                style={{ color: "var(--textMuted)" }}
              >
                <span className="material-icons-round text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-1">
              {/* Búsqueda móvil */}
              <form
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl border mb-3"
                style={{ background: "var(--hover)", borderColor: "var(--border)" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchValue.trim()) {
                    handleSearch();
                    setMobileOpen(false);
                  }
                }}
              >
                <span className="material-icons-round text-lg" style={{ color: "var(--textMuted)" }}>
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar productos..."
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: "var(--text)" }}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoComplete="off"
                />

                {/* Dropdown sugerencias móvil */}
                {searchValue.trim() && (
                  <div
                    className="absolute left-0 top-full mt-1 w-full rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{
                      background: "var(--cardBg)",
                      borderColor: "var(--border)",
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm" style={{ color: "var(--textMuted)" }}>
                        Buscando...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((prod) => {
                        let href = `/product-detail?id=${prod.id}`;
                        if (isAdmin) href = `/admin/product-detail?id=${prod.id}`;
                        return (
                          <a
                            key={prod.id}
                            href={href}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm"
                            style={{ color: "var(--text)" }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setMobileOpen(false);
                              setSearchValue("");
                            }}
                          >
                            {prod.imagen && (
                              <img
                                src={prod.imagen}
                                alt={prod.nombre}
                                className="w-8 h-8 object-cover rounded-lg shrink-0"
                              />
                            )}
                            <span className="truncate flex-1">{prod.nombre}</span>
                            {prod.marca && (
                              <span className="text-xs shrink-0" style={{ color: "var(--textMuted)" }}>
                                {prod.marca}
                              </span>
                            )}
                          </a>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm" style={{ color: "var(--textMuted)" }}>
                        Sin resultados
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Links */}
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: "var(--text)" }}
                >
                  {link.label}
                </a>
              ))}

              {/* Categorías en acordeón */}
              <MobileCategoriesAccordion basePath={basePath} />

              {/* Divisor */}
              <div className="border-t my-2" style={{ borderColor: "var(--border)" }} />

              {/* Usuario - Opciones si está autenticado */}
              {user && (
                <>
                  <a
                    href="/admin/perfil"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: "var(--text)" }}
                  >
                    <span className="material-icons-round text-base">person</span>
                    Perfil
                  </a>
                  <a
                    href="/admin/config"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: "var(--text)" }}
                  >
                    <span className="material-icons-round text-base">settings</span>
                    Configuración
                  </a>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-red-500 font-medium transition-colors"
                    onClick={async () => {
                      const { logoutUser } = await import("../lib/firebase-auth");
                      await logoutUser();
                      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                      window.location.href = "/";
                    }}
                  >
                    <span className="material-icons-round text-base">logout</span>
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Navbar;

