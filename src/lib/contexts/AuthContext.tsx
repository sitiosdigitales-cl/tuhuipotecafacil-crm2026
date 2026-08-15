"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificar sesión en cookie
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.data) {
          setUsuario(data.data);
          setIsAuthenticated(true);
        }
      } catch {}
      setCargando(false);
    };
    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUsuario(data.data.usuario);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    setIsAuthenticated(false);
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
