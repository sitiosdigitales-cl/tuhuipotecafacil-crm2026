"use client";

import { useState } from "react";
import {
  Smartphone,
  Palette,
  ImageIcon,
  Zap,
  Settings,
  Database,
  Shield,
  Download,
  Save,
  Check,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePWAConfig } from "@/lib/hooks/usePWAConfig";
import { AparienciaApp } from "@/componentes/configuracion/pwa/AparienciaApp";
import { IconosAssets } from "@/componentes/configuracion/pwa/IconosAssets";
import { SplashScreen } from "@/componentes/configuracion/pwa/SplashScreen";
import { ConfigTecnica } from "@/componentes/configuracion/pwa/ConfigTecnica";
import { ServiceWorkerConfig } from "@/componentes/configuracion/pwa/ServiceWorkerConfig";
import { CapacitorConfig } from "@/componentes/configuracion/pwa/CapacitorConfig";
import { InstalacionDistribucion } from "@/componentes/configuracion/pwa/InstalacionDistribucion";

type TabPWA =
  | "apariencia"
  | "iconos"
  | "splash"
  | "tecnica"
  | "service-worker"
  | "capacitor"
  | "distribucion";

const TABS: { id: TabPWA; label: string; icon: React.ReactNode }[] = [
  { id: "apariencia", label: "Apariencia", icon: <Palette size={16} /> },
  { id: "iconos", label: "Iconos y Assets", icon: <ImageIcon size={16} /> },
  { id: "splash", label: "Splash Screen", icon: <Zap size={16} /> },
  { id: "tecnica", label: "Config. Tecnica", icon: <Settings size={16} /> },
  { id: "service-worker", label: "Service Worker", icon: <Database size={16} /> },
  { id: "capacitor", label: "Capacitor / Nativo", icon: <Smartphone size={16} /> },
  { id: "distribucion", label: "Instalacion", icon: <Download size={16} /> },
];

export default function ConfiguracionPWAPage() {
  const [tabActiva, setTabActiva] = useState<TabPWA>("apariencia");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const { config, actualizarCampo, resetConfig, exportarConfig, importarConfig } = usePWAConfig();

  const handleGuardar = () => {
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }, 800);
  };

  const renderContenido = () => {
    switch (tabActiva) {
      case "apariencia":
        return <AparienciaApp config={config} actualizarCampo={actualizarCampo} />;
      case "iconos":
        return <IconosAssets config={config} actualizarCampo={actualizarCampo} />;
      case "splash":
        return <SplashScreen config={config} actualizarCampo={actualizarCampo} />;
      case "tecnica":
        return <ConfigTecnica config={config} actualizarCampo={actualizarCampo} />;
      case "service-worker":
        return <ServiceWorkerConfig config={config} actualizarCampo={actualizarCampo} />;
      case "capacitor":
        return <CapacitorConfig config={config} actualizarCampo={actualizarCampo} />;
      case "distribucion":
        return (
          <InstalacionDistribucion
            config={config}
            actualizarCampo={actualizarCampo}
            exportarConfig={exportarConfig}
            importarConfig={importarConfig}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/configuracion"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Smartphone size={20} className="text-blue-500" />
              Configuracion PWA / App Movil
            </h1>
            <p className="text-[11px] text-slate-400">
              Configura la apariencia, comportamiento y distribuicion de tu Progressive Web App
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetConfig}
            className="h-9 px-3 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-medium hover:bg-slate-200 transition-colors"
          >
            Restablecer
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className={`h-9 px-4 rounded-xl text-[12px] font-medium transition-all flex items-center gap-1.5 ${
              guardado
                ? "bg-emerald-500 text-white"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } disabled:opacity-70`}
          >
            {guardado ? (
              <>
                <Check size={14} /> Guardado
              </>
            ) : guardando ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={14} /> Guardar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5">
        {/* Sidebar de tabs */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                  tabActiva === tab.id
                    ? "bg-slate-100 text-slate-800 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className={tabActiva === tab.id ? "text-blue-500" : "text-slate-400"}>
                  {tab.icon}
                </span>
                <span className="text-[12px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all ${
                tabActiva === tab.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">
          {renderContenido()}
        </div>
      </div>
    </div>
  );
}
