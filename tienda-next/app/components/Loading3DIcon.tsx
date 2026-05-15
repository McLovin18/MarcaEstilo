"use client";
import React from "react";

export function Loading3DIcon() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        
        {/* 1. Halo de resplandor (Glow) */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-[35px] opacity-0 dark:opacity-100 animate-pulse" />

        {/* 2. Contenedor Neumórfico */}
        <div className="
          relative w-24 h-24 rounded-full flex items-center justify-center
          bg-slate-50 dark:bg-[#111420]
          border border-white/50 dark:border-white/10
          shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]
          dark:shadow-[12px_12px_24px_#07080d,-12px_-12px_24px_#1c2135]
        ">
          
          {/* 3. El Núcleo */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-l-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-400 shadow-[0_0_15px_rgba(129,140,248,0.5)] animate-pulse" />
          </div>
        </div>

        {/* 4. Anillo de progreso técnico (SVG con animación Tailwind) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="46"
            fill="none"
            stroke="url(#loading-gradient)"
            strokeWidth="3"
            strokeDasharray="289"
            strokeLinecap="round"
            className="animate-[dash_2s_ease-in-out_infinite]"
          />
          <defs>
            <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 5. Etiqueta de estado */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-indigo-400/70">
          Preparando productos
        </span>
        <div className="flex gap-1 mt-2">
          <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
