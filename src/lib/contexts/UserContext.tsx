"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Usuario } from "@/tipos";

interface UserContextType {
  usuarioActual: Usuario;
  cambiarUsuario: (usuarioId: string) => void;
  esSuperAdmin: boolean;
  usuarios: Usuario[];
  cargarUsuarios: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

type UsuarioApi = Omit<Usuario, "creadoEn" | "ultimoAcceso"> & {
  creadoEn?: string | Date;
  ultimoAcceso?: string | Date;
};

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
}

function normalizarUsuario(usuario: UsuarioApi): Usuario {
  return {
    ...usuario,
    creadoEn: usuario.creadoEn ? new Date(usuario.creadoEn) : new Date(),
    ultimoAcceso: usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso) : undefined,
  };
}

// Usuario por defecto mientras se carga (sin permisos reales)
const USUARIO_DEFAULT: Usuario = {
  id: "",
  nombre: "Cargando",
  apellido: "...",
  email: "",
  rol: "AGENTE",
  estado: "ACTIVO",
  creadoEn: new Date(),
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { usuario: authUser, isAuthenticated } = useAuth();
  const [usuarioActual, setUsuarioActual] = useState<Usuario>(USUARIO_DEFAULT);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const cargarUsuarios = useCallback(async () => {
    try {
      const response = await fetch("/api/usuarios", { credentials: "include" });
      const data = await response.json() as RespuestaApi<UsuarioApi[]>;
      if (data.success && data.data) {
        setUsuarios(data.data.map(normalizarUsuario));
      }
    } catch {
      // Silenciar errores de carga de usuarios
    }
  }, []);

  // Cargar usuarios al montar
  useEffect(() => {
    const timeout = window.setTimeout(() => void cargarUsuarios(), 0);
    return () => window.clearTimeout(timeout);
  }, [cargarUsuarios]);

  // Sincronizar con el usuario de auth cuando cambie
  useEffect(() => {
    if (!isAuthenticated || !authUser) return;

    const timeout = window.setTimeout(() => {
      // Buscar el usuario en la lista cargada de la API
      const usuarioEncontrado = usuarios.find(
        (u) => u.email.toLowerCase() === authUser.email.toLowerCase()
      );
      if (usuarioEncontrado) {
        setUsuarioActual(usuarioEncontrado);
      } else {
        // Crear usuario basado en datos de auth
        setUsuarioActual({
          id: authUser.id,
          nombre: authUser.nombre,
          apellido: authUser.apellido,
          email: authUser.email,
          rol: authUser.rol as Usuario["rol"],
          estado: "ACTIVO",
          creadoEn: new Date(),
        });
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [authUser, isAuthenticated, usuarios]);

  const cambiarUsuario = useCallback(async (usuarioId: string) => {
    try {
      const response = await fetch("/api/auth/switch-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: usuarioId }),
      });

      const data = await response.json() as RespuestaApi<{ usuario: UsuarioApi }>;

      if (data.success && data.data) {
        // Actualizar el usuario actual localmente
        setUsuarioActual(normalizarUsuario(data.data.usuario));

        // Recargar la página para aplicar los cambios
        window.location.reload();
      }
    } catch {
      // Fallback: cambio local sin API
      const usuario = usuarios.find((u) => u.id === usuarioId);
      if (usuario) {
        setUsuarioActual(usuario);
      }
    }
  }, [usuarios]);

  const esSuperAdmin = usuarioActual.rol === "SUPER_ADMIN";

  const valor = useMemo(
    () => ({ usuarioActual, cambiarUsuario, esSuperAdmin, usuarios, cargarUsuarios }),
    [usuarioActual, cambiarUsuario, esSuperAdmin, usuarios, cargarUsuarios]
  );

  return (
    <UserContext.Provider value={valor}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
