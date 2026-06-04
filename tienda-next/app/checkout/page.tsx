"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import { getSnapshotPricing } from "../lib/pricing";
import CheckoutForm from "./Checkoutform";

export default function CheckoutPage() {
  const { carrito } = useUser();
  const router = useRouter();

  const items = Array.isArray(carrito) ? carrito : [];
  const total = items.reduce((sum, item: any) => {
    const { finalPrice } = getSnapshotPricing(item);
    console.log("🛒 Checkout item:", item, "finalPrice:", finalPrice);
    return sum + finalPrice * Number(item?.cantidad || 1);
  }, 0);
  console.log("🛒 Checkout total:", total);

  // Si el carrito está vacío, redirigir al carrito
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items, router]);

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
