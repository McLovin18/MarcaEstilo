"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useTracking } from "../lib/useAnalytics";
import { useToast } from "../context/ToastContext";
import { getCatalogPricing } from "../lib/pricing";

function ProductoCard({
  producto,
  onClick,
  showCart = false,
  showEye = true,
  onAddCart,
  onEye,
  showFav = false,
  isCompact = true,
}: {
  producto?: any;
  onClick?: any;
  showCart?: boolean;
  showEye?: boolean;
  onAddCart?: any;
  onEye?: any;
  showFav?: boolean;
  isCompact?: boolean;
} = {}): JSX.Element | null {
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
  
  // Manejo de stock y variaciones
  const hasVariations = producto?.hasVariations || producto?.isCamiseta || false;
  const variationAttributeIds = producto?.variationAttributeIds || [];
  const stockVariants = producto?.stockVariants || [];
  
  const totalStock = hasVariations 
    ? (stockVariants.reduce((sum: number, v: any) => sum + (v?.cantidad || 0), 0) || 0)
    : (producto?.stock || 0);
  const sinStock = totalStock === 0;

  const { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice } = getCatalogPricing(producto);

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
    
    // Si tiene variaciones dinámicas, redirigir a detalle para seleccionar
    if (hasVariations && variationAttributeIds.length > 0) {
      showToast("Selecciona las opciones en el detalle del producto", "info");
      router.push(detailUrl);
      return;
    }
    
    // Si solo tiene stock sin variaciones
    if (onAddCart) { 
      onAddCart({
        ...producto,
        precioBase: basePrice,
        precioUnitario: finalPrice,
        descuento: hasDiscount ? discount : 0,
      }); 
      showToast("Añadido al carrito", "success");
      return; 
    }
    
    if (inCart) {
      removeCarrito(producto.id);
      showToast("Eliminado del carrito", "info");
    } else {
      addCarrito({
        ...producto,
        cantidad: 1,
        precioBase: basePrice,
        precioUnitario: finalPrice,
        descuento: hasDiscount ? discount : 0,
      });
      showToast(`${producto.nombre} añadido al carrito`, "success");
    }
  };

  const detailUrl = getDetailUrl();

  return (
    <Link href={detailUrl} className={`block h-full w-full`}>
      <div
        onClick={onClick || goToDetail}
        className="
          group cursor-pointer
          bg-white dark:bg-white/4
          border border-slate-100 dark:border-white/10
           overflow-hidden
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
          relative shrink-0 overflow-hidden
          bg-white dark:bg-white/3

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
        style={{
          opacity: 0,
          transition: "opacity 0.5s ease, transform 0.5s", // ✅ combina con el scale del hover
        }}
        onLoad={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "1";
        }}
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
          text-xs sm:text-sm
          line-clamp-2
        "
        style={{ minHeight: "2.5rem" }} // ✅ siempre 2 líneas reservadas
        >
          {producto.nombre}
        </p>

        {/* Descripción corta */}
        {producto.descripcion && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-white/35 line-clamp-2 sm:hidden"
            style={{ minHeight: "2rem" }} // ✅ siempre 2 líneas reservadas
          >
            {producto.descripcion}
          </p>
        )}

        {/* Precios */}
        <div className="mt-1 md:mt-auto md:mb-3 flex items-baseline gap-1.5 flex-wrap">
          {hasDiscount && (
            <span className="text-[10px] sm:text-sm text-slate-500 dark:text-white/30 line-through">
              ${fakeOldPrice.toFixed(2)}
            </span>
          )}
          <span className="
            text-base sm:text-lg font-extrabold
              text-black dark:text-white
          ">
            ${finalPrice.toFixed(2)}
          </span>
        </div>

        {/* Acciones */}
        {(showCart || showEye) && (
          <div className="mt-1.5 sm:mt-3 flex gap-1.5 sm:gap-2">
            {showCart &&(
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (sinStock) return;

                  handleCart(e);
                }}
                disabled={sinStock}
                className={`
                  flex-1 flex items-center justify-center gap-1
                  py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold
                  border border-slate-300 bg-white text-slate-900
                  shadow-sm transition-all duration-200
                  ${
                    sinStock
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50 shadow-none"
                      : inCart
                        ? "border-black/40 bg-white text-black hover:border-black/60 hover:shadow-md active:scale-95"
                        : "hover:border-black/70 hover:text-black hover:shadow-md active:scale-95"
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
                  w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shrink-0
                  border border-slate-300 bg-white text-slate-700
                  hover:border-black/40 hover:text-black hover:shadow-sm
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

