"use client";

import React, { useState, useEffect } from "react";
import { obtenerBodegas } from "../lib/bodegas-db";
import { useRouter } from "next/navigation";
import { getSnapshotPricing } from "../lib/pricing";
import { useUser } from "../context/UserContext";
import BottomBarPublic from "../components/BottomBarPublic";
import { obtenerAtributos } from "../lib/atributos-db";

function resolveCartItemKey(item: any) {
  if (!item) return "";
  return item.cartKey || item.variantKey || item.id;
}

function resolveAvailableStock(item: any) {
  if (!item) return 0;

  // Soportar variaciones dinámicas (nuevo sistema)
  if (item.selectedVariations && item.variationAttributeIds && Array.isArray(item.stockVariants)) {
    const allSelected = item.variationAttributeIds.every((attrId: string) => item.selectedVariations[attrId]);
    if (allSelected) {
      const variant = item.stockVariants.find((v: any) => {
        return item.variationAttributeIds.every(
          (attrId: string) => v.attributes?.[attrId] === item.selectedVariations[attrId]
        );
      });
      if (variant) {
        return Number(variant.cantidad ?? 0);
      }
    }
  }

  // Soportar variaciones legacy (talla/color)
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

// --- Componente: Vista de Proforma
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
          <div className="bg-linear-to-r from-[#3a1859] to-[#6d28d9] px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">Marca Estilo</h1>
              <p className="text-purple-200 text-sm mt-1">Proforma de Orden</p>
            </div>
            <div className="text-right">
              <p className="text-[#f5d890] text-xs">Numero de orden</p>
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
              <table className="w-full text-sm min-w-150">
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
                    const basePrice = Number(p.precioBase || p.precio || 0);
                    const discount = Number(p.descuento || 0);
                    const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
                    const fakeOldPrice = hasDiscount ? basePrice : null;
                    const finalPrice = hasDiscount ? Math.round(basePrice * (1 - discount / 100) * 100) / 100 : basePrice;
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
                            <span className="text-slate-900 dark:text-white font-semibold">
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

// --- Pagina principal del carrito
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
  const router = useRouter();
  const { isLogged } = useUser();
  const [atributos, setAtributos] = useState<any[]>([]);

  const calcularPrecioData = (p: any) => {
    const { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice } = getSnapshotPricing(p);
    return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
  };

  useEffect(() => {
  async function loadAtributos() {
    const data = await obtenerAtributos();
    setAtributos(data);
  }

  loadAtributos();
}, []);


  const handleVerProforma = async () => {
    setError("");
    if (!visitDate || !visitTime) {
      setError("Selecciona el día y la hora aproximada en que irás al local.");
      return;
    }
    if (!email || email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido para recibir la proforma.");
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
      const res = await fetch("/api/ordenes/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: null,
          email: email.trim(),
          productos: carrito.map((p) => ({
            id: p.id,
            cantidad: p.cantidad,
            cartKey: p.cartKey || p.id,
            selectedTalla: p.selectedTalla,
            selectedColor: p.selectedColor,
            selectedVariations: p.selectedVariations,
            variationAttributeIds: p.variationAttributeIds,
          })),
          visitDate,
          visitTime,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al generar la orden");
      }

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

  const subtotal = carrito.reduce((sum, p) => {
    const { finalPrice } = calcularPrecioData(p);
    return sum + finalPrice * (p.cantidad || 1);
  }, 0);
  
  const costoEnvio = 5;
  const total = subtotal + costoEnvio;

  const generateWhatsAppMessage = async (): Promise<string> => {
    const bodegas = await obtenerBodegas();
    const bodegasMap = new Map(bodegas.map(b => [b.id, b.tiempoEntrega]));

    const productosText = carrito
      .map((p) => {
        const tiempoEntrega = bodegasMap.get(p.bodegaId || "technothings") || 72;
        return `${p.nombre} (Entrega Aproximada en: ${tiempoEntrega}h)`;
      })
      .join("\n");
    
    const headerMsg = "Hola, Me gustaría realizar una compra:";
    const footerMsg = "Quiero confirmar disponibilidad y conocer más detalles. Gracias!";
    
    // Para WhatsApp, solo incluir subtotal + envío
    const totalWhatsApp = subtotal + costoEnvio;
    
    const message = `${headerMsg}\n\n${productosText}\n\n???????????????\nTOTAL: $${totalWhatsApp.toFixed(2)}\n???????????????\n\n${footerMsg}`;
    return encodeURIComponent(message);
  };

  const handleGenerarOrden = async () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "0962873167";
    const message = await generateWhatsAppMessage();
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handlePagarAhora = () => {
    setError("");
    router.push("/checkout");
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
        className="mt-2 inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-900 hover:border-black/60 hover:shadow-md font-semibold px-6 py-2.5 rounded-xl transition-colors shadow"
      >
        <span className="material-icons-round text-base">storefront</span>
        Ver productos
      </a>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors">
        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
              Carrito
            </h1>
            {carrito.length > 0 && (
              <span className="bg-white border border-slate-300 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full">
                {carrito.length} {carrito.length === 1 ? "producto" : "productos"}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <span className="material-icons-round text-base mt-0.5 shrink-0">error_outline</span>
              {error}
            </div>
          )}

          {carrito.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        <img
                          src={p.imagenes?.[0] || "/no-image.png"}
                          alt={p.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                          {p.nombre}
                        </p>
                        {p.selectedTalla && p.selectedColor && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Talla {p.selectedTalla} · Color {p.selectedColor}
                          </p>
                        )}
                        {p.selectedVariations && p.variationAttributeIds && p.variationAttributeIds.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.variationAttributeIds.map((attrId: string) => {
                              const atributo = atributos.find((a: any) => a.id === attrId);
                              const attrName = atributo?.nombre || "Opción";
                              const value = p.selectedVariations?.[attrId];
                              return value
                                ? `${attrName}: ${value}`
                                : null;
                            }).filter(Boolean).join(" · ")}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              ${fakeOldPrice?.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            ${finalPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                              -{discount}%
                            </span>
                          )}
                        </div>

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

                      <div className="flex flex-col items-end justify-between h-full gap-3 shrink-0">
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

                <a
                  href="/products-by-category"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-900 dark:text-white hover:underline mt-1"
                >
                  <span className="material-icons-round text-base">arrow_back</span>
                  Continuar comprando
                </a>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-[#1e0a3c] rounded-2xl border border-slate-100 dark:border-rgba(224, 161, 26, 0.1) shadow-md p-5 md:sticky md:top-20 space-y-4">
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
                        <span className="text-slate-900 dark:text-white font-medium">
                          ${costoEnvio.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Recargo del 7% (solo aplica pago con tarjetas)
                      </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-rgba(224, 161, 26, 0.1) mt-3 pt-3 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-slate-900 dark:text-white">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <a
                      href="/politicas/politicasEnvio"
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-[#E0A11A] hover:underline mt-2"
                    >
                      Ver políticas de envío
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Contacto rápido
                    </p>
                    <button
                      onClick={handleGenerarOrden}
                      className="w-full flex items-center text-center justify-center gap-2 py-3.5 px-6 bg-white border border-slate-300 text-slate-900 hover:border-black/60 hover:shadow-md font-bold text-sm rounded-xl transition-colors shadow-md"
                      title="Enviar pedido por WhatsApp"
                    >
                      Generar orden
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                      Te enviaremos el resumen del pedido por WhatsApp
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={handlePagarAhora}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-sm rounded-xl transition-colors shadow-md border bg-[#E0A11A] border-[#c88c0a] text-white hover:bg-[#c88c0a] hover:shadow-lg"
                      title="Pagar ahora"
                    >
                      Pagar ahora
                    </button>
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
