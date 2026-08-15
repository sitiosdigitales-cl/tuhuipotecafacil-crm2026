import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShellPublico } from "./shell-publico";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TuHipotecaFacil.cl - CRM Hipotecario Inteligente",
  description: "Sistema CRM para gestión integral de créditos hipotecarios",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ShellPublico>{children}</ShellPublico>
      </body>
    </html>
  );
}
