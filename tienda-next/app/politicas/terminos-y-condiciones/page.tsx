"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const sections = [
  {
    number: "01",
    title: "Uso Aceptable",
    body: "El sitio web de MARCA ESTILO debe ser utilizado de manera legal, ética y responsable. Queda estrictamente prohibido el uso del mismo para actividades ilícitas, fraudulentas o que puedan resultar perjudiciales para terceros o para la empresa.",
  },
  {
    number: "02",
    title: "Política de Privacidad",
    body: "El uso de este sitio está sujeto a nuestra Política de Privacidad. Recomendamos revisar dicho documento para conocer cómo recopilamos, utilizamos y protegemos tu información personal. El acceso y permanencia en el sitio implica tu aceptación expresa de nuestras prácticas de manejo de datos.",
  },
  {
    number: "03",
    title: "Modificaciones a los Términos",
    body: "MARCA ESTILO se reserva el derecho de modificar los presentes términos y condiciones en cualquier momento. Las modificaciones entrarán en vigor de manera inmediata tras su publicación en el sitio web. Es responsabilidad del usuario revisar periódicamente esta sección para mantenerse informado sobre posibles actualizaciones.",
  },
  {
    number: "04",
    title: "Terminación del Uso",
    body: "Nos reservamos el derecho de restringir, suspender o cancelar tu acceso a nuestro sitio web si consideramos que has incumplido estos términos y condiciones, o si tu comportamiento resulta perjudicial para otros usuarios o para la empresa.",
  },
  {
    number: "05",
    title: "Disponibilidad de Productos en Promoción",
    body: "Ofrecemos productos en promoción por tiempo limitado, con el fin de brindarte oportunidades de compra exclusivas. No obstante, dichas promociones están sujetas a disponibilidad de stock. En caso de agotarse el inventario de un producto antes de la fecha de finalización de la promoción, no será posible extender la oferta para dicho artículo. Agradecemos tu comprensión, ya que esto nos permite mantener una política promocional justa y equitativa para todos nuestros clientes.",
  },
  {
    number: "06",
    title: "Tiempo Estimado de Entrega",
    body: "El tiempo de procesamiento puede variar según el tipo de producto y la ubicación del destinatario. Generalmente, los pedidos se procesan en un plazo de 1 a 2 días hábiles. Ten en cuenta que estos plazos son estimaciones y podrían verse afectados por factores externos, como condiciones climáticas adversas o retrasos por parte de los servicios de transporte. Si tienes requerimientos especiales de entrega, no dudes en ponerte en contacto con nuestro equipo de atención al cliente.",
  },
  {
    number: "07",
    title: "Contacto",
    body: null,
    isContact: true,
  },
];

const TerminosCondiciones: React.FC = () => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!lineRef.current) return;
      const el = lineRef.current;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const progress = Math.min(
        Math.max((windowH - rect.top) / (rect.height + windowH), 0),
        1
      );
      el.style.setProperty("--progress", String(progress));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        /* ── Animations ── */
        @keyframes tc-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tc-section { animation: tc-fade-in 0.5s ease both; }
        .tc-section:nth-child(1) { animation-delay: 0.05s; }
        .tc-section:nth-child(2) { animation-delay: 0.10s; }
        .tc-section:nth-child(3) { animation-delay: 0.15s; }
        .tc-section:nth-child(4) { animation-delay: 0.20s; }
        .tc-section:nth-child(5) { animation-delay: 0.25s; }
        .tc-section:nth-child(6) { animation-delay: 0.30s; }
        .tc-section:nth-child(7) { animation-delay: 0.35s; }

        /* ── Timeline progress line ── */
        .tc-line {
          position: absolute;
          left: 47px;
          top: 72px;
          bottom: 100px;
          width: 1px;
        }
        .tc-line::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          background: linear-gradient(180deg, #7c3aed, #a855f7);
          height: calc(var(--progress, 0) * 100%);
          transition: height 0.1s linear;
        }

        @media (max-width: 640px) {
          .tc-line { display: none; }
        }

        /* ── Hero grid lines — light ── */
        .tc-hero-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(0,0,0,0.04) 39px,
            rgba(0,0,0,0.04) 40px
          );
          pointer-events: none;
        }
        /* dark override */
        .dark .tc-hero-grid::after {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.015) 39px,
            rgba(255,255,255,0.015) 40px
          );
        }

        /* ── Card hover — light ── */
        .tc-card:hover {
          border-color: rgba(124,58,237,0.35) !important;
          background: rgba(124,58,237,0.04) !important;
        }

        /* ── Contact btn hover ── */
        .tc-contact-btn:hover {
          background: #6d28d9 !important;
          transform: translateY(-1px);
        }

        /* ── Back link hover ── */
        .tc-back-link:hover { gap: 10px; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .tc-num-col { display: none !important; }
        }
      `}</style>

      {/* ─────────────── LIGHT (default) / DARK via .dark class ─────────────── */}
      <div
        className="
          tc-page
          font-[DM_Sans,sans-serif]
          min-h-screen
          bg-white text-gray-900
          dark:bg-[#0d0d0f] dark:text-[#e2ddf0]
        "
      >

        {/* ── Hero ── */}
        <div className="tc-hero-grid relative overflow-hidden px-6 pt-10 pb-6 text-center">

          {/* glow */}
          <div
            className="
              pointer-events-none absolute left-1/2 -top-32 -translate-x-1/2
              w-[560px] h-[560px] rounded-full
              bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_65%)]
              dark:bg-[radial-gradient(circle,rgba(100,50,200,0.18)_0%,transparent_65%)]
            "
          />

          <div className="relative z-10" style={{ padding: "" }}>
            {/* Eyebrow */}
            <div className="
              inline-flex items-center gap-2 mb-5
              font-[Syne,sans-serif] text-[11px] font-semibold tracking-[0.2em] uppercase
              text-violet-600 dark:text-[#8b5cf6]
              px-[14px] py-[5px] rounded-full
              border border-violet-200 bg-violet-50
              dark:border-[rgba(139,92,246,0.3)] dark:bg-[rgba(139,92,246,0.07)]
            ">
              <div className="w-[5px] h-[5px] rounded-full bg-violet-500 dark:bg-[#8b5cf6]" />
              Documento legal
            </div>

            {/* Title */}
            <h1
              className="
                font-[Syne,sans-serif] text-3xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight
                text-gray-900 dark:text-white
                mb-2
              "
              style={{ }}
            >
              Términos y<br />
              <span className="text-violet-600 dark:text-[#7c3aed]">Condiciones</span>
            </h1>

            {/* Subtitle */}
            <p className="
              text-base font-light italic leading-relaxed
              text-gray-500 dark:text-[#8b7faa]
              max-w-[520px] mx-auto mb-3
            ">
              Al utilizar nuestros servicios aceptas los siguientes términos.
              Te recomendamos leerlos detenidamente antes de realizar cualquier acción.
            </p>

          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="mx-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.35) 40%, rgba(124,58,237,0.35) 60%, transparent)" }}
        />

        {/* ── Body ── */}
        <div className="relative max-w-[860px] mx-auto px-6 pt-[20px] pb-[10px]">

          {/* Timeline vertical line */}
          <div
            className="tc-line bg-violet-100 dark:bg-[rgba(124,58,237,0.12)]"
            ref={lineRef}
            style={{ "--progress": "0" } as React.CSSProperties}
          />

          {sections.map((s) =>
            s.isContact ? (
              /* Contact section */
              <div key={s.number} className="tc-section flex gap-3 mb-12">
                <div className="flex-shrink-0 flex flex-col items-center">

                </div>
                <div className="
                  tc-contact-card flex-1 flex items-center justify-between flex-wrap gap-4
                  rounded-2xl px-3 py-6
                  bg-violet-50 border border-violet-200
                  dark:bg-[rgba(124,58,237,0.07)] dark:border-[rgba(124,58,237,0.25)]
                ">
                  <div>
                    <p className="
                      font-[Syne,sans-serif] text-[17px] font-bold mb-1
                      text-gray-900 dark:text-white
                    ">
                      Contacto
                    </p>
                    <p className="text-sm font-light text-gray-500 dark:text-[#9d91b8] m-0">
                      Consultas, comentarios o inquietudes sobre estos términos
                    </p>
                  </div>
                  <a
                    href="mailto:marcaestilo@email.com"
                    className="
                      tc-contact-btn inline-flex items-center gap-2 flex-shrink-0
                      font-[Syne,sans-serif] text-[13px] font-semibold
                      bg-violet-600 hover:bg-violet-700 text-white
                      px-5 py-[10px] rounded-[10px] no-underline whitespace-nowrap
                      transition-all duration-200
                    "
                    style={{ display: "inline-flex" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    marcaestilo@email.com
                  </a>
                </div>
              </div>
            ) : (
              /* Regular section */
              <div key={s.number} className="tc-section flex gap-8 mb-12">
                {/* Number badge */}
                <div className="tc-num-col flex-shrink-0 flex flex-col items-center">
                  <div className="
                    w-[46px] h-[46px] rounded-full flex items-center justify-center relative z-10
                    font-[Syne,sans-serif] text-xs font-bold
                    text-violet-600 dark:text-[#8b5cf6]
                    bg-white border border-violet-200
                    dark:bg-[#0d0d0f] dark:border-[rgba(124,58,237,0.35)]
                  ">
                    {s.number}
                  </div>
                </div>

                {/* Card */}
                <div className="
                  tc-card flex-1 rounded-2xl px-7 py-6
                  bg-gray-50 border border-gray-100
                  dark:bg-[rgba(255,255,255,0.025)] dark:border-[rgba(255,255,255,0.06)]
                  transition-all duration-200
                ">
                  <p className="
                    font-[Syne,sans-serif] text-[17px] font-bold mb-[10px] tracking-tight
                    text-gray-900 dark:text-white
                  ">
                    {s.title}
                  </p>
                  <p className="text-[14.5px] font-light leading-[1.8] m-0 text-gray-500 dark:text-[#9d91b8]">
                    {s.body}
                  </p>
                </div>
              </div>
            )
          )}

          {/* ── Footer note ── */}
          <div className="
            mt-16 pt-8 text-center
            border-t border-gray-100 dark:border-[rgba(255,255,255,0.06)]
          ">
            <p className="
              text-[13.5px] font-light leading-[1.8] mb-4 max-w-[500px] mx-auto
              text-gray-400 dark:text-[#5a5270]
            ">
              Gracias por confiar en MARCA ESTILO. Tu cumplimiento con estos términos
              contribuye a mantener un entorno seguro, respetuoso y confiable para toda nuestra comunidad.
            </p>
            <Link
              href="/"
              className="
                tc-back-link inline-flex items-center gap-2
                font-[Syne,sans-serif] text-[13px] font-semibold no-underline
                text-violet-600 dark:text-[#8b5cf6]
                transition-all duration-200
              "
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>

      </div>
    </>
  );
};

export default TerminosCondiciones;
