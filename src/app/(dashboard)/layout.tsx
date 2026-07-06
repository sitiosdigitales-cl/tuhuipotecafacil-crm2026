"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelRightOpen } from "lucide-react";
import { BarraLateral } from "@/componentes/layout/BarraLateral";
import { BarraSuperior } from "@/componentes/layout/BarraSuperior";
import { PanelDerecho } from "@/componentes/layout/PanelDerecho";

const RUTAS_FULLSCREEN = ["/pipeline"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esFullscreen = RUTAS_FULLSCREEN.some((ruta) => pathname.startsWith(ruta));

  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [panelDerechoAbierto, setPanelDerechoAbierto] = useState(false);
  const [panelDerechoColapsado, setPanelDerechoColapsado] = useState(false);

  if (esFullscreen) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900">
      {/* Sidebar - Fixed en desktop, overlay en móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarAbierto ? "block" : "hidden"}`}>
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarAbierto(false)}
        />
        <div className="relative z-50">
          <BarraLateral onClose={() => setSidebarAbierto(false)} />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <BarraLateral />
      </div>

      {/* Contenido principal */}
      <div className={`transition-all duration-300 lg:ml-[260px] mr-0 ${panelDerechoColapsado ? 'lg:mr-0' : 'lg:mr-[320px]'}`}>
        <BarraSuperior
          onMenuClick={() => setSidebarAbierto(true)}
          onPanelClick={() => setPanelDerechoAbierto(!panelDerechoAbierto)}
          panelColapsado={panelDerechoColapsado}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Panel derecho - Fixed en desktop, drawer en móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${panelDerechoAbierto ? "block" : "hidden"}`}>
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setPanelDerechoAbierto(false)}
        />
        <div className="absolute right-0 top-0 h-full">
          <PanelDerecho
            onClose={() => setPanelDerechoAbierto(false)}
            colapsado={false}
            onToggleColapsado={() => {}}
          />
        </div>
      </div>

      {/* Panel derecho desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${panelDerechoColapsado ? 'w-0 overflow-hidden' : ''}`}>
        <PanelDerecho
          colapsado={panelDerechoColapsado}
          onToggleColapsado={() => setPanelDerechoColapsado(!panelDerechoColapsado)}
        />
      </div>

      {/* Botón flotante para expandir panel (visible cuando está colapsado) */}
      {panelDerechoColapsado && (
        <button
          onClick={() => setPanelDerechoColapsado(false)}
          className="fixed right-4 top-20 z-30 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hidden lg:flex items-center gap-2"
          title="Expandir panel lateral"
        >
          <PanelRightOpen size={16} className="text-slate-500" />
        </button>
      )}
    </div>
  );
}