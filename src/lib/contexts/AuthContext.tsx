"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios mock para cuando la API no está disponible (Vercel, etc.)
const USUARIOS_MOCK: Record<string, { password: string; usuario: Usuario }> = {
  "admin@tuhipotecafacil.cl": {
    password: "demo1234",
    usuario: { id: "u1", nombre: "Admin", apellido: "Sistema", email: "admin@tuhipotecafacil.cl", rol: "SUPER_ADMIN" },
  },
  "carlos.mendez@tuhipotecafacil.cl": {
    password: "demo1234",
    usuario: { id: "u2", nombre: "Carlos", apellido: "Méndez", email: "carlos.mendez@tuhipotecafacil.cl", rol: "ADMIN" },
  },
  "maria.garcia@tuhipotecafacil.cl": {
    password: "demo1234",
    usuario: { id: "u3", nombre: "María", apellido: "García", email: "maria.garcia@tuhipotecafacil.cl", rol: "GERENTE" },
  },
  "pedro.rojas@tuhipotecafacil.cl": {
    password: "demo1234",
    usuario: { id: "u4", nombre: "Pedro", apellido: "Rojas", email: "pedro.rojas@tuhipotecafacil.cl", rol: "EJECUTIVO" },
  },
  "ana.silva@tuhipotecafacil.cl": {
    password: "demo1234",
    usuario: { id: "u5", nombre: "Ana", apellido: "Silva", email: "ana.silva@tuhipotecafacil.cl", rol: "EJECUTIVO" },
  },
};

const SESSION_KEY = "crm_sesion";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    const verificarSesion = async () => {
      // Primero verificar localStorage (para Vercel / sin API)
      try {
        const sesionGuardada = localStorage.getItem(SESSION_KEY);
        if (sesionGuardada) {
          const sesion = JSON.parse(sesionGuardada);
          setUsuario(sesion);
          setIsAuthenticated(true);
          setCargando(false);
          return;
        }
      } catch {}

      // Intentar API
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.success && data.data) {
          setUsuario(data.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // No hay sesión activa
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Intentar API primero
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUsuario(data.data.usuario);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      // API no disponible, usar mock
    }

    // Fallback a mock users
    const mockUser = USUARIOS_MOCK[email];
    if (mockUser && mockUser.password === password) {
      setUsuario(mockUser.usuario);
      setIsAuthenticated(true);
      localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser.usuario));
      return true;
    }

    return false;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      // Ignorar errores de API
    } finally {
      setUsuario(null);
      setIsAuthenticated(false);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
