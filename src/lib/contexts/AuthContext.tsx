"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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

  const login = async (email: string, password: string): Promise<boolean> => {
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
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}
