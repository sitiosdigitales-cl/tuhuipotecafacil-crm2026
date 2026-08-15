"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

/**
 * Lo mínimo que necesita cualquier página, incluidas las públicas: tema y
 * avisos. Los contextos del CRM viven en el layout del panel.
 */
export function ShellPublico({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
        toastOptions={{ style: { fontSize: "13px", borderRadius: "12px" } }}
      />
    </ThemeProvider>
  );
}
