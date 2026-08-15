"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";

// El login usa useAuth. Es el único contexto del CRM que necesita una página
// fuera del panel, así que se monta solo acá y no en la raíz.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
