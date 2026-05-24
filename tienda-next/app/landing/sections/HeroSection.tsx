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
  isLast?: boolean;
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
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonBorderColor?: string;
  buttonBorderWidth?: string;
  buttonBorderRadius?: string;
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


export default function HeroSection({
  isLast,
  title,
  subtitle,
  badge,
  titleMobileFontSize,
  subtitleMobileFontSize,
  badgeMobileFontSize,
  buttonTextMobileFontSize,
  buttonText,
  buttonLink,
  buttonBackgroundColor,
  buttonTextColor,
  buttonBorderColor,
  buttonBorderWidth,
  buttonBorderRadius,
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

  const BASE_IMAGE_WIDTH = 2400;
  const BASE_IMAGE_HEIGHT = 1000;

  const getPositioningStyle = (
    fieldName: string,
    isDesktop: boolean,
    positionsSource?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>
  ): React.CSSProperties => {
    const src = positionsSource || fieldPositions;
    if (!src?.[fieldName]) return {};
    const position = isDesktop ? src[fieldName].desktop : src[fieldName].mobile;
    if (!position) return {};
    return {
      ...(position.left !== undefined && { left: `${(position.left / BASE_IMAGE_WIDTH) * 100}%` }),
      ...(position.top !== undefined && { top: `${(position.top / BASE_IMAGE_HEIGHT) * 100}%` }),
      ...((fieldName !== "badge" && fieldName !== "buttonText" && position.width !== undefined) && { width: `${(position.width / BASE_IMAGE_WIDTH) * 50}%` }),
      ...((fieldName !== "badge" && fieldName !== "buttonText" && position.height !== undefined) && { height: `${(position.height / BASE_IMAGE_HEIGHT) * 50}%` }),
      ...(position.zIndex !== undefined && { zIndex: position.zIndex }),
    };
  };

  // ── 1. TODOS LOS useState ─────────────────────────────────────────────────
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof device !== "undefined") return device === "desktop";
    return typeof window !== "undefined" ? window.innerWidth >= 768 : true;
  });
  const [currentIndex, setCurrentIndex] = React.useState(0);
const [galleryAspectRatio, setGalleryAspectRatio] = React.useState(() => {
  const imgs = (items?.[0]?.images ?? images ?? []).filter(Boolean);
  return imgs.length > 1 ? "2400 / 1800" : "2400 / 1000";
});

  // ── 2. TODOS LOS useEffect ────────────────────────────────────────────────
  React.useEffect(() => {
    if (typeof device !== "undefined") {
      setIsDesktop(device === "desktop");
      return;
    }
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, [device]);

  // ── 3. HOOKS CUSTOM ───────────────────────────────────────────────────────
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID;
  const hasGoogleMaps = googleMaps || (items && items.some((i) => i.googleMaps));
  const { data: googleMapsData } = useGoogleMapsPlaceDetails(placeId, hasGoogleMaps);

  // ── 4. useMemo ────────────────────────────────────────────────────────────
  const heroItems: HeroItem[] = React.useMemo(() => {
    const sourceItems = items && items.length ? items : [];
    const baseItem = sourceItems[0] || {
      title,
      subtitle,
      badge,
      buttonText,
      buttonLink,
      image,
      images,
      videoUrl,
      googleMaps,
      rating: googleMapsData?.rating,
      ratingCount: googleMapsData?.user_ratings_total,
      generalMessage,
    };

    const imgsFromArrays = sourceItems.flatMap((item) =>
      Array.isArray(item.images) ? item.images : []
    ).filter((u): u is string => !!u);
    const imgsFromSingle = sourceItems
      .map((item) => item.image)
      .filter((u): u is string => !!u);
    const collectedImages = Array.from(new Set([...imgsFromArrays, ...imgsFromSingle]));

    const singleHero = {
      ...baseItem,
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



  // ── 6. RETURN CONDICIONAL — después de todos los hooks ───────────────────
  if (!heroItems.length) return null;

  // ── 7. Derivados (no son hooks) ───────────────────────────────────────────
  const current = heroItems[0];
  const currentFieldStyles = current.fieldStyles || {};
  const currentFieldPositions = current.fieldPositions || fieldPositions || {};

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

    return {
      ...pickFor(top),
      ...pickFor(item),
      ...getPositioningStyle(fieldName, isDesktop, currentFieldPositions),
    } as React.CSSProperties;
  };

  const badgeStyle: React.CSSProperties = resolveFieldStyle("badge");
  const titleStyle: React.CSSProperties = resolveFieldStyle("title");
  const subtitleStyle: React.CSSProperties = resolveFieldStyle("subtitle");
  const buttonTextStyle: React.CSSProperties = resolveFieldStyle("buttonText");
  const imagePositionStyle: React.CSSProperties = getPositioningStyle("image", isDesktop, currentFieldPositions);

  const buttonCustomStyle: React.CSSProperties = {
    backgroundColor: buttonBackgroundColor ?? "transparent",
    color: buttonTextColor ?? "white",
    border: buttonBorderColor
      ? `${buttonBorderWidth ?? "2px"} solid ${buttonBorderColor}`
      : "2px solid white",
    borderRadius: buttonBorderRadius ?? "1rem",
    ...buttonTextStyle,
  };

  const getMobileFontSizeFor = (fieldName: string): string | undefined => {
    const itemVal = (current as any)?.[`${fieldName}MobileFontSize`];
    if (itemVal !== undefined && itemVal !== null) return typeof itemVal === "number" ? `${itemVal}px` : String(itemVal);
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

  const defaultBadgeInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("badge") ? { fontSize: getMobileFontSizeFor("badge") } : {};
  const defaultTitleInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("title") ? { fontSize: getMobileFontSizeFor("title") } : {};
  const defaultSubtitleInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("subtitle") ? { fontSize: getMobileFontSizeFor("subtitle") } : {};
  const defaultButtonInlineStyle: React.CSSProperties = !isDesktop && getMobileFontSizeFor("buttonText") ? { fontSize: getMobileFontSizeFor("buttonText") } : {};

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

  const mobileParallaxRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (!isLast) return;
    if (typeof window === "undefined") return;
    // only enable on narrow viewports (mobile)
    if (window.innerWidth >= 768) return;

    let rafId = 0;
    const speed = 0.28; // parallax factor (increased for faster flow)
    let attachedImg: HTMLImageElement | null = null;
    let checkInterval: number | null = null;

    const attachToImg = (img: HTMLImageElement) => {
      attachedImg = img;
      const onScroll = () => {
        if (!attachedImg) return;
        // Use page scroll position to emulate background-attachment: fixed
        const pageY = window.scrollY || window.pageYOffset;
        const offsetTop = attachedImg.offsetTop || 0;
        const translate = Math.round((pageY - offsetTop) * speed);
        const clamped = Math.max(Math.min(translate, 120), -120);
        attachedImg.style.transform = `translateY(${clamped}px)`;
      };

      const handler = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(onScroll);
      };

      window.addEventListener("scroll", handler, { passive: true });
      handler();

      return () => {
        window.removeEventListener("scroll", handler);
        if (rafId) cancelAnimationFrame(rafId);
        if (attachedImg) attachedImg.style.transform = "";
      };
    };

    // try to find the image element; if not found, retry shortly up to 1s
    const findAndAttach = () => {
      const found = document.querySelector('img[data-hero-parallax]') as HTMLImageElement | null;
      if (found) {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        const cleanup = attachToImg(found);
        // store cleanup for return
        (attachToImg as any)._cleanup = cleanup;
      }
    };

    findAndAttach();
    if (!(document.querySelector('img[data-hero-parallax]') as HTMLImageElement | null)) {
      let attempts = 0;
      checkInterval = window.setInterval(() => {
        attempts += 1;
        findAndAttach();
        if (attempts > 10) {
          if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
        }
      }, 100) as unknown as number;
    }

    return () => {
      if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
      const cleanup = (attachToImg as any)._cleanup;
      if (cleanup) cleanup();
    };
  }, [isLast, isDesktop]);

  const hasPositionedHeroElements =
    !!fieldPositions?.title ||
    !!fieldPositions?.buttonText ||
    !!fieldPositions?.subtitle ||
    !!fieldPositions?.badge;

  const hasGallery = galleryImages.length > 1;
  const hasSingleImage = galleryImages.length === 1;
  const hasVideo = !!current.videoUrl && !hasGallery && !hasSingleImage;
  const mobileSingleImageLayout = !isDesktop && hasSingleImage;
  const shouldRenderDefaultOverlay = !hasPositionedHeroElements && (!hasGallery || current.title || current.subtitle || current.badge || current.buttonText);

const innerStyle: React.CSSProperties = ((): React.CSSProperties => {
  if (hasGallery && !isDesktop) {
    // Mobile stacked gallery: let content determine height
    return {
      borderRadius: "0",
      overflow: "visible",
      position: "relative",
      minHeight: "auto",
    };
  }
  return {
    borderRadius: hasGallery ? "0" : borderRadius,
    aspectRatio: hasGallery ? "2400 / 1800" : "2400 / 1000",
    overflow: "hidden",
    position: "relative",
    minHeight: "300px",
  };
})();

  if (mobileSingleImageLayout) {
    return (
      <>
        <section style={containerStyle} className="m-0">
          <div className="w-full max-w-full bg-black overflow-hidden">
            {current.image ? (
              <img
                src={current.image}
                alt={current.title || "Hero"}
                className="w-full h-auto block object-cover"
                style={{ objectPosition: "center 15%" }}
                draggable={false}
              />
            ) : null}
          </div>

          <div className="bg-black text-center px-4 py-8 sm:py-10">
            <div className="mx-auto flex flex-col items-center gap-3 max-w-3xl">
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
                  className="inline-flex items-center gap-2 font-bold text-xs sm:text-lg px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: buttonTextStyle.backgroundColor ?? "white",
                    color: buttonTextStyle.color ?? "black",
                    border: buttonTextStyle.border ?? "none",
                    backdropFilter: (buttonTextStyle as any).backdropFilter,
                    ...defaultButtonInlineStyle,
                    ...buttonTextStyle,
                    ...buttonCustomStyle,
                  }}
                >
                  <span>{current.buttonText}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
    <section style={containerStyle} className="m-0">
      <div
        className="relative overflow-hidden w-full max-w-full min-h-0 bg-slate-950"
        style={{ ...innerStyle, willChange: "contents"}}
      >
{hasGallery ? (
  isDesktop ? (
    <div
      className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0"
      style={imagePositionStyle}
    >
      {galleryImages.slice(0, 4).map((src, index) => (
        <div key={`${src}-${index}`} className="relative overflow-hidden">
          <img
            src={src}
            alt={current.title || `Hero ${index + 1}`}
            className="absolute inset-0 w-full h-full block"
            style={{
              objectFit: "cover",
              filter: "brightness(0.6)",
              opacity: 0,
              transition: "opacity 0.6s ease",
            }}
            onLoad={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "1";
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  ) : (
    // Mobile: stacked images, button centered on first image
    <div className="w-full flex flex-col gap-4">
      {galleryImages.map((src, index) => (
        <div key={`${src}-${index}`} className="relative w-full overflow-hidden">
          <img
            src={src}
            alt={current.title || `Hero ${index + 1}`}
            className="w-full h-64 sm:h-80 object-cover block"
            style={{ filter: "brightness(0.6)", transition: "opacity 0.5s ease" }}
            draggable={false}
          />

          {index === 0 && current.buttonText && (
            <a
              href={current.buttonLink || "/products-by-category"}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-2xl shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: buttonTextStyle.backgroundColor ?? "white",
                color: buttonTextStyle.color ?? "black",
                border: buttonTextStyle.border ?? "none",
                backdropFilter: (buttonTextStyle as any).backdropFilter,
                zIndex: 30,
                pointerEvents: "auto",
                ...defaultButtonInlineStyle,
                ...buttonTextStyle,
                ...buttonCustomStyle,
              }}
            >
              <span>{current.buttonText}</span>
            </a>
          )}
        </div>
      ))}
    </div>
  )
) : hasSingleImage ? (
  <img
    src={galleryImages[0]}
    alt={current.title || "Hero"}
    className="absolute inset-0 w-full h-full block"  // ✅ absolute como la galería
    style={{
      objectFit: "cover",
      objectPosition: "center 15%",
      filter: "brightness(0.6)",
      opacity: 0,
      transition: "opacity 0.5s ease",
    }}
    onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
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
    className="absolute inset-0 w-full h-full block"  // ✅ absolute
    style={{
      objectFit: "cover",
      objectPosition: "center 15%",
      filter: "brightness(0.6)",
      opacity: 0,
      transition: "opacity 0.5s ease",
    }}
    onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
    draggable={false}
  />
) : null}

{/* ✅ Overlay oscuro sobre todas las imágenes/video */}
<div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />

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

        {fieldPositions?.buttonText && current.buttonText && !(hasGallery && !isDesktop) && (
          <a
            href={current.buttonLink || "/products-by-category"}
            className="absolute inline-flex items-center gap-1 sm:gap-2 font-bold text-[9px] sm:text-2xl px-3 py-1.5 sm:px-4 sm:py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: buttonTextStyle.backgroundColor ?? "white",
              color: buttonTextStyle.color ?? "black",
              border: buttonTextStyle.border ?? "none",
              backdropFilter: (buttonTextStyle as any).backdropFilter,
              position: "absolute",
              ...buttonTextStyle,
            }}
          >
            <span>{current.buttonText}</span>
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
              {current.buttonText && !(hasGallery && !isDesktop) && (
                <a
                  href={current.buttonLink || "/products-by-category"}
                  className="inline-flex items-center gap-2 font-bold text-xs sm:text-lg px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: buttonTextStyle.backgroundColor ?? "white",
                    color: buttonTextStyle.color ?? "black",
                    border: buttonTextStyle.border ?? "none",
                    backdropFilter: (buttonTextStyle as any).backdropFilter,
                    ...defaultButtonInlineStyle,
                    ...buttonTextStyle,
                    ...buttonCustomStyle
                  }}
                >
                  <span>{current.buttonText}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>

    {isLast && (
      isDesktop ? (
        <section
          className="relative w-full overflow-hidden"
          style={{ minHeight: "500px", height: "60vh" }}
        >
          {/* Imagen con efecto parallax */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(https://marcaestilo593.com/cdn/shop/files/WhatsApp_Image_2025-04-10_at_14.38.14.jpg?v=1744313930&width=1500)`,
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          />

          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Texto abajo centrado */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-8 sm:pb-12">
            <p
              className="text-white text-center italic text-sm sm:text-2xl lg:text-2xl drop-shadow-lg px-6"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Exclusividad que viste, Viste la diferencia, Marca tu Estilo
            </p>
          </div>
        </section>
      ) : (
        // Mobile: image without opacity and text below the image
        <section className="w-full">
          <div className="w-full overflow-hidden">
            <img
              ref={mobileParallaxRef}
              data-hero-parallax="true"
              src="https://marcaestilo593.com/cdn/shop/files/WhatsApp_Image_2025-04-10_at_14.38.14.jpg?v=1744313930&width=1500"
              alt="Marca Estilo"
              className="w-full h-auto object-cover block"
              style={{ filter: "none", transition: "transform 0.12s linear", willChange: "transform" }}
              draggable={false}
            />
          </div>
          <div className="py-6 px-2">
            <p
              className="text-center italic text-2xl sm:text-2xl drop-shadow-lg text-white"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Exclusividad que viste, Viste la diferencia, Marca tu Estilo
            </p>
          </div>
        </section>
      )
    )}


    </>

  );
}
