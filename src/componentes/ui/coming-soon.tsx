"use client";

import { Construction, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  titulo: string;
  descripcion?: string;
}

export function ComingSoon({ titulo, descripcion }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
        <Construction size={32} className="text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{titulo}</h1>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        {descripcion || "Esta sección está en desarrollo y estará disponible próximamente."}
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
        >
          <Home size={16} /> Volver al Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    </div>
  );
}