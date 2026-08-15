"use client";

import { UserProvider } from "@/lib/contexts/UserContext";
import { LeadProvider } from "@/lib/contexts/LeadContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ActivityProvider } from "@/lib/contexts/ActivityContext";

/**
 * Proveedores del CRM. Van en el layout del panel, NO en la raíz.
 *
 * Estando en la raíz, cada página pública —el simulador, el portal, la de
 * referidos— montaba los cinco contextos, y con ellos el cliente de Supabase y
 * las llamadas a la API que hacen al montarse. Un visitante que solo quería
 * simular un dividendo se bajaba el CRM completo.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <LeadProvider>
          <ActivityProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </ActivityProvider>
        </LeadProvider>
      </UserProvider>
    </AuthProvider>
  );
}
