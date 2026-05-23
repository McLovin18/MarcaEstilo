"use client";

import React from "react";
import Image from "next/image";

export function Loading3DIcon() {
  return (
    <div className="flex flex-col items-center justify-center py-10 select-none">

      {/* CONTENEDOR */}
      <div className="relative w-36 h-36 flex items-center justify-center">

        {/* Glow principal */}
        <div className="
          absolute inset-0
          bg-black/15
          blur-3xl
          rounded-full
          animate-pulse
        " />

        {/* Ring exterior */}
        <div className="
          absolute inset-2
          rounded-full
         
          border border-black/15
        " />

        {/* Ring animado */}
        <div className="
          absolute inset-0
          rounded-full
          
          border-2 border-transparent
          border-t-black
          animate-spin
        "
        style={{
          animationDuration: "2.5s"
        }}
        />

        {/* Núcleo */}
        <div className="
          relative w-24 h-24
          rounded-full
          bg-black dark:bg-[#111]

          shadow-[0_0_40px_rgba(0,0,0,0.18)]
          flex items-center justify-center
        ">

          {/* Diamante */}
          <div className="relative w-20 h-20 animate-pulse">

            <Image
              src="/diamante.png"
              alt="Loading"
              fill
              className="object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.35)]"
              priority
            />

          </div>
        </div>
      </div>

      {/* Texto */}
      <div className="mt-6 flex flex-col items-center">

        <span className="
          text-[11px]
          font-bold
          tracking-[0.35em]
          uppercase
          text-black
        ">
          Marca tu estilo
        </span>


        <div className="flex gap-1.5 mt-3 items-center">

          <div className="flex gap-1.5 animate-loadingSteps">

            <div className="w-1.5 h-1.5 rounded-full bg-black" />

            <div className="w-1.5 h-1.5 rounded-full bg-black" />

            <div className="w-1.5 h-1.5 rounded-full bg-black" />

          </div>
        </div>
      </div>
    </div>
  );
}