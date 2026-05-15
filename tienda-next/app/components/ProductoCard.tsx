"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useTracking } from "../lib/useAnalytics";
import { useToast } from "../context/ToastContext";

function ProductoCard({
  producto,
  onClick,
  showCart = false,
  showEye = true,
  onAddCart,
  onEye,
  showFav = false,
  isCompact = true,
}) {
  // Validar que producto existe y tiene id
  if (!producto || !producto.id) {
    return null;
  }

  const {
    isLogged,
    isAdmin,
    favoritos,
    addFavorito,
    removeFavorito,
    carrito,
    addCarrito,
    removeCarrito,
  } = useUser();
  const router = useRouter();
  const { trackProductClick } = useTracking();
  const { showToast } = useToast();

  const isFav = favoritos?.some((p) => p.id === producto.id);
  const inCart = carrito?.some((p) => p.id === producto.id);
  
  // Manejo de stock para productos normales y camisetas
  const isCamiseta = producto?.isCamiseta === true;
  const totalStock = isCamiseta 
    ? (producto?.stockVariants?.reduce((sum: number, v: any) => sum + (v?.cantidad || 0), 0) || 0)
    : (producto?.stock || 0);
  const sinStock = totalStock === 0;

  const basePrice = Number(producto?.precio || 0);
  const discount = Number(producto?.descuento || 0);
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const fakeOldPrice = hasDiscount
    ? Math.ceil(basePrice / (1 - discount / 100))
    : basePrice;
  const finalPrice = hasDiscount ? basePrice * (1 - discount / 100) : basePrice;

  const getDetailUrl = () => {
    let detailUrl = `/product-detail?id=${producto.id}`;
    try {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        detailUrl = `/admin/product-detail?id=${producto.id}`;
      } else {
        if (isAdmin) detailUrl = `/admin/product-detail?id=${producto.id}`;
      }
    } catch {
      if (isAdmin) detailUrl = `/admin/product-detail?id=${producto.id}`;
    }
    return detailUrl;
  };

  const goToDetail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductClick().catch(console.error);
    router.push(getDetailUrl());
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sinStock) return;
    if (isCamiseta) {
      showToast("Selecciona talla y color en el detalle del producto", "info");
      router.push(detailUrl);
      return;
    }
    if (onAddCart) { 
      onAddCart(producto); 
      showToast("Añadido al carrito", "success");
      return; 
    }
    if (inCart) {
      removeCarrito(producto.id);
      showToast("Eliminado del carrito", "info");
    } else {
      addCarrito({ ...producto, cantidad: 1 });
      showToast(`${producto.nombre} añadido al carrito`, "success");
    }
  };

  const detailUrl = getDetailUrl();

  return (
    <Link href={detailUrl} className={`block md:h-full ${isCompact ? 'max-w-[160px] sm:max-w-[260px]' : 'max-w-[160px] sm:max-w-[260px] md:max-w-xs'} mx-auto`}>
      <div
        onClick={onClick || goToDetail}
        className="
          group cursor-pointer
          bg-white dark:bg-white/[0.04]
          border border-slate-100 dark:border-white/10
          rounded-2xl overflow-hidden
          shadow-sm
          hover:shadow-xl dark:hover:shadow-purple-950/60
          hover:border-[#E0A11A] dark:hover:border-[#E0A11A]
          transition-all duration-300
          md:h-full

          /* ── VERTICAL en todas las vistas ── */
          flex flex-col
        "
      >
      <div
        className="
          relative flex-shrink-0 overflow-hidden
          bg-white dark:bg-white/[0.03]

          /* ── VERTICAL: imagen cuadrada/rectangular arriba ── */
          w-full h-32 sm:h-48
        "
      >
        <Image
          src={producto.imagenes?.[0] || "/no-image.png"}
          alt={producto.nombre}
          fill
          sizes="(max-width: 640px) 140px, (max-width: 768px) 100vw, 400px"
          className="
            object-contain
            p-3 sm:p-5
            group-hover:scale-105
            transition-transform duration-500
          "
          priority={false}
          loading="lazy"
        />
        {/* Badge descuento */}
        {hasDiscount && (
          <span className="
            absolute top-1 left-1 z-10
            bg-red-500 text-white
            text-[8px] sm:text-xs font-bold
            px-1 sm:px-2 py-0.5 sm:py-1
            rounded-full shadow
          ">
            -{discount}%
          </span>
        )}

        {/* Overlay sin stock */}
        {sinStock && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/50 flex items-center justify-center z-10">
            <span className="
              text-[8px] sm:text-xs font-bold
              text-slate-500 dark:text-white/60
              bg-white dark:bg-slate-900
              px-1.5 py-0.5 rounded-full
              border border-slate-200 dark:border-white/10
            ">
              Sin stock
            </span>
          </div>
        )}

        {/* Botón favorito — solo si el usuario está logueado */}
        {isLogged && (
          <button
            onClick={handleFav}
            className={`
              absolute top-1 right-1 z-20
              w-6 h-6 sm:w-8 sm:h-8 rounded-full
              flex items-center justify-center
              transition-all duration-200 shadow-sm
              ${isFav
                ? "bg-pink-500 text-white scale-100"
                : "bg-white/80 dark:bg-slate-900/80 text-slate-400 dark:text-white/40 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              }
            `}
            title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <span className="material-icons-round text-[12px] sm:text-[16px]">
              {isFav ? "favorite" : "favorite_border"}
            </span>
          </button>
        )}
      </div>

      {/* ══ INFO ════════════════════════════════════════════════ */}
      <div className="
        flex flex-col flex-1 min-w-0
        p-1.5 sm:p-4
        md:justify-between
        md:h-full
      ">
        {/* Nombre */}
        <p className="
          font-semibold leading-tight
          text-slate-800 dark:text-white

          /* móvil: tamaño reducido */
          text-xs
          sm:text-sm

          /* recortar si es muy largo */
          line-clamp-3 sm:line-clamp-3
        ">
          {producto.nombre}
        </p>

        {/* Descripción corta — solo en móvil donde hay más espacio */}
        {producto.descripcion && (
          <p className="
            mt-0.5 text-xs text-slate-400 dark:text-white/35
            line-clamp-2
            sm:hidden
          ">
            {producto.descripcion}
          </p>
        )}

        {/* Precios */}
        <div className="mt-1 md:mt-auto md:mb-3 flex items-baseline gap-1.5 flex-wrap">
          {hasDiscount && (
            <span className="text-[10px] sm:text-sm text-[#E0A11A] dark:text-white/30 line-through">
              ${fakeOldPrice.toFixed(2)}
            </span>
          )}
          <span className="
            text-base sm:text-lg font-extrabold
            text-[#E0A11A] dark:text-purple-300
          ">
            ${basePrice.toFixed(2)}
          </span>
        </div>

        {/* Acciones */}
        {(showCart || showEye) && (
          <div className="mt-1.5 sm:mt-3 flex gap-1.5 sm:gap-2">
            {showCart && (
              <button
                onClick={handleCart}
                disabled={sinStock}
                className={`
                  flex-1 flex items-center justify-center gap-1
                  py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold
                  transition-all duration-200
                  ${sinStock
                    ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 cursor-not-allowed"
                    : inCart
                      ? "bg-purple-100 dark:bg-purple-900/40 text-[#E0A11A] dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60"
                      : "bg-[#E0A11A] hover:bg-purple-700 text-white shadow-sm hover:shadow-md active:scale-95"
                  }
                `}
              >
                <span className="material-icons-round text-[14px] sm:text-[16px]">
                  {inCart ? "remove_shopping_cart" : "add_shopping_cart"}
                </span>
                <span className="hidden xs:inline sm:hidden lg:inline">
                  {inCart ? "Quitar" : "Añadir"}
                </span>
              </button>
            )}

            {showEye && (
              <button
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  onEye ? onEye(producto) : goToDetail(e); 
                }}
                className="
                  flex items-center justify-center
                  w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex-shrink-0
                  bg-slate-100 dark:bg-white/5
                  text-slate-500 dark:text-white/50
                  hover:bg-slate-200 dark:hover:bg-white/10
                  hover:text-slate-700 dark:hover:text-white
                  transition-all duration-200
                "
                title="Ver detalle"
              >
                <span className="material-icons-round text-[14px] sm:text-[18px]">visibility</span>
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </Link>
  );
}

// Memoizar para evitar re-renders innecesarios cuando aparece en listas
export default React.memo(ProductoCard, (prevProps, nextProps) => {
  // El componente se re-renderiza si el ID del producto cambió
  // O si las props de visibilidad cambiaron
  return (
    prevProps.producto.id === nextProps.producto.id &&
    prevProps.showCart === nextProps.showCart &&
    prevProps.showEye === nextProps.showEye &&
    prevProps.showFav === nextProps.showFav
  );
});

