"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { getInitialFavorites, getInitialCart, saveFavorites, saveCart, mergeGuestCartIntoUser, getCartItemKey } from "./userLocalStorage";
import { auth } from "../lib/firebase";
import { onIdTokenChanged, getIdToken, getIdTokenResult } from "firebase/auth";
import { Loading3DIcon } from "../components/Loading3DIcon";



// Tipado explícito para el usuario
export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  emailVerified?: boolean;  // Nuevo: track email verification status
  [key: string]: any;
}

interface UserContextType {
  isLogged: boolean;
  isCliente: boolean;
  isAdmin: boolean;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  favoritos: any[];
  addFavorito: (p: any) => void;
  removeFavorito: (id: string) => void;
  carrito: any[];
  addCarrito: (p: any) => void;
  removeCarrito: (id: string) => void;
  clearCarrito: () => void;
}

// Contexto de usuario global tipado
const UserContext = createContext<UserContextType>({
  isLogged: false,
  isCliente: false,
  isAdmin: false,
  user: null,
  setUser: () => {},
  favoritos: [],
  addFavorito: () => {},
  removeFavorito: () => {},
  carrito: [],
  addCarrito: () => {},
  removeCarrito: () => {},
  clearCarrito: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [favoritos, setFavoritos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  // Controla si el carrito ya fue cargado desde localStorage (evita sobreescribir en la carga inicial)
  const cartLoadedRef = useRef(false);
  // Guarda el uid anterior para detectar transición de invitado → logueado
  const prevUidRef = useRef<string | null>(null);

  // Escuchar cambios en el token (incluye inicio de sesión y refresh de claims)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (realUser) => {
      if (!realUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // MEJORA: Usar emailVerified de Firebase directamente
      // No bloquear acceso si el email no está verificado, solo mostrar banner
      // La navegación está permitida pero se mostrará una alerta
      
      try {
        // Forzar refresh del token para obtener claims actualizados
        await getIdToken(realUser, true);
        const idToken = await getIdToken(realUser);
        
        // Intentar obtener rol desde backend si existe endpoint
        try {
          const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${idToken}` } });
          if (res.ok) {
            const data = await res.json();
            // Incluir emailVerified en el usuario sin bloquear acceso
            setUser({ ...(realUser as any), role: data.role, emailVerified: realUser.emailVerified });
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore and fallback to token claims
        }
        
        // Fallback: leer claims desde el token
        try {
          const tokenResult = await getIdTokenResult(realUser);
          setUser({ 
            ...(realUser as any), 
            role: (tokenResult?.claims as any)?.role,
            emailVerified: realUser.emailVerified 
          });
        } catch (e) {
          setUser({ ...(realUser as any), emailVerified: realUser.emailVerified });
        }
      } catch (err) {
        setUser({ ...(realUser as any), emailVerified: realUser.emailVerified });
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Inicializar favoritos desde localStorage (una sola vez)
  useEffect(() => {
    setFavoritos(getInitialFavorites());
  }, []);

  // Cuando el usuario se resuelve, cargar el carrito correspondiente
  // (invitado => 'carrito_guest', logueado => 'carrito_<uid>')
  // Si el usuario acaba de autenticarse, fusionar el carrito guest en el suyo
  useEffect(() => {
    if (loading) return;
    const uid = (user as any)?.uid || null;
    cartLoadedRef.current = false;

    if (uid && prevUidRef.current === null) {
      // Transición: invitado → logueado → fusionar carrito guest
      const merged = mergeGuestCartIntoUser(uid);
      setCarrito(merged);
    } else {
      setCarrito(getInitialCart(uid));
    }
    prevUidRef.current = uid;
  }, [user, loading]);

  // Guardar favoritos en localStorage cuando cambian
  useEffect(() => { saveFavorites(favoritos); }, [favoritos]);

  // Guardar carrito en localStorage, pero NO durante la carga inicial
  useEffect(() => {
    if (!cartLoadedRef.current) {
      // Primera ejecución tras cargar: marcar como listo y no guardar
      cartLoadedRef.current = true;
      return;
    }
    const uid = (user as any)?.uid || null;
    saveCart(carrito, uid);
  }, [carrito]); // eslint-disable-line react-hooks/exhaustive-deps

  // Métodos para favoritos
  const addFavorito = (producto) => {
    setFavoritos((prev) => {
      if (prev.find((p) => p.id === producto.id)) return prev;
      return [...prev, producto];
    });
  };
  const removeFavorito = (id) => {
    setFavoritos((prev) => prev.filter((p) => p.id !== id));
  };

  // Métodos para carrito
  const addCarrito = (producto) => {
    setCarrito((prev) => {
      const nextKey = getCartItemKey(producto);
      // Si ya existe, reemplaza la cantidad
      if (prev.find((p) => getCartItemKey(p) === nextKey)) {
        return prev.map((p) =>
          getCartItemKey(p) === nextKey ? { ...p, ...producto, cantidad: producto.cantidad || 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: producto.cantidad || 1 }];
    });
  };
  const removeCarrito = (id) => {
    setCarrito((prev) => prev.filter((p) => getCartItemKey(p) !== id));
  };
  const clearCarrito = () => {
    setCarrito([]);
  };

  const isLogged = !!user;
  const isCliente = false;
  const isAdmin = user?.role === "admin";


  if (loading) {
    return (
      <div style={{width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Loading3DIcon />
      </div>
    );
  }

  return (
    <UserContext.Provider value={{
      isLogged,
      isCliente,
      isAdmin,
      user,
      setUser,
      favoritos,
      addFavorito,
      removeFavorito,
      carrito,
      addCarrito,
      removeCarrito,
      clearCarrito,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  return useContext(UserContext);
}
