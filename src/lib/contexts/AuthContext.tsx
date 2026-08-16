"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface LoginResult {
  success: boolean;
  code?: string;
  error?: string;
  usuario?: Usuario;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<boolean>;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUsuario(data.data);
        setIsAuthenticated(true);
        return;
      }
    } catch {}

    setUsuario(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const inicio = window.setTimeout(() => {
      void checkSession().finally(() => setCargando(false));
    }, 0);

    const interval = window.setInterval(() => {
      void checkSession();
    }, 10 * 60 * 1000);
    const alVolver = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      window.clearTimeout(inicio);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [checkSession]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.data?.usuario) {
        const authenticatedUser = data.data.usuario as Usuario;
        setUsuario(authenticatedUser);
        setIsAuthenticated(true);
        return { success: true, usuario: authenticatedUser };
      }
      return {
        success: false,
        code: typeof data?.code === "string" ? data.code : undefined,
        error: typeof data?.error === "string"
          ? data.error
          : "No se pudo iniciar sesión. Intenta nuevamente.",
      };
    } catch {
      return {
        success: false,
        error: "No se pudo conectar con el servidor. Intenta nuevamente.",
      };
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) return false;

      setUsuario(null);
      setIsAuthenticated(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Sin useMemo, este objeto es nuevo en cada render y React, que compara por
  // referencia, vuelve a dibujar a todos los consumidores aunque nada cambie.
  const valor = useMemo(
    () => ({ isAuthenticated, usuario, login, logout, cargando }),
    [isAuthenticated, usuario, login, logout, cargando]
  );

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}
