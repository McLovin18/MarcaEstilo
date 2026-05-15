"use client";


import React, { useState, useCallback, useEffect } from "react";
import { Loading3DIcon } from "../components/Loading3DIcon";
import { obtenerBodegas } from "../lib/bodegas-db";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "../context/UserContext";
import BottomBarPublic from "../components/BottomBarPublic";

import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// --- Stripe promise (singleton fuera del componente) -------------------------
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function resolveCartItemKey(item: any) {
  if (!item) return "";
  return item.cartKey || item.variantKey || item.id;
}

function resolveAvailableStock(item: any) {
  if (!item) return 0;

  if (item.selectedTalla && item.selectedColor && Array.isArray(item.stockVariants)) {
    const variant = item.stockVariants.find(
      (v: any) => v.talla === item.selectedTalla && v.color === item.selectedColor
    );
    const variantStock = Number(variant?.cantidad ?? variant?.stock ?? variant?.variantStock ?? 0);
    if (variantStock > 0 || variantStock === 0) {
      return variantStock;
    }
  }

  return Number(item.variantStock ?? item.stock ?? 0);
}

// --- Componente: Formulario de pago Stripe ------------------------------------
function StripeInnerForm({
  orderId,
  total,
  onError,
  onSuccess,
}: {
  orderId: string;
  total: number;
  onError: (msg: string) => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}&paid=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Error al procesar el pago.");
      setPaying(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full py-4 rounded-2xl font-extrabold text-lg text-white
          bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#a855f7]
          hover:from-[#5b21b6] hover:via-[#6d28d9] hover:to-[#9333ea]
          active:scale-[0.98] shadow-xl shadow-purple-500/30
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagar ${total.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}

// --- Componente: Modal de pago Stripe -----------------------------------------
function StripePaymentModal({
  clientSecret,
  orderId,
  total,
  email,
  productos,
  onClose,
  onSuccess,
}: {
  clientSecret: string;
  orderId: string;
  total: number;
  email: string;
  productos: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stripeError, setStripeError] = useState("");

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const appearance: any = {
    theme: isDark ? "night" : "stripe",
    variables: {
      colorPrimary: "#7c3aed",
      colorBackground: isDark ? "#1e1b4b" : "#ffffff",
      colorText: isDark ? "#f1f5f9" : "#1e293b",
      colorDanger: "#ef4444",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "12px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: "1.5px solid #c4b5fd", padding: "10px 14px" },
      ".Input:focus": { border: "1.5px solid #7c3aed", boxShadow: "0 0 0 3px rgba(124,58,237,0.15)" },
      ".Tab": { border: "1.5px solid #ede9fe" },
      ".Tab--selected": { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124,58,237,0.2)" },
    },
  };

  const options = { clientSecret, appearance };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#0f0a23] border border-#FFF8E8 dark:border-purple-900">
        {/* Header degradado */}
        <div className="bg-gradient-to-r from-[#3a1859] via-[#5b21b6] to-[#7c3aed] px-6 pt-6 pb-5 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
                  Pago seguro
                </span>
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-extrabold tracking-tight">Completa tu compra</h2>
              <p className="text-purple-200 text-sm mt-0.5">
                Marca Estilo Orden <span className="font-bold text-white">{orderId}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition rounded-full p-1 hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mini resumen de productos */}
          <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 space-y-1.5">
            {productos.slice(0, 3).map((p, i) => {
            const basePrice = Number(p.precioBase || p.precio || 0);
            const discount = Number(p.descuento || 0);
            const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
            const fakeOldPrice = hasDiscount
              ? (Math.round((basePrice / (1 - discount / 100)) * 100) / 100).toFixed(2)
              : null;
            const finalPrice = basePrice;
            const cant = Number(p.cantidad || 1);
            return (
              <div key={i} className="flex justify-between text-sm text-white/90 items-center">
                <span className="truncate mr-2">{p.nombre} <span className="opacity-60">x{cant}</span></span>
                <span className="font-semibold shrink-0 flex items-center gap-2">
                  {hasDiscount && (
                    <span className="text-xs line-through text-slate-400">${fakeOldPrice}</span>
                  )}
                  <span className="text-white font-bold">${finalPrice.toFixed(2)}</span>
                  {hasDiscount && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">-{discount}%</span>
                  )}
                </span>
              </div>
            );
            })}
            {productos.length > 3 && (
              <p className="text-xs text-purple-200">+{productos.length - 3} producto(s) mas...</p>
            )}
            <div className="border-t border-white/20 pt-1.5 mt-1.5 flex justify-between font-extrabold text-white text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cuerpo con Stripe */}
        <div className="px-6 py-5">
          {/* Metodos aceptados */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">Acepta:</span>
            {["VISA", "Mastercard", "AMEX", "Link", "Google Pay", "Apple Pay"].map((m) => (
              <span
                key={m}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
              >
                {m}
              </span>
            ))}
          </div>

          {stripeError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300">
              {stripeError}
            </div>
          )}

          <Elements stripe={stripePromise} options={options}>
            <StripeInnerForm
              orderId={orderId}
              total={total}
              onError={setStripeError}
              onSuccess={onSuccess}
            />
          </Elements>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Procesado de forma segura con Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Componente: Vista de Proforma --------------------------------------------
function ProformaView({
  orden,
  email,
  onConfirm,
  onBack,
  loading,
}: {
  orden: any;
  email: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#3a1859] text-slate-900 dark:text-white transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-2xl overflow-hidden shadow-xl mb-6">
          <div className="bg-gradient-to-r from-[#3a1859] to-[#6d28d9] px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">Marca Estilo</h1>
              <p className="text-purple-200 text-sm mt-1">Proforma de Orden</p>
            </div>
            <div className="text-right">
              <p className="text-#f5d890 text-xs">Numero de orden</p>
              <p className="text-white text-xl font-bold">{orden.orderId}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 px-8 py-4 flex flex-wrap gap-6 text-sm border-b border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Fecha de visita</span>
              <p className="font-semibold mt-0.5">{orden.visitaFecha}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Hora aproximada</span>
              <p className="font-semibold mt-0.5">{orden.visitaHora}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Correo de envio</span>
              <p className="font-semibold mt-0.5">{email}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 px-8 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 text-slate-500 dark:text-slate-400 font-semibold">Producto</th>
                  <th className="text-center py-2 text-slate-500 dark:text-slate-400 font-semibold">Cant.</th>
                  <th className="text-right py-2 text-slate-500 dark:text-slate-400 font-semibold">Precio unit.</th>
                  <th className="text-right py-2 text-slate-500 dark:text-slate-400 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.productos.map((p: any, i: number) => {
                  // ... dentro de orden.productos.map en ProformaView
                  const basePrice = Number(p.precioBase || p.precio || 0);
                  const discount = Number(p.descuento || 0);
                  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
                  const fakeOldPrice = hasDiscount
                    ? (Math.round((basePrice / (1 - discount / 100)) * 100) / 100)
                    : null;
                  const finalPrice = basePrice;
                  return (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 pr-4 font-medium">{p.nombre}</td>
                      <td className="py-3 text-center">{p.cantidad}</td>
                      <td className="py-3 text-right">
                        {hasDiscount && (
                          <span className="text-xs line-through text-slate-400 mr-1">
                            ${fakeOldPrice?.toFixed(2)}
                          </span>
                        )}
                        <span className="text-#E0A11A dark:text-#f5d890 font-semibold">
                          ${finalPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="ml-1 text-xs text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full">
                            -{discount}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-bold">
                        ${(finalPrice * Number(p.cantidad || 1)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Envio</span>
                <span className="text-green-600 font-semibold">Gratis</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-[#3a1859] dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total</span>
                <span>${Number(orden.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-700 px-8 py-4 text-sm text-yellow-800 dark:text-yellow-200">
            Al confirmar, recibiras esta proforma en tu correo <strong>{email}</strong>. Presenta el numero <strong>{orden.orderId}</strong> al visitar el local.
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Volver al carrito
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg shadow-lg border-2 border-green-700 transition disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Confirmar y enviar al correo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Pagina principal del carrito ---------------------------------------------
export default function CartPage() {
  const { carrito: carritoRaw, removeCarrito, addCarrito, user: userRaw } = useUser();
  const carrito = carritoRaw as any[];
  const user = userRaw as any;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"cart" | "proforma">("cart");
  const [ordenCreada, setOrdenCreada] = useState<any>(null);
  const [payMode, setPayMode] = useState<"order" | "stripe">("order");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string>("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];
  const { isLogged } = useUser();


  // Unify price logic for all calculations (matches ProductoCard, proforma, etc)
  const calcularPrecioData = (p: any) => {
    const basePrice = Number(p.precioBase || p.precio || 0);
    const discount = Number(p.descuento || 0);
    const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
    const fakeOldPrice = hasDiscount
      ? Math.round((basePrice / (1 - discount / 100)) * 100) / 100
      : basePrice;
    const finalPrice = basePrice;
    return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
  };

  const handleVerProforma = async () => {
    setError("");
    if (!visitDate || !visitTime) {
      setError("Selecciona el d�a y la hora aproximada en que ir�s al local.");
      return;
    }
    if (!email || email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electr�nico v�lido para recibir la proforma.");
      return;
    }
    for (const p of carrito) {
      const availableStock = resolveAvailableStock(p);
      if (p.cantidad > availableStock) {
        setError(`Solo hay ${availableStock} unidades disponibles de "${p.nombre}".`);
        return;
      }
    }
    setLoading(true);
    try {
      // ?? Llamar al endpoint API para crear orden con stock deduction at�mico
      const res = await fetch("/api/ordenes/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: null,
          email: email.trim(),
            productos: carrito.map((p) => ({ id: p.id, cantidad: p.cantidad, cartKey: p.cartKey || p.id, selectedTalla: p.selectedTalla, selectedColor: p.selectedColor })),
          visitDate,
          visitTime,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al generar la orden");
      }

      // ? Orden creada exitosamente con stock reservado
      setOrdenCreada(data.orden);
      setStep("proforma");
    } catch (e: any) {
      console.error("Error al generar proforma:", e);
      setError(e.message || "Error al generar la orden. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await fetch("/api/send-proforma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orden: ordenCreada, email: email.trim() }),
      });
      carrito.forEach((p) => removeCarrito(resolveCartItemKey(p)));
      router.push(`/order-confirmation?orderId=${ordenCreada.orderId}`);
    } catch (e) {
      console.error("Error al enviar proforma:", e);
      carrito.forEach((p) => removeCarrito(resolveCartItemKey(p)));
      router.push(`/order-confirmation?orderId=${ordenCreada?.orderId || ""}`);
    }
    setLoading(false);
  };

  const handleIniciarPago = async () => {
    setError("");
    if (!visitDate || !visitTime) {
      setError("Selecciona el día y la hora aproximada en que vendrás a retirar tu pedido.");
      return;
    }
    if (!email || email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo válido para recibir el comprobante de pago.");
      return;
    }
    for (const p of carrito) {
      const availableStock = resolveAvailableStock(p);
      if (p.cantidad > availableStock) {
        setError(`Solo hay ${availableStock} unidades disponibles de "${p.nombre}".`);
        return;
      }
    }
    setStripeLoading(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrito: carrito.map((p) => ({ id: p.id, cantidad: p.cantidad, cartKey: p.cartKey || p.id, selectedTalla: p.selectedTalla, selectedColor: p.selectedColor })),
          email: email.trim(),
          visitDate: visitDate || null,
          visitTime: visitTime || null,
          userId: user?.uid || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago");
      setStripeClientSecret(data.clientSecret);
      setStripeOrderId(data.orderId);
    } catch (e: any) {
      setError(e.message || "No se pudo iniciar el pago. Intenta de nuevo.");
    }
    setStripeLoading(false);
  };

  const handleStripeSuccess = useCallback(() => {
    carrito.forEach((p) => removeCarrito(resolveCartItemKey(p)));
    router.push(`/order-confirmation?orderId=${stripeOrderId}&paid=true`);
  }, [carrito, removeCarrito, router, stripeOrderId]);

  const subtotal = carrito.reduce((sum, p) => {
    const { finalPrice } = calcularPrecioData(p);
    return sum + finalPrice * (p.cantidad || 1);
  }, 0);
  const total = subtotal;

  // -- Generar mensaje de WhatsApp para invitados --------------------------------
  const generateWhatsAppMessage = async (): Promise<string> => {
    // Obtener todas las bodegas para mapear bodegaId ? tiempoEntrega
    const bodegas = await obtenerBodegas();
    const bodegasMap = new Map(bodegas.map(b => [b.id, b.tiempoEntrega]));

    // Construir texto de productos con tiempo de entrega
    const productosText = carrito
      .map((p) => {
        const tiempoEntrega = bodegasMap.get(p.bodegaId || "technothings") || 72;
        return `${p.nombre} (Entrega Aproximada en: ${tiempoEntrega}h)`;
      })
      .join("\n");
    
    const headerMsg = "Hola, Me gustaría realizar una compra:";
    const footerMsg = "Quiero confirmar disponibilidad y conocer más detalles. Gracias!";
    
    const message = `${headerMsg}\n\n${productosText}\n\n???????????????\nTOTAL: $${total.toFixed(2)}\n???????????????\n\n${footerMsg}`;
    return encodeURIComponent(message);
  };

  // -- Manejar click en "Generar orden" - enviar a WhatsApp ----------------------
  const handleGenerarOrden = async () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "0962873167";
    const message = await generateWhatsAppMessage();
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    const prod = carrito.find((p) => resolveCartItemKey(p) === id);
    if (prod) {
      const availableStock = resolveAvailableStock(prod);
      if (cantidad > availableStock) {
        setError(
          `Solo hay ${availableStock} unidades disponibles en stock de "${prod.nombre}".`
        );
        return;
      }
      setError("");
      removeCarrito(id);
      addCarrito({ ...prod, cantidad });
    }
  };

  if (step === "proforma" && ordenCreada) {
    return (
      <ProformaView
        orden={ordenCreada}
        email={email}
        onConfirm={handleConfirmar}
        onBack={() => setStep("cart")}
        loading={loading}
      />
    );
  }

  // -- Carrito vac�o -----------------------------------------------------------
  const EmptyCart = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <span className="material-icons-round text-4xl text-slate-400 dark:text-slate-500">
          shopping_bag
        </span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-white">
          Tu carrito está vacío
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Agrega productos para continuar
        </p>
      </div>
      <a
        href="/products-by-category"
        className="mt-2 inline-flex items-center gap-2 bg-[#E0A11A] hover:bg-#c88c0a text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow"
      >
        <span className="material-icons-round text-base">storefront</span>
        Ver productos
      </a>
    </div>
  );

  return (
    <>
      {stripeClientSecret && (
        <StripePaymentModal
          clientSecret={stripeClientSecret}
          orderId={stripeOrderId}
          total={total}
          email={email}
          productos={carrito}
          onClose={() => setStripeClientSecret(null)}
          onSuccess={handleStripeSuccess}
        />
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors">
        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">

          {/* Cabecera */}
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
              Carrito
            </h1>
            {carrito.length > 0 && (
              <span className="bg-#FFF8E8 dark:bg-rgba(224, 161, 26, 0.1) text-[#E0A11A] dark:text-#f5d890 text-xs font-bold px-2.5 py-1 rounded-full">
                {carrito.length} {carrito.length === 1 ? "producto" : "productos"}
              </span>
            )}
          </div>


          {/* Error global */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <span className="material-icons-round text-base mt-0.5 flex-shrink-0">error_outline</span>
              {error}
            </div>
          )}

          {carrito.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* -- Lista de productos ----------------------------------- */}
              <div className="lg:col-span-2 space-y-3">
                {carrito.map((p) => {
                  const itemKey = resolveCartItemKey(p);
                  const { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice } = calcularPrecioData(p);
                  const lineTotal = finalPrice * (p.cantidad || 1);
                  const availableStock = resolveAvailableStock(p);

                  return (
                    <div
                      key={itemKey}
                      className="bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-3 sm:gap-4 items-start"
                    >
                      {/* Imagen */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        <img
                          src={p.imagenes?.[0] || "/no-image.png"}
                          alt={p.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                          {p.nombre}
                        </p>
                        {p.selectedTalla && p.selectedColor && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Talla {p.selectedTalla} · Color {p.selectedColor}
                          </p>
                        )}

                        {/* Precio */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              ${fakeOldPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-bold text-[#E0A11A] dark:text-#f5d890">
                            ${finalPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                              -{discount}%
                            </span>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5">
                            <button
                              onClick={() => handleCantidad(itemKey, (p.cantidad || 1) - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 font-bold text-base"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">
                              {p.cantidad || 1}
                            </span>
                            <button
                              onClick={() => handleCantidad(itemKey, (p.cantidad || 1) + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 font-bold text-base"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-slate-400">
                            {availableStock} en stock
                          </span>
                        </div>
                      </div>

                      {/* Precio total + eliminar */}
                      <div className="flex flex-col items-end justify-between h-full gap-3 flex-shrink-0">
                        <span className="font-bold text-sm sm:text-base">
                          ${lineTotal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeCarrito(itemKey)}
                          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-icons-round text-xl">delete_outline</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Link continuar comprando */}
                <a
                  href="/products-by-category"
                  className="inline-flex items-center gap-1.5 text-sm text-[#E0A11A] dark:text-#e8c862 hover:underline mt-1"
                >
                  <span className="material-icons-round text-base">arrow_back</span>
                  Continuar comprando
                </a>
              </div>

              {/* -- Sidebar resumen -------------------------------------- */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-[#1e0a3c] rounded-2xl border border-slate-100 dark:border-rgba(224, 161, 26, 0.1) shadow-md p-5 md:sticky md:top-20 space-y-4">

                  {/* Resumen de precios */}
                  <div>
                    <p className="text-base font-bold mb-3">Resumen del pedido</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          Subtotal ({carrito.reduce((n, p) => n + (p.cantidad || 1), 0)} items)
                        </span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>Envío</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Gratis
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-rgba(224, 161, 26, 0.1) mt-3 pt-3 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-[#E0A11A] dark:text-#f5d890">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Selector de m�todo de pago */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Contacto rápido
                    </p>
                    <button
                      onClick={handleGenerarOrden}
                      className="w-full flex items-center text-center justify-center gap-2 py-3.5 px-6 bg-#E0A11A hover:bg-[#20BA5C] text-white font-bold text-sm rounded-xl transition-colors shadow-md"
                      title="Enviar pedido por WhatsApp"
                    >
                      Generar orden
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                      Te enviaremos el resumen del pedido por WhatsApp
                    </p>
                  </div>

                  {/* Nota informativa */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">?? Proceso simple:</p>
                    <p>Click en el botón ? WhatsApp abre ? Confirmamos tu pedido y disponibilidad</p>
                  </div>


                </div>
              </div>

            </div>
          )}
        </main>
      </div>
      {!isLogged && <BottomBarPublic />}

    </>
  );
}

