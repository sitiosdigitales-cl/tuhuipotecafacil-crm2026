"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

// Usuario por defecto mientras se carga
const USUARIO_DEFAULT: Usuario = {
  id: "u1",
  nombre: "Super",
  apellido: "Admin",
  email: "admin@tuhipotecafacil.cl",
  rol: "SUPER_ADMIN",
  estado: "ACTIVO",
  creadoEn: new Date(),
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { usuario: authUser, isAuthenticated } = useAuth();
  const [usuarioActual, setUsuarioActual] = useState<Usuario>(USUARIO_DEFAULT);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const cargarUsuarios = useCallback(async () => {
    try {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      if (data.success && data.data) {
        setUsuarios(data.data.map((u: any) => ({
          ...u,
          creadoEn: u.creadoEn ? new Date(u.creadoEn) : new Date(),
          ultimoAcceso: u.ultimoAcceso ? new Date(u.ultimoAcceso) : undefined,
        })));
      }
    } catch {
      // Silenciar errores de carga de usuarios
    }
  }, []);

  // Cargar usuarios al montar
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Sincronizar con el usuario de auth cuando cambie
  useEffect(() => {
    if (isAuthenticated && authUser) {
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
          avatar: authUser.avatar,
          creadoEn: new Date(),
        });
      }
    }
  }, [authUser, isAuthenticated, usuarios]);

  const cambiarUsuario = (usuarioId: string) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    if (usuario) {
      setUsuarioActual(usuario);
    }
  };

  const esSuperAdmin = usuarioActual.rol === "SUPER_ADMIN";

  return (
    <UserContext.Provider value={{ usuarioActual, cambiarUsuario, esSuperAdmin, usuarios, cargarUsuarios }}>
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
