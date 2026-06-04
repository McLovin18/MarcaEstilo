"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get("pedidoId");
  const status = searchParams.get("status");
  const [pedido, setPedido] = useState<any | null>(null);
  const [cargando, setCargando] = useState(true);
  const { clearCarrito } = useUser();

  useEffect(() => {
    if (!pedidoId) { router.replace("/"); return; }
    fetch(`/api/ordenes/${pedidoId}`)
      .then(res => res.json())
      .then(p => {
        setPedido(p);
        if (status === "success") {
          clearCarrito();
        }
      })
      .finally(() => setCargando(false));
  }, [pedidoId, router, status, clearCarrito]);

  return (
    <main className="success-page">
      <div className="success-card">
        {cargando ? (
          <div className="loading-wrap">
            <div className="loading-ring" />
          </div>
        ) : (
          <>
            {status === "success" ? (
              <div className="check-circle">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div className="check-circle" style={{ background: "#ef4444", boxShadow: "0 0 40px rgba(239,68,68,0.35)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            )}

            <h1 className="success-title">
              {status === "success" ? "¡Pago exitoso!" : status === "pending" ? "Pago pendiente" : "Pago fallido"}
            </h1>
            <p className="success-sub">
              {status === "success" ? (
                <>Tu pedido <strong className="pedido-ref">{pedidoId}</strong> ha sido confirmado.</>
              ) : status === "pending" ? (
                <>Tu pedido <strong className="pedido-ref">{pedidoId}</strong> está pendiente de pago.</>
              ) : (
                <>Hubo un problema con el pago de tu pedido <strong className="pedido-ref">{pedidoId}</strong>.</>
              )}
            </p>

            {pedido && (
              <div className="pedido-resumen">
                <p className="resumen-row">
                  <span>Cliente</span>
                  <span>{pedido.cliente?.nombre || pedido.userName || "Cliente"}</span>
                </p>
                <p className="resumen-row">
                  <span>Correo</span>
                  <span>{pedido.cliente?.email || pedido.guestEmail || pedido.userEmail || "No disponible"}</span>
                </p>
                <p className="resumen-row">
                  <span>Total</span>
                  <span className="resumen-total">${(pedido.total || 0).toFixed(2)}</span>
                </p>
                <p className="resumen-row">
                  <span>Estado</span>
                  <span className="badge-estado" style={status !== "success" ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" } : undefined}>{pedido.estadoPedido || pedido.estado || "Desconocido"}</span>
                </p>
              </div>
            )}

            <p className="info-envio">
              {status === "success" 
                ? "Te enviaremos los detalles de tu pedido al correo registrado. Puedes contactarnos por WhatsApp si tienes alguna consulta." 
                : "Por favor, intenta nuevamente o contacta con nosotros si el problema persiste."
              }
            </p>

            <button className="btn-home" onClick={() => router.push("/")}>
              Volver a la tienda
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: #080808;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Outfit', sans-serif;
          color: #f0ece0;
        }

        .success-card {
          background: #0e0e0e;
          border: 1px solid #1e1e1e;
          border-radius: 20px;
          padding: 48px 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .loading-wrap {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }
        .loading-ring {
          width: 40px;
          height: 40px;
          border: 3px solid #1e1e1e;
          border-top-color: #dcb432;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .check-circle {
          width: 80px;
          height: 80px;
          background: #dcb432;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 0 40px rgba(220, 180, 50, 0.35);
        }

        .success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          letter-spacing: 4px;
          color: #f0ece0;
          margin: 0 0 8px;
        }

        .success-sub {
          color: #888;
          font-size: 16px;
          margin: 0 0 28px;
        }
        .pedido-ref { color: #dcb432; }

        .pedido-resumen {
          background: #141414;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }
        .resumen-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #1e1e1e;
          font-size: 14px;
          margin: 0;
        }
        .resumen-row:last-child { border-bottom: none; }
        .resumen-row span:first-child { color: #666; }
        .resumen-total { color: #dcb432; font-weight: 600; font-size: 16px; }
        .badge-estado {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.25);
          padding: 2px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
        }

        .info-envio {
          font-size: 13px;
          color: #555;
          line-height: 1.7;
          margin: 0 0 28px;
        }

        .btn-home {
          width: 100%;
          padding: 14px 24px;
          background: #dcb432;
          color: #080808;
          border: none;
          border-radius: 10px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-home:hover {
          background: #e8c43e;
          box-shadow: 0 8px 24px rgba(220, 180, 50, 0.3);
        }

        @media (max-width: 520px) {
          .success-card { padding: 32px 24px; }
          .success-title { font-size: 36px; }
        }
      `}</style>
    </main>
  );
}