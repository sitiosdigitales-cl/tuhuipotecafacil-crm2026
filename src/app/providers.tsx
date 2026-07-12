"use client";

import { UserProvider } from "@/lib/contexts/UserContext";
import { LeadProvider } from "@/lib/contexts/LeadContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ActivityProvider } from "@/lib/contexts/ActivityContext";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <AuthProvider>
        <UserProvider>
          <LeadProvider>
            <ActivityProvider>
              <NotificationProvider>
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  duration={3000}
                  toastOptions={{
                    style: {
                      fontSize: "13px",
                      borderRadius: "12px",
                    },
                  }}
                />
              </NotificationProvider>
            </ActivityProvider>
          </LeadProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
