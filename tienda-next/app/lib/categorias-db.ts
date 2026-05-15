import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

const COLLECTION = "categorias";

function sortCategoriasByOrder(categorias: any[]): any[] {
  return categorias
    .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
    .map(cat => ({
      ...cat,
      subcategorias: cat.subcategorias ? sortCategoriasByOrder(cat.subcategorias) : undefined
    }));
}

export async function obtenerCategorias() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const categorias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return sortCategoriasByOrder(categorias);
}



function cleanUndefinedDeep(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedDeep);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanUndefinedDeep(v)])
    );
  }
  return obj;
}

export async function guardarCategoria(categoria) {
  await setDoc(doc(db, COLLECTION, categoria.id), cleanUndefinedDeep(categoria));
}

export async function actualizarCategoria(id, data) {
  await updateDoc(doc(db, COLLECTION, id), cleanUndefinedDeep(data));
}

export async function eliminarCategoria(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
