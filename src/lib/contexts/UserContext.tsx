"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { USUARIOS_MOCK } from "@/datos/mock";
import type { Usuario } from "@/tipos";

interface UserContextType {
  usuarioActual: Usuario;
  cambiarUsuario: (usuarioId: string) => void;
  esSuperAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { usuario: authUser, isAuthenticated } = useAuth();
  const [usuarioActual, setUsuarioActual] = useState<Usuario>(USUARIOS_MOCK[0]);

  // Sincronizar con el usuario de auth cuando cambie
  useEffect(() => {
    if (isAuthenticated && authUser) {
      // Buscar el usuario mock correspondiente al email
      const mockUser = USUARIOS_MOCK.find(
        (u) => u.email.toLowerCase() === authUser.email.toLowerCase()
      );
      if (mockUser) {
        setUsuarioActual(mockUser);
      } else {
        // Crear un usuario mock basado en los datos de auth
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
    } else {
      // Sin auth, usar Super Admin por defecto
      setUsuarioActual(USUARIOS_MOCK[0]);
    }
  }, [authUser, isAuthenticated]);

  const cambiarUsuario = (usuarioId: string) => {
    const usuario = USUARIOS_MOCK.find((u) => u.id === usuarioId);
    if (usuario) {
      setUsuarioActual(usuario);
    }
  };

  const esSuperAdmin = usuarioActual.rol === "SUPER_ADMIN";

  return (
    <UserContext.Provider value={{ usuarioActual, cambiarUsuario, esSuperAdmin }}>
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
