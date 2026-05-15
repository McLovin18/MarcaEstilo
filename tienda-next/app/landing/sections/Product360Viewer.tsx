"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
};

export default function Product360Viewer({
  images,
  autoPlay = false,
  interval = 100,
}: Props) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragThreshold = 30; // pixels antes de considerar que es un drag

  // 🔥 Preload de imágenes (pro feature)
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  const next = () => {
    setIsTransitioning(true);
    setIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prev = () => {
    setIsTransitioning(true);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // 🖱️ Drag con mouse (pro feature)
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) {
      setIsDragging(false);
      return;
    }

    const dragDistance = e.clientX - dragStartX.current;

    if (dragDistance > dragThreshold) {
      prev();
    } else if (dragDistance < -dragThreshold) {
      next();
    }

    setIsDragging(false);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;

    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, interval]);

  const imageStyle = {
    width: "100%",
    display: "block",
    opacity: isTransitioning ? 0.8 : 1,
    transform: isDragging ? "scale(1.02)" : "scale(1)",
    transition: isDragging
      ? "none"
      : "opacity 300ms ease-in-out, transform 300ms ease-in-out",
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none" as const,
  };

  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    maxWidth: 500,
  };

  const controlsStyle = {
    position: "absolute" as const,
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 12,
    zIndex: 10,
  };

  const buttonStyle = {
    background: "rgba(255, 255, 255, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    padding: "10px 14px",
    color: "white",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    backdropFilter: "blur(10px)",
    transition: "all 200ms ease",
    userSelect: "none" as const,
    hover: {
      background: "rgba(255, 255, 255, 0.25)",
    },
  };

  const indicatorStyle = {
    position: "absolute" as const,
    top: 16,
    right: 16,
    background: "rgba(0, 0, 0, 0.4)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    backdropFilter: "blur(10px)",
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      <img
        src={images[index]}
        style={imageStyle as any}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        draggable={false}
        alt={`Product view ${index + 1}`}
      />



      {/* Puntos indicadores */}
      <div
        style={{
          position: "absolute" as const,
          bottom: 70,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
          zIndex: 5,
        }}
      >
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIsTransitioning(true);
              setIndex(i);
              setTimeout(() => setIsTransitioning(false), 300);
            }}
            style={{
              width: i === index ? 12 : 8,
              height: 8,
              borderRadius: "50%",
              border: "none",
              background:
                i === index
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(255, 255, 255, 0.3)",
              cursor: "pointer",
              transition: "all 200ms ease",
              padding: 0,
            }}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>

      {/* Controles principales */}
      <div style={controlsStyle}>
        <button
          onClick={prev}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
          }}
          style={buttonStyle as any}
          aria-label="Previous image"
        >
          ◀
        </button>
        <button
          onClick={next}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
          }}
          style={buttonStyle as any}
          aria-label="Next image"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

