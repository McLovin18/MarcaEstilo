"use client";

import { useEffect, useRef } from "react";

interface DatafastWidgetProps {
  checkoutId: string;
  pedidoId: string;
}

/**
 * Renderiza el widget de pago de Datafast (Peach Payments / HiPay).
 * Datafast inyecta un formulario de pago dentro del div #payment-form
 * usando su script de JavaScript.
 *
 * Documentación: https://datafast.com.ec/documentacion
 *
 * Variables de entorno requeridas en .env.local:
 *   NEXT_PUBLIC_DATAFAST_SCRIPT_URL
 *   → En pruebas: https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=
 *   → En producción: https://oppwa.com/v1/paymentWidgets.js?checkoutId=
 */

const DATAFAST_SCRIPT_BASE =
  process.env.NEXT_PUBLIC_DATAFAST_SCRIPT_URL ||
  "https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=";

// Tipos de pago a mostrar en el widget (VISA, MASTERCARD, AMEX, etc.)
const PAYMENT_BRANDS = "VISA MASTERCARD DINERS AMEX";

export default function DatafastWidget({ checkoutId, pedidoId }: DatafastWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!checkoutId || !containerRef.current) return;

    // ⭐ Configurar wpwlOptions ANTES de cargar el script
    window.wpwlOptions = {
      onReady: function() {
        const datafast = '<br/><br/><img src="https://www.datafast.com.ec/images/verified.png" style="display:block;margin:0 auto; width:100%;">';
        const form = document.querySelector('form.wpwl-form-card');
        if (form) {
          const button = form.querySelector('.wpwl-button');
          if (button) {
            button.insertAdjacentHTML('beforebegin', datafast);
          }
        }
      },
      style: "card",
      locale: "es",
      labels: {
        cvv: "CVV",
        cardHolder: "Nombre(Igual que en la tarjeta)"
      }
    };

    // Limpiar script anterior si existiera
    if (scriptRef.current) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = `${DATAFAST_SCRIPT_BASE}${checkoutId}`;
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [checkoutId]);

  // La URL de retorno después del pago — Datafast redirige aquí
  // /api/datafast/resultado procesará el resultado y actualizará Firebase
  const shopperResultUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/datafast/resultado?pedidoId=${pedidoId}`
      : `/api/datafast/resultado?pedidoId=${pedidoId}`;

  return (
    <div className="widget-wrapper">
      <div className="security-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Pago 100% seguro con cifrado SSL</span>
      </div>

      {/*
        Datafast busca este div con el atributo data-brands para inyectar el form.
        shopperResultUrl es la URL a donde redirige Datafast al finalizar.
      */}
      <div
        ref={containerRef}
        id="payment-form"
        className="payment-form-container"
      >
        <form
          action={shopperResultUrl}
          className="paymentWidgets"
          data-brands={PAYMENT_BRANDS}
        />
      </div>

      <p className="widget-disclaimer">
        Tus datos de pago son procesados de forma segura por Datafast.
        MarcaEstilo no almacena información de tu tarjeta.
      </p>

      <style jsx>{`
        .widget-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(30,30,30,0.8);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #ddd;
          font-size: 13px;
          font-weight: 500;
        }

        .payment-form-container {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          padding: 4px;
          /* Datafast inyecta su propio CSS dentro del iframe/form */
          min-height: 360px;
        }

        .widget-disclaimer {
          font-size: 12px;
          color: #aaa;
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}