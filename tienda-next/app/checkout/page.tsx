"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import { getSnapshotPricing } from "../lib/pricing";
import CheckoutForm from "./Checkoutform";

export default function CheckoutPage() {
  const { carrito, loading: contextLoading, cartReady } = useUser();
  const router = useRouter();
  const hasCheckedRedirect = useRef(false);

  const items = Array.isArray(carrito) ? carrito : [];
  const total = items.reduce((sum, item: any) => {
    const { finalPrice } = getSnapshotPricing(item);
    console.log("🛒 Checkout item:", item, "finalPrice:", finalPrice);
    return sum + finalPrice * Number(item?.cantidad || 1);
  }, 0);

  console.log('🛒 CheckoutPage state:', { contextLoading, cartReady, itemsLength: items.length, total, hasCheckedRedirect: hasCheckedRedirect.current });

  // Show loading if cart isn't ready yet
  const loading = !cartReady || (contextLoading && items.length === 0);

  // Sólo redirigir al carrito si cartReady es true Y items.length es 0
  useEffect(() => {
    console.log('🔄 Checkout redirect check:', { cartReady, itemsLength: items.length, hasCheckedRedirect: hasCheckedRedirect.current });
    
    if (!cartReady || hasCheckedRedirect.current) {
      console.log('🔄 Skipping redirect check (not ready or already checked');
      return;
    }

    hasCheckedRedirect.current = true;
    console.log('🔄 Performing final redirect check:', { cartReady, itemsLength: items.length });
    if (items.length === 0) {
      console.log('🔄 Redirecting to cart because cart is empty');
      router.replace("/cart");
    }
  }, [cartReady, items.length, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  if (items.length === 0) return null;

  return (
    <main className="checkout-page">
      <div className="checkout-header">
        <a href="/cart" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Volver al carrito
        </a>
        <div className="logo-checkout">
          <span className="logo-text">MARCA</span>
          <span className="logo-accent">ESTILO</span>
        </div>
      </div>

      <CheckoutForm items={items} total={total} />

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background-color: #080808;
          color: #f0ece0;
          font-family: 'Outfit', sans-serif;
        }

        .checkout-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          border-bottom: 1px solid rgba(220, 180, 50, 0.15);
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #dcb432;
        }

        .logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 4px;
          color: #f0ece0;
        }

        .logo-accent {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 4px;
          color: #dcb432;
        }

        @media (max-width: 640px) {
          .checkout-header {
            padding: 16px 20px;
          }
        }
      `}</style>
    </main>
  );
}
