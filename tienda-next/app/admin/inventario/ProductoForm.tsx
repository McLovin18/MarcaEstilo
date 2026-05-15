"use client";
import React, { useState } from "react";
import { uploadImageAndGetUrl } from "../../lib/upload-image";
import { obtenerCategorias } from "../../lib/categorias-db";
import { obtenerProductos } from "../../lib/productos-db";
import { useEffect } from "react";
import { obtenerMarcas } from "../../lib/marcas-db";
import { obtenerBodegas } from "../../lib/bodegas-db";
import CamisetaStockManager from "./CamisetaStockManager";
import type { StockVariant } from "../../lib/productos-db";

// Componente de formulario para crear/modificar productos
type Producto = {
  nombre: string;
  sku?: string;
  stock?: number;
  isCamiseta?: boolean;
  stockVariants?: StockVariant[];
  precio: string;
  descuento?: number;
  categoria: string;
  subcategoria: string;
  subsubcategoria?: string;
  marca?: string;
  imagenes: (string | File)[];
  descripcion: string;
  caracteristicas: string[];
  bodegaId?: string;
};

type ProductoFormProps = {
  initialData?: Producto | null;
  onSave?: (data: Producto) => void;
};

export default function ProductoForm({ initialData = null, onSave, onCancel }: ProductoFormProps) {
    // Estado de carga para el submit
    const [loading, setLoading] = useState(false);
  // Si initialData existe, es edición, si no, es creación
  const isEdit = !!initialData;
  const [nombre, setNombre] = useState<string>(initialData?.nombre || "");
  const [sku, setSku] = useState<string>(initialData?.sku || "");
  const [isCamiseta, setIsCamiseta] = useState<boolean>(initialData?.isCamiseta || false);
  const [stock, setStock] = useState<number>(initialData?.stock || 0);
  const [stockVariants, setStockVariants] = useState<StockVariant[]>(initialData?.stockVariants || []);
  const [precio, setPrecio] = useState<string>(initialData?.precio || "");
  const [descuento, setDescuento] = useState<string>(
    initialData?.descuento !== undefined && initialData?.descuento !== null
      ? String(initialData.descuento)
      : ""
  );
  const [categoria, setCategoria] = useState<string>(initialData?.categoria || "");
  const [subcategoria, setSubcategoria] = useState<string>(initialData?.subcategoria || "");
  const [subsubcategoria, setSubsubcategoria] = useState<string>(initialData?.subsubcategoria || "");
  const [imagenes, setImagenes] = useState<(string | File)[]>(initialData?.imagenes || []);
  const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "");
  const [caracteristicas, setCaracteristicas] = useState<string[]>(initialData?.caracteristicas || [""]);
  const [imagenesInput, setImagenesInput] = useState<File[]>([]);
  const [marca, setMarca] = useState<string>(initialData?.marca || "");
  const [marcas, setMarcas] = useState<{id: string, nombre: string}[]>([]);
  const [bodegaId, setBodegaId] = useState<string>(initialData?.bodegaId || "");
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [categoryPathChanged, setCategoryPathChanged] = useState(false);
  const [draggedImageIdx, setDraggedImageIdx] = useState<number | null>(null);

  useEffect(() => {
    obtenerMarcas().then(setMarcas);
    obtenerBodegas().then(setBodegas);
  }, []);
  //


  // Categorías dinámicas desde Firestore
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);
  useEffect(() => {
    obtenerCategorias().then(setCategoriasDb);
  }, []);

  // Selectores dependientes dinámicos
  const categorias = categoriasDb.map((cat: any) => ({
    value: cat.id,
    label: cat.nombre,
    subcategorias: cat.subcategorias || []
  }));
  const subcategoriasOptions = categorias.find(c => c.value === categoria)?.subcategorias || [];
  const subcategoriaRequired = subcategoriasOptions.length > 0;
  const subsubcategoriasOptions = subcategoriasOptions.find(s => s.id === subcategoria)?.subcategorias || [];
  const subsubcategoriaRequired = subsubcategoriasOptions.length > 0;

  // Manejo de imágenes (por URL o archivo)
  function handleAddImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImagenes([...imagenes, ...files]); // Guardar File directamente
    setImagenesInput([]); // limpiar input
  }
  function handleAddImagenUrl() {
    setImagenes([...imagenes, ""]);
  }
  function handleImagenUrlChange(idx: number, val: string) {
    setImagenes(imagenes.map((img, i) => i === idx ? val : img));
  }
  function handleRemoveImagen(idx: number) {
    setImagenes(imagenes.filter((_, i) => i !== idx));
  }

  // ── Manejo de drag & drop para reordenar imágenes ──
  function handleImagenDragStart(idx: number) {
    setDraggedImageIdx(idx);
  }

  function handleImagenDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleImagenDrop(dropIdx: number) {
    if (draggedImageIdx === null || draggedImageIdx === dropIdx) {
      setDraggedImageIdx(null);
      return;
    }
    const newImagenes = [...imagenes];
    const [draggedImg] = newImagenes.splice(draggedImageIdx, 1);
    newImagenes.splice(dropIdx, 0, draggedImg);
    setImagenes(newImagenes);
    setDraggedImageIdx(null);
  }

  // Manejo de características
  function handleCaracteristicaChange(idx: number, val: string) {
    setCaracteristicas(caracteristicas.map((c, i) => i === idx ? val : c));
  }
  function handleAddCaracteristica() {
    setCaracteristicas([...caracteristicas, ""]);
  }
  function handleRemoveCaracteristica(idx: number) {
    setCaracteristicas(caracteristicas.filter((_, i) => i !== idx));
  }

  // Selectores dependientes
  const subcategorias = categorias.find(c => c.value === categoria)?.subcategorias || [];
  const subsubcategorias = subcategorias.find(s => s.value === subcategoria)?.subsubcategorias || [];

  // Generación automática de SKU basada en la última categoría seleccionada
  const generateAutomaticSku = async (): Promise<string | undefined> => {
    try {
      const todos = await obtenerProductos();

      // Determinar el id de la última categoría seleccionada
      const finalCategoriaId = subsubcategoria || subcategoria || categoria;
      if (!finalCategoriaId) return undefined;

      // Determinar el nombre legible de esa última categoría
      let finalCategoriaNombre = "GEN";
      if (subsubcategoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        const subcat = catRoot?.subcategorias?.find((s: any) => s.id === subcategoria);
        const subsub = subcat?.subcategorias?.find((ss: any) => ss.id === subsubcategoria);
        finalCategoriaNombre = subsub?.nombre || subcat?.nombre || catRoot?.nombre || "GEN";
      } else if (subcategoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        const subcat = catRoot?.subcategorias?.find((s: any) => s.id === subcategoria);
        finalCategoriaNombre = subcat?.nombre || catRoot?.nombre || "GEN";
      } else if (categoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        finalCategoriaNombre = catRoot?.nombre || "GEN";
      }

      // Prefijo: primeros caracteres limpios del nombre de categoría final
      const prefixBase = finalCategoriaNombre
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 3) || "GEN";

      // Productos de la misma categoría final (usando última categoría no vacía)
      const mismosCategoria = todos.filter((p: any) => {
        const pFinalId = p.subsubcategoria || p.subcategoria || p.categoria;
        return pFinalId === finalCategoriaId;
      });

      // Buscar el mayor correlativo usado en SKUs de esta categoría
      let maxSeq = 0;
      for (const p of mismosCategoria) {
        if (typeof p.sku === "string") {
          const m = p.sku.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxSeq) maxSeq = n;
          }
        }
      }

      // Probar siguiente secuencia hasta encontrar uno libre globalmente
      let nextSeq = maxSeq + 1;
      let candidateSku = "";
      // Pequeño límite de seguridad para evitar bucles infinitos
      for (let i = 0; i < 1000; i++) {
        const num = String(nextSeq).padStart(3, "0");
        candidateSku = `${prefixBase}-${num}`;
        const existe = todos.some((p: any) => p.sku === candidateSku);
        if (!existe) break;
        nextSeq++;
      }

      return candidateSku;
    } catch (err) {
      console.error("Error generando SKU automático", err);
      return undefined;
    }
  };

  // Cuando se selecciona categoría/subcategoría, generar SKU si es creación y aún no hay uno
  useEffect(() => {
    // Esperar siempre al último nivel disponible:
    // - Si hay subcategorías y aún no se eligió una, no generar.
    // - Si hay subsubcategorías y aún no se eligió una, tampoco generar.
    const hasSubcats = subcategoriasOptions.length > 0;
    const hasSubsubcats = subsubcategoriasOptions.length > 0;

    if (!categoria) return;
    if (hasSubcats && !subcategoria) return;
    if (hasSubsubcats && !subsubcategoria) return;

    // En edición, solo actualizar si el admin cambió el path de categoría
    if (isEdit && !categoryPathChanged) return;

    generateAutomaticSku().then((nuevo) => {
      if (nuevo) setSku(nuevo);
    });
  }, [
    categoria,
    subcategoria,
    subsubcategoria,
    subcategoriasOptions.length,
    subsubcategoriasOptions.length,
    isEdit,
    categoryPathChanged,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // Previene doble submit
    setLoading(true);
    try {
      // Procesar imágenes: subir archivos a Storage y dejar URLs directas
      const imagenesProcesadas = await Promise.all(imagenes.map(async (img: string | File, idx: number) => {
        if (typeof img === "string") {
          // Si es URL (http/https), dejarla igual
          if (img.startsWith("http")) return img;
          // Si es blob, ignorar (no debería ocurrir)
          return null;
        } else if (img instanceof File) {
          // Subir archivo a Storage
          const ext = img.name.split('.').pop();
          const nombreArchivo = `${nombre.replace(/\s+/g, "_")}_${Date.now()}_${idx}.${ext}`;
          const path = `productos/${nombreArchivo}`;
          try {
            const url = await uploadImageAndGetUrl(img, path);
            return url;
          } catch (err: any) {
            alert("Error subiendo imagen: " + (err?.message || err));
            return null;
          }
        }
        return null;
      }));
      // Filtrar nulos/blobs
      const imagenesFinal = imagenesProcesadas.filter((x): x is string => Boolean(x));
      // Generar SKU automático para nuevas creaciones (no sobrescribir en edición)
      let finalSku = sku?.trim();
      if (!isEdit && !finalSku) {
        const generado = await generateAutomaticSku();
        if (generado) {
          finalSku = generado;
        }
      }

      if (finalSku) {
        setSku(finalSku);
      }

      onSave && onSave({
        nombre,
        sku: finalSku,
        stock: isCamiseta ? undefined : stock,
        isCamiseta,
        stockVariants: isCamiseta ? stockVariants : undefined,
        precio,
        descuento: descuento !== "" ? Number(descuento) : undefined,
        categoria,
        subcategoria: subcategoriaRequired ? subcategoria : "",
        subsubcategoria: subsubcategoriaRequired ? subsubcategoria : "",
        marca,
        bodegaId,
        imagenes: imagenesFinal,
        descripcion,
        caracteristicas
      });

      // Resetear campos solo si es creación (no edición)
      if (!isEdit) {
        setNombre("");
        setSku("");
        setStock(0);
        setIsCamiseta(false);
        setStockVariants([]);
        setPrecio("");
        setDescuento("");
        setCategoria("");
        setSubcategoria("");
        setSubsubcategoria("");
        setMarca("");
        setBodegaId("");
        setImagenes([]);
        setDescripcion("");
        setCaracteristicas([""]);
        setCategoryPathChanged(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
      {/* errorMsg UI removido */}
      {/* Columna izquierda: datos principales */}
      <div className="flex flex-col gap-5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl p-5 border border-purple-200 dark:border-purple-900">
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-700 inline-block"></span> Nombre</span>
          <input className="input bg-white/80 border-2 border-purple-300 focus:border-purple-700 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900" value={nombre} onChange={e => setNombre(e.target.value)} required />
        </label>
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> SKU (código interno)</span>
          <input
            className="input bg-white/80 border-2 border-slate-300 focus:border-slate-600 rounded-lg px-3 py-2 text-base font-medium text-slate-800 dark:text-slate-900"
            type="text"
            value={sku}
            readOnly
            placeholder={isEdit ? "SKU asignado" : "Se generará automáticamente"}
          />
        </label>
        
        {/* ¿Es una camiseta? */}
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-2">
          <span className="mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-600 inline-block"></span> 
            ¿Es una camiseta?
          </span>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isCamiseta}
              onChange={(e) => {
                setIsCamiseta(e.target.checked);
                if (!e.target.checked) {
                  setStockVariants([]);
                }
              }}
              className="w-5 h-5 rounded border-purple-300"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {isCamiseta ? "Desmarque si el producto no tiene tallas y colores" : "Marque si el producto tiene tallas y colores"}
            </span>
          </div>
        </label>

        {/* Stock simple (si no es camiseta) */}
        {!isCamiseta && (
          <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
            <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span> Stock</span>
            <input className="input bg-white/80 border-2 border-green-300 focus:border-green-600 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900" type="number" min="0" value={stock} onChange={e => setStock(Number(e.target.value))} required />
          </label>
        )}
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Precio</span>
          <input className="input bg-white/80 border-2 border-yellow-300 focus:border-yellow-500 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900" type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)} required />
        </label>
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Descuento (%)</span>
          <input
            className="input bg-white/80 border-2 border-red-300 focus:border-red-500 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900"
            type="number"
            min="0"
            max="100"
            value={descuento}
            onChange={e => {
              const val = e.target.value;
              if (val === "") {
                setDescuento("");
              } else {
                const num = Number(val);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                  setDescuento(val);
                }
              }
            }}
            placeholder="Opcional"
          />
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">Si se indica, se aplicará sobre el precio base.</span>
        </label>
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-700 inline-block"></span> Marca</span>
          <select className="input bg-white/80 border-2 border-green-300 focus:border-green-700 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900" value={marca} onChange={e => setMarca(e.target.value)} required>
            <option value="">Selecciona</option>
            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span> Bodega (Entrega)</span>
          <select className="input bg-white/80 border-2 border-orange-300 focus:border-orange-700 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900" value={bodegaId} onChange={e => setBodegaId(e.target.value)} required>
            <option value="">Selecciona una bodega</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>
                {b.nombre} ({b.tiempoEntrega}h)
              </option>
            ))}
          </select>
        </label>
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> Categoría</span>
          <select
            className="input bg-white/80 border-2 border-blue-300 focus:border-blue-600 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900"
            value={categoria}
            onChange={e => {
              setCategoria(e.target.value);
              setSubcategoria("");
              setSubsubcategoria("");
              setCategoryPathChanged(true);
              setSku("");
            }}
            required
          >
            <option value="">Selecciona</option>
            {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        {subcategoriasOptions.length > 0 && (
          <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
            <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-600 inline-block"></span> Subcategoría</span>
            <select
              className="input bg-white/80 border-2 border-cyan-300 focus:border-cyan-600 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900"
              value={subcategoria}
              onChange={e => {
                setSubcategoria(e.target.value);
                setSubsubcategoria("");
                setCategoryPathChanged(true);
                setSku("");
              }}
              required={subcategoriaRequired}
            >
              <option value="">Selecciona</option>
              {subcategoriasOptions.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>
        )}
        {subsubcategoriasOptions.length > 0 && (
          <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
            <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-600 inline-block"></span> Subsubcategoría</span>
            <select
              className="input bg-white/80 border-2 border-pink-300 focus:border-pink-600 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-900"
              value={subsubcategoria}
              onChange={e => {
                setSubsubcategoria(e.target.value);
                setCategoryPathChanged(true);
                setSku("");
              }}
              required={subsubcategoriaRequired}
            >
              <option value="">Selecciona</option>
              {subsubcategoriasOptions.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre}</option>)}
            </select>
          </label>
        )}
        <label className="font-bold text-purple-800 dark:text-purple-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> Descripción</span>
          <textarea className="input bg-white/80 border-2 border-purple-200 focus:border-purple-400 rounded-lg px-3 py-2 text-base text-slate-800 dark:text-slate-900 min-h-15" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
        </label>
      </div>
      {/* Columna derecha: imágenes y características */}
      <div className="flex flex-col gap-5 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
        <label className="font-bold text-blue-900 dark:text-blue-200 flex flex-col gap-1">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Imágenes</span>
          <input type="file" multiple accept="image/*" onChange={handleAddImagen} className="file:bg-blue-600 file:text-white file:rounded-lg file:px-4 file:py-2 file:font-bold file:mr-4 border-2 border-blue-200 focus:border-blue-400 rounded-lg px-3 py-2 bg-white/80" />
        </label>
        <button type="button" className="text-blue-700 underline font-semibold hover:text-blue-900 transition" onClick={handleAddImagenUrl}>Agregar por URL</button>
        {imagenes.map((img, idx) => {
          const url = typeof img === "string" ? img : (img instanceof File ? URL.createObjectURL(img) : "");
          return (
            <div
              key={idx}
              draggable
              onDragStart={() => handleImagenDragStart(idx)}
              onDragOver={handleImagenDragOver}
              onDrop={() => handleImagenDrop(idx)}
              className={`flex items-center gap-2 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-100 dark:border-blue-800 cursor-move transition-opacity ${draggedImageIdx === idx ? "opacity-50" : ""}`}
            >
              {url && (url.startsWith("http") || url.startsWith("blob:")) ? (
                <img src={url} alt="img" className="w-16 h-16 object-cover rounded shadow border-2 border-blue-200" />
              ) : null}
              <input className="input flex-1 bg-white/80 border-2 border-blue-200 focus:border-blue-400 rounded-lg px-3 py-2 text-base text-slate-800 dark:text-slate-900" value={typeof img === "string" ? img : ""} onChange={e => handleImagenUrlChange(idx, e.target.value)} placeholder="URL de imagen" />
              <button type="button" className="text-red-600 font-bold hover:text-red-800 transition" onClick={() => handleRemoveImagen(idx)}>Eliminar</button>
            </div>
          );
        })}        
        {/* Stock Manager para camisetas */}
        {isCamiseta && (
          <CamisetaStockManager
            variants={stockVariants}
            onChange={setStockVariants}
          />
        )}
        <label className="font-bold text-green-900 dark:text-green-200 flex flex-col gap-1 mt-2">
          <span className="mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Características</span>
        </label>
        {caracteristicas.map((c, idx) => (
          <div key={idx} className="flex flex-col mb-2 bg-green-50/60 dark:bg-green-900/20 rounded-lg p-2 border border-green-100 dark:border-green-800">
            <textarea
              className="input w-full bg-white/80 border-2 border-green-200 focus:border-green-400 rounded-lg px-4 py-3 text-base text-slate-800 dark:text-slate-900 resize-y min-h-[4.5rem] max-h-56 text-lg font-medium"
              value={c}
              onChange={e => handleCaracteristicaChange(idx, e.target.value)}
              placeholder="Característica"
              rows={3}
              style={{overflow: 'auto'}}
            />
            <button type="button" className="mt-2 w-fit bg-red-100 hover:bg-red-200 text-red-700 font-bold py-1 px-4 rounded transition self-end" onClick={() => handleRemoveCaracteristica(idx)}>Eliminar</button>
          </div>
        ))}
        <button type="button" className="text-green-700 underline font-semibold hover:text-green-900 transition" onClick={handleAddCaracteristica}>Agregar característica</button>
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className={
              `bg-linear-to-r from-purple-700 via-purple-500 to-purple-700 hover:from-purple-800 hover:to-purple-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`
            }
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isEdit ? "Actualizar" : loading ? "Creando..." : "Crear"}
          </button>
          <button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition-all duration-200" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </form>
  );
}

