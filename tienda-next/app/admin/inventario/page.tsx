"use client";
import React, { useState, useEffect } from "react";
import type { Producto } from "../../lib/productos-db";
import CategoriasAdminPanel from "./CategoriasAdminPanel";
import MarcasAdminPanel from "./MarcasAdminPanel";
import BodegasAdminPanel from "./BodegasAdminPanel";
import ProductoFormModal from "./ProductoFormModal";
import ProductoCard from "../../components/ProductoCard";
import {
  crearProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto
} from "../../lib/productos-db";
import { crearBodegaDefault } from "../../lib/bodegas-db";

type FiltroStock = "todos" | "con-stock" | "poco-stock" | "sin-stock";

export default function AdminInventario() {

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("newest");
  const [vista, setVista] = useState("productos");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");

  // 📊 Resumen de inventario
  const resumen = React.useMemo(() => {
    const total = productos.length;
    let conStock = 0, pocoStock = 0, sinStock = 0;

    productos.forEach(p => {
      if (typeof p.stock === "number") {
        if (p.stock === 0) sinStock++;
        else if (p.stock <= 5) pocoStock++;
        else conStock++;
      }
    });

    return { total, conStock, pocoStock, sinStock };
  }, [productos]);

  // 🔄 Cargar productos
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const prods = await obtenerProductos({ incluirSinStock: true });
      setProductos(prods);
      setLoading(false);
    }
    
    // Crear bodega default si no existe
    crearBodegaDefault().catch(err => console.error("Error creando bodega default:", err));
    
    fetchProductos();
  }, []);

  const productosFiltrados = productos
    .filter((p) => {
      const texto = search.trim().toLowerCase();
      const nombre = p.nombre?.toLowerCase() || "";
      const desc = p.descripcion?.toLowerCase() || "";
      if (texto && !nombre.includes(texto) && !desc.includes(texto)) return false;
      if (filtroStock === "sin-stock") return p.stock === 0;
      if (filtroStock === "poco-stock") return typeof p.stock === "number" && p.stock > 0 && p.stock <= 5;
      if (filtroStock === "con-stock") return typeof p.stock === "number" && p.stock > 5;
      return true;
    })
    .sort((a, b) => {
      if (orden === "price-low") return a.precio - b.precio;
      if (orden === "price-high") return b.precio - a.precio;
      // Por defecto: ordenar por más nuevos (createdAt descendente)
      const aCreated = a.createdAt || 0;
      const bCreated = b.createdAt || 0;
      return bCreated - aCreated;
    });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 w-full py-6 sm:py-15 px-4 pt-4 pb-24">

        {/* NAV ADMIN */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "productos"
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-purple-700 border-purple-700"
            }`}
            onClick={() => setVista("productos")}
          >
            Productos
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "marcas"
                ? "bg-green-700 text-white border-green-700"
                : "bg-white text-green-700 border-green-700"
            }`}
            onClick={() => setVista("marcas")}
          >
            Marcas
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "categorias"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-blue-700 border-blue-700"
            }`}
            onClick={() => setVista("categorias")}
          >
            Categorías
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "bodegas"
                ? "bg-red-700 text-white border-red-700"
                : "bg-white text-red-700 border-red-700"
            }`}
            onClick={() => setVista("bodegas")}
          >
            Bodegas
          </button>
        </div>

        {/* ================== VISTA PRODUCTOS ================== */}
        {vista === "productos" && (
          <>
            {/* RESUMEN */}
            <div className="flex gap-8 items-center mb-4 text-base text-slate-700 dark:text-slate-200">
              <div>Total: <b>{resumen.total}</b></div>
              <div>Stock: <b>{resumen.conStock}</b></div>
              <div>Poco: <b>{resumen.pocoStock}</b></div>
              <div>Sin stock: <b>{resumen.sinStock}</b></div>
            </div>

            {/* FILTRO STOCK */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFiltroStock("todos")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "todos"
                    ? "bg-slate-700 text-white border-slate-700"
                    : "bg-white text-slate-700 border-slate-400 hover:bg-slate-100"
                }`}
              >
                Todos ({resumen.total})
              </button>
              <button
                onClick={() => setFiltroStock("con-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "con-stock"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-green-700 border-green-500 hover:bg-green-50"
                }`}
              >
                Con stock ({resumen.conStock})
              </button>
              <button
                onClick={() => setFiltroStock("poco-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "poco-stock"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-700 border-amber-500 hover:bg-amber-50"
                }`}
              >
                Poco stock ({resumen.pocoStock})
              </button>
              <button
                onClick={() => setFiltroStock("sin-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "sin-stock"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-red-700 border-red-500 hover:bg-red-50"
                }`}
              >
                Sin stock ({resumen.sinStock})
              </button>
            </div>

            {/* BOTONES */}
            <div className="flex gap-2 mb-4">
              <button
                className="flex-1 border border-slate-400 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-100 transition"
                onClick={() => setShowForm(v => !v)}
              >
                {showForm ? "Cerrar formulario" : "Crear producto"}
              </button>

              <button
                className="flex-1 border border-slate-400 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-100 transition"
                onClick={async () => {
                  setLoading(true);
                  const prods = await obtenerProductos({ incluirSinStock: true });
                  setProductos(prods);
                  setLoading(false);
                }}
              >
                Recargar inventario
              </button>
            </div>

            {/* BUSQUEDA + ORDEN */}
            <div className="flex flex-col gap-3 mb-6">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="px-4 py-2 rounded-lg border w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <select
                className="px-4 py-2 rounded-lg border w-full"
                value={orden}
                onChange={e => setOrden(e.target.value)}
              >
                <option value="newest">Más Nuevos</option>
                <option value="price-low">Menor Precio</option>
                <option value="price-high">Mayor Precio</option>
              </select>
            </div>

            {/* MODAL */}
            <ProductoFormModal
              show={showForm}
              initialData={editData}
              onClose={() => {
                setShowForm(false);
                setEditData(null);
              }}
              onSave={async (data) => {
                if (editData) {
                  await actualizarProducto(editData.id, data);
                } else {
                  await crearProducto({ ...data, destacado: false });
                }
                const prods = await obtenerProductos({ incluirSinStock: true });
                setProductos(prods);
                setShowForm(false);
                setEditData(null);
              }}
            />

            {/* TABLA */}
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="max-h-[55vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left">Nombre</th>
                      <th className="px-3 py-3 text-left">Stock</th>
                      <th className="px-3 py-3 text-left">Precio</th>
                      <th className="px-3 py-3 text-center">Destacado</th>
                      <th className="px-3 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6">
                          Cargando productos...
                        </td>
                      </tr>
                    ) : productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6">
                          No hay productos
                        </td>
                      </tr>
                    ) : (
                      productosFiltrados.map(p => (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-3">{p.nombre}</td>
                          <td className="px-3 py-3 font-bold">{p.stock}</td>
                          <td className="px-3 py-3">${p.precio}</td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.destacado}
                              onChange={async (e) => {
                                setLoading(true);
                                await actualizarProducto(p.id, { destacado: e.target.checked });
                                const prods = await obtenerProductos({ incluirSinStock: true });
                                setProductos(prods);
                                setLoading(false);
                              }}
                              title="Marcar como destacado"
                            />
                          </td>
                          <td className="px-3 py-3 flex flex-col gap-2">
                            <button
                              className="bg-blue-600 text-white px-3 py-1 rounded"
                              onClick={() => {
                                setEditData(p);
                                setShowForm(true);
                              }}
                            >
                              Editar
                            </button>

                            <button
                              className="bg-red-600 text-white px-3 py-1 rounded"
                              onClick={async () => {
                                if (window.confirm("¿Eliminar producto?")) {
                                  await eliminarProducto(p.id);
                                  const prods = await obtenerProductos({ incluirSinStock: true });
                                  setProductos(prods);
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ================== OTRAS VISTAS ================== */}
        {vista === "marcas" && <MarcasAdminPanel />}
        {vista === "categorias" && <CategoriasAdminPanel />}
        {vista === "bodegas" && <BodegasAdminPanel />}

      </div>
    </div>
  );
}
