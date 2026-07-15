"use client";

import { PortalClienteContent } from "@/componentes/portal/PortalClienteContent";
import { Home, MessageSquare } from "lucide-react";

export default function PortalClientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0f2d4a]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">TuHipotecaFácil</h1>
              <p className="text-[10px] text-blue-200/60">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">

            <a href="https://wa.me/56983300597" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
              <MessageSquare size={14} />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PortalClienteContent />
      </main>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <Home size={12} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white">TuHipotecaFácil</div>
                <div className="text-[9px] text-blue-200/50">Gestión Hipotecaria</div>
              </div>
            </div>
            <div className="text-[9px] text-blue-200/40">© 2026 TuHipotecaFácil.cl</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
