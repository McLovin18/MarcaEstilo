"use client";

import React from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
  FieldPosition,
} from "../../lib/landing-types";

// ── Hook ────────────────────────────────────────────────────────────────────
function useGoogleMapsPlaceDetails(placeId?: string, enabled?: boolean) {
  const [data, setData] = React.useState<{
    rating?: number;
    user_ratings_total?: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled || !placeId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/google-maps?place_id=${placeId}`)
      .then((res) => res.json())
      .then((json) => {
        if (
          typeof json.rating !== "undefined" &&
          typeof json.ratingCount !== "undefined"
        ) {
          setData({ rating: json.rating, user_ratings_total: json.ratingCount });
        } else {
          setError(json.error || "No se pudo obtener la información de Google Maps");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [placeId, enabled]);

  return { data, loading, error };
}

// ── Tipos ────────────────────────────────────────────────────────────────────
type HeroItem = {
  title?: string;
  subtitle?: string;
  badge?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string | null;
  images?: string[];
  videoUrl?: string | null;
  googleMaps?: boolean;
  rating?: number;
  ratingCount?: number;
  generalMessage?: string;
  fieldStyles?: Record<string, LandingFieldStyle>;
  fieldPositions?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>;
};

export type HeroSectionProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  titleMobileFontSize?: string | number;
  subtitleMobileFontSize?: string | number;
  badgeMobileFontSize?: string | number;
  buttonTextMobileFontSize?: string | number;
  googleMaps?: boolean;
  rating?: number;
  ratingCount?: number;
  generalMessage?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string | null;
  images?: string[];
  videoUrl?: string | null;
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  fieldPositions?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>;
  items?: HeroItem[];
  // When provided by an editor/preview, forces rendering for that device
  device?: "desktop" | "mobile";
};

// ── Componente de estrellas ──────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const fill = Math.max(0, Math.min(1, rating - idx));
        return (
          <span key={idx} className="relative inline-block w-5 h-5">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <defs>
                <linearGradient
                  id={`sg-${idx}-${rating}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset={`${fill * 100}%`} stopColor="#FACC15" />
                  <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,0.3)" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 15,9 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,9"
                fill={`url(#sg-${idx}-${rating})`}
                stroke="#FACC15"
                strokeWidth="0.8"
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function HeroSection({
  title,
  subtitle,
  badge,
  titleMobileFontSize,
  subtitleMobileFontSize,
  badgeMobileFontSize,
  buttonTextMobileFontSize,
  buttonText,
  buttonLink,
  image,
  images,
  videoUrl,
  styles,
  fieldStyles,
  fieldPositions,
  items,
  googleMaps,
  generalMessage,
  device,
}: HeroSectionProps) {
  
  const bg = styles?.backgroundColor;
  const color = styles?.textColor;
  const textAlign: React.CSSProperties["textAlign"] = styles?.textAlign || "center";
  const borderRadius = styles?.borderRadius || "1.5rem";

  // Dimensiones base de la imagen en píxeles
  const BASE_IMAGE_WIDTH = 2400;
  const BASE_IMAGE_HEIGHT = 1000;
  const BASE_ASPECT_RATIO = BASE_IMAGE_WIDTH / BASE_IMAGE_HEIGHT; // 2.4

  // ── Helper para convertir posiciones de píxeles a porcentajes
  // positionsSource: se puede pasar `current.fieldPositions` para priorizar posiciones por item
  const getPositioningStyle = (
    fieldName: string,
    isDesktop: boolean,
    positionsSource?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>
  ): React.CSSProperties => {
    const src = positionsSource || fieldPositions;
    if (!src?.[fieldName]) return {};

    const position = isDesktop ? src[fieldName].desktop : src[fieldName].mobile;
    if (!position) return {};

    // Convertir píxeles a porcentajes relativos a las dimensiones base
    const style = {
      ...(position.left !== undefined && { left: `${(position.left / BASE_IMAGE_WIDTH) * 100}%` }),
      ...(position.top !== undefined && { top: `${(position.top / BASE_IMAGE_HEIGHT) * 100}%` }),
      // Para badge y buttonText dejamos que el contenido determine el tamaño
      ...((fieldName !== "badge" && fieldName !== "buttonText" && position.width !== undefined) && { width: `${(position.width / BASE_IMAGE_WIDTH) * 50}%` }),
      ...((fieldName !== "badge" && fieldName !== "buttonText" && position.height !== undefined) && { height: `${(position.height / BASE_IMAGE_HEIGHT) * 50}%` }),
      ...(position.zIndex !== undefined && { zIndex: position.zIndex }),
    };

    // (no debug logs in production)

    return style;
  };

  // ── Device detection: prefer explicit `device` prop from editor/preview when provided
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof device !== "undefined") return device === "desktop";
    return typeof window !== "undefined" ? window.innerWidth >= 768 : true;
  });

  React.useEffect(() => {
    if (typeof device !== "undefined") {
      setIsDesktop(device === "desktop");
      return;
    }

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768); // md breakpoint
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, [device]);

  const placeId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID;
  const hasGoogleMaps =
    googleMaps || (items && items.some((i) => i.googleMaps));
  const { data: googleMapsData } = useGoogleMapsPlaceDetails(placeId, hasGoogleMaps);

  // ── TODOS los hooks antes de cualquier return condicional ────────────────
  const [currentIndex, setCurrentIndex] = React.useState(0);


  const heroItems: HeroItem[] = React.useMemo(() => {
    const sourceItems = items && items.length ? items : [];
    const baseItem = sourceItems[0] || {
      title,
      subtitle,
      badge,
      buttonText,
      buttonLink,
      image,
      images,          // ✅ AGREGAR ESTO — prop raíz `images` incluido
      videoUrl,
      googleMaps,
      rating: googleMapsData?.rating,
      ratingCount: googleMapsData?.user_ratings_total,
      generalMessage,
    };

    const collectedImages = Array.from(
      new Set(
        sourceItems
          .flatMap((item) => Array.isArray(item.images) ? item.images : [])
          .concat(sourceItems.map((item) => item.image || null))
          .filter((url): url is string => !!url)
      )
    );

    const singleHero = {
      ...baseItem,
      // ✅ Prioriza images del baseItem (que ya incluye el prop raíz),
      //    luego las collectedImages de los sub-items
      images: (baseItem.images?.length ? baseItem.images : null)
        ?? (collectedImages.length ? collectedImages : undefined),
    } as HeroItem;

    if (singleHero.googleMaps && googleMapsData) {
      singleHero.rating = googleMapsData.rating;
      singleHero.ratingCount = googleMapsData.user_ratings_total;
    }

    return [singleHero].filter(
      (h) => h && (h.title || h.subtitle || h.image || h.videoUrl || (h.images && h.images.length))
    );
  }, [items, googleMapsData, title, subtitle, badge, buttonText, buttonLink, image, images, videoUrl, googleMaps, generalMessage]);
  //                                                                                         ^^^^^^ agregar `images` a las deps


  if (!heroItems.length) return null;

  const current = heroItems[0];
  const currentFieldStyles = current.fieldStyles || {};
  const currentFieldPositions = current.fieldPositions || fieldPositions || {};

  // debug logs removed

  // Helper para resolver estilos por campo considerando legacy y device-aware shape
  const resolveFieldStyle = (fieldName: string): React.CSSProperties => {
    const top = (fieldStyles as any)?.[fieldName] || {};
    const item = (currentFieldStyles as any)[fieldName] || {};

    const pickFor = (value: any) => {
      if (!value) return {};
      if (value.desktop !== undefined || value.mobile !== undefined) {
        return isDesktop ? value.desktop || {} : value.mobile || {};
      }
      return value;
    };

    const topPicked = pickFor(top);
    const itemPicked = pickFor(item);

    return {
      ...topPicked,
      ...itemPicked,
      ...getPositioningStyle(fieldName, isDesktop, currentFieldPositions),
    } as React.CSSProperties;
  };

  const badgeStyle: React.CSSProperties = resolveFieldStyle("badge");
  const titleStyle: React.CSSProperties = resolveFieldStyle("title");
  const subtitleStyle: React.CSSProperties = resolveFieldStyle("subtitle");
  const buttonTextStyle: React.CSSProperties = resolveFieldStyle("buttonText");
  const imagePositionStyle: React.CSSProperties = getPositioningStyle("image", isDesktop, currentFieldPositions);

  // Aplicar tamaños de fuente móvil si están definidos (priorizar item > props)
  const getMobileFontSizeFor = (fieldName: string): string | undefined => {
    // Priorizar valor por item (current)
    const itemVal = (current as any)?.[`${fieldName}MobileFontSize`];
    if (itemVal !== undefined && itemVal !== null) return typeof itemVal === "number" ? `${itemVal}px` : String(itemVal);

    // Luego props a nivel de sección (destructurados arriba)
    const topMap: Record<string, any> = {
      title: titleMobileFontSize,
      subtitle: subtitleMobileFontSize,
      badge: badgeMobileFontSize,
      buttonText: buttonTextMobileFontSize,
    };
    const topVal = topMap[fieldName];
    if (topVal !== undefined && topVal !== null) return typeof topVal === "number" ? `${topVal}px` : String(topVal);

    return undefined;
  };



  




  // Añadir fontSize a estilos si estamos en mobile y existe valor
  if (!isDesktop) {
    const tfs = getMobileFontSizeFor("title");
    if (tfs) titleStyle.fontSize = tfs;
    const sfs = getMobileFontSizeFor("subtitle");
    if (sfs) subtitleStyle.fontSize = sfs;
    const bfs = getMobileFontSizeFor("badge");
    if (bfs) badgeStyle.fontSize = bfs;
    const btnfs = getMobileFontSizeFor("buttonText");
    if (btnfs) buttonTextStyle.fontSize = btnfs;
  }

  // Estilos inline para la variante por defecto (cuando no hay posicionamiento)
  const defaultBadgeInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("badge") ? { fontSize: getMobileFontSizeFor("badge") } : {};
  const defaultTitleInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("title") ? { fontSize: getMobileFontSizeFor("title") } : {};
  const defaultSubtitleInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("subtitle") ? { fontSize: getMobileFontSizeFor("subtitle") } : {};
  const defaultButtonInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("buttonText") ? { fontSize: getMobileFontSizeFor("buttonText") } : {};

  

  // Container style: include background image as fallback so hero shows image
  const containerStyle: React.CSSProperties = {
    ...(bg ? { backgroundColor: bg } : {}),
    ...(color ? { color } : {}),
    paddingTop: 0,
    paddingBottom: 0,
    textAlign,
  };



  const galleryImages = Array.isArray(current.images) && current.images.length
    ? current.images.filter((url): url is string => !!url)
    : current.image
      ? [current.image]
      : [];
  const hasPositionedHeroElements =
    !!fieldPositions?.title ||
    !!fieldPositions?.buttonText ||
    !!fieldPositions?.subtitle ||
    !!fieldPositions?.badge;
  const hasGallery = galleryImages.length > 1;
  const hasSingleImage = galleryImages.length === 1;
  const hasVideo = !!current.videoUrl && !hasGallery && !hasSingleImage;
  const shouldRenderDefaultOverlay = !hasPositionedHeroElements && (!hasGallery || current.title || current.subtitle || current.badge || current.buttonText);


  // Agrega este hook antes del return principal
  const [galleryAspectRatio, setGalleryAspectRatio] = React.useState("2400 / 1000");

  React.useEffect(() => {
    if (!hasGallery) return;

    let maxRatio = 2400 / 1000; // horizontal por defecto

    const promises = galleryImages.slice(0, 4).map(
      (src) =>
        new Promise<number>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
          img.onerror = () => resolve(maxRatio);
          img.src = src;
        })
    );

    Promise.all(promises).then((ratios) => {
      // Si alguna imagen es vertical (ratio < 1), adaptamos el contenedor
      const hasVertical = ratios.some((r) => r < 1);
      if (hasVertical) {
        // Grid 2x2: el aspect ratio del contenedor = (ancho de 2 cols) / (alto de 2 filas)
        // Usamos el ratio más estrecho para que quepan casi completas
        const minRatio = Math.min(...ratios);
        // Contenedor = 2 imágenes de ancho, 2 de alto → ratio_contenedor = minRatio * (2/2)
        const containerRatio = minRatio * 1; // 2 cols / 2 rows se cancela
        setGalleryAspectRatio(`${containerRatio * 1000} / 1000`);
      } else {
        setGalleryAspectRatio("2400 / 1000");
      }
    });
  }, [galleryImages, hasGallery]);


  const innerStyle: React.CSSProperties = {
    aspectRatio: hasGallery ? "2400 / 1800" : "2400 / 900", // más alto
    overflow: "hidden",
  };

  return (
    <section style={containerStyle} className="m-0">
      <div
        className="relative overflow-hidden w-full max-w-full min-h-0"
        style={innerStyle}
      >
{hasGallery ? (
  <div
    className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0"
    style={imagePositionStyle}
  >
        {galleryImages.slice(0, 4).map((src, index) => (
          <div key={`${src}-${index}`} className="relative overflow-hidden">
            <img
              src={src}
              alt={current.title || `Hero ${index + 1}`}
              className="w-full h-full block"
              style={{
                display: "block",
                objectFit: "cover",
              }}
              draggable={false}
            />
          </div>
        ))}
    </div>
        ) : hasSingleImage ? (
          <img
            src={galleryImages[0]}
            alt={current.title || "Hero"}
            className="w-full h-full object-cover block"
            style={{ display: "block" }}
            draggable={false}
          />
        ) : hasVideo ? (
          <video
            className="w-full h-full object-cover block"
            style={{ borderRadius, display: "block" }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={current.videoUrl || ""} type="video/mp4" />
          </video>
        ) : current.image ? (
          <img
            src={current.image}
            alt={current.title || "Hero"}
            width={1920}
            height={840}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover block"
            style={{ borderRadius, display: "block" }}
            draggable={false}
          />
        ) : null}

        {/* Badge de Google Maps */}
        {current.googleMaps && (current.rating || current.ratingCount) && (
          <div className="absolute top-3 left-3 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex flex-col gap-1 max-w-45 sm:max-w-none">
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                <path
                  fill="#4285F4"
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
                />
              </svg>
              <span className="text-xs font-bold text-slate-700 dark:text-white">Google</span>
              <span className="text-xs font-extrabold text-yellow-500">
                {current.rating?.toFixed(1)}
              </span>
            </div>
            <StarRating rating={current.rating ?? 0} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {current.ratingCount?.toLocaleString()} reseñas
            </span>
            {current.generalMessage && (
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                {current.generalMessage}
              </p>
            )}
          </div>
        )}

        {/* Elementos posicionados personalizados (solo si tienen positioning) */}
        {fieldPositions?.badge && current.badge && (
          <span
            className="absolute inline-block px-2 py-0.5 text-[6px] sm:px-3 sm:py-1 sm:text-xs font-bold tracking-widest uppercase bg-white/90 text-black dark:bg-slate-900/90 dark:text-white rounded-full shadow"
            style={{
              position: "absolute",
              ...badgeStyle,
            }}
          >
            {current.badge}
          </span>
        )}

        {fieldPositions?.title && current.title && (
          <h2
            className="absolute text-xl sm:text-5xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-lg"
            style={{
              position: "absolute",
              ...titleStyle,
              whiteSpace: "nowrap",
            }}
          >
            {current.title}
          </h2>
        )}

        {fieldPositions?.subtitle && current.subtitle && (
          <p
            className="absolute text-white/80 text-[9px] sm:text-sm drop-shadow"
            style={{
              position: "absolute",
              ...subtitleStyle,
              maxWidth: "90%",
            }}
          >
            {current.subtitle}
          </p>
        )}

        {fieldPositions?.buttonText && current.buttonText && (
          <a
            href={current.buttonLink || "/products-by-category"}
            className="absolute inline-flex items-center gap-1 sm:gap-2 bg-white/95 hover:bg-white text-black font-bold text-[9px] sm:text-2xl px- py-1.5 sm:px-1 sm:py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              position: "absolute",
              ...buttonTextStyle,
            }}
          >
            <span>{current.buttonText}</span>
            <span className="material-icons-round text-xs sm:text-sm">arrow_forward</span>
          </a>
        )}

        {/* Contenido textual y CTA del hero */}
        {shouldRenderDefaultOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 sm:px-8 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-3 max-w-3xl">
              {current.badge && (
                <span
                  className="inline-block px-3 py-1 text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-white/90 text-black dark:bg-slate-900/90 dark:text-white rounded-full shadow"
                  style={{ ...defaultBadgeInlineStyle, ...badgeStyle }}
                >
                  {current.badge}
                </span>
              )}
              {current.title && (
                <h2
                  className="text-2xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg"
                  style={{ ...defaultTitleInlineStyle, ...titleStyle }}
                >
                  {current.title}
                </h2>
              )}
              {current.subtitle && (
                <p
                  className="text-white/85 text-sm sm:text-lg max-w-[90vw] sm:max-w-2xl drop-shadow"
                  style={{ ...defaultSubtitleInlineStyle, ...subtitleStyle }}
                >
                  {current.subtitle}
                </p>
              )}
              {current.buttonText && (
                <a
                  href={current.buttonLink || "/products-by-category"}
                  className="inline-flex items-center gap-2 bg-white hover:bg-white text-black font-bold text-xs sm:text-lg px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ ...defaultButtonInlineStyle, ...buttonTextStyle }}
                >
                  <span>{current.buttonText}</span>
                  <span className="material-icons-round text-sm">arrow_forward</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
