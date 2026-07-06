"use client";

import { Zap, Play } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";
import { ColorPicker } from "./ColorPicker";
import { IconUploader } from "./IconUploader";

interface SplashScreenProps {
  config: PWAConfig;
  actualizarCampo: <K extends keyof PWAConfig>(campo: K, valor: PWAConfig[K]) => void;
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const ANIMACIONES = [
  { value: "fade", label: "Fade In", desc: "Aparece suavemente con transicion de opacidad" },
  { value: "slide", label: "Slide Up", desc: "Desliza desde abajo hacia arriba" },
  { value: "none", label: "Sin animacion", desc: "Aparece instantaneamente" },
];

export function SplashScreen({ config, actualizarCampo }: SplashScreenProps) {
  return (
    <div className="space-y-5">
      {/* Logo del Splash */}
      <SectionCard title="Logo del Splash" icon={<Zap size={16} className="text-amber-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <IconUploader
            label="Logo para Splash Screen"
            sublabel="Se muestra centrado en la pantalla de carga. Recomendado: 256x256px con fondo transparente."
            value={config.splashLogo}
            onChange={(v) => actualizarCampo("splashLogo", v)}
            size={120}
          />
          <div className="space-y-3">
            <ColorPicker
              label="Color de fondo"
              value={config.colorFondoSplash}
              onChange={(v) => actualizarCampo("colorFondoSplash", v)}
            />
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-500">
                El splash screen se muestra mientras la app carga su contenido inicial. Usa el color de fondo de la seccion de Apariencia para consistencia.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Configuracion */}
      <SectionCard title="Comportamiento" icon={<Play size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Duracion (ms)">
            <div className="space-y-2">
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={config.splashDuracion}
                onChange={(e) => actualizarCampo("splashDuracion", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">500ms</span>
                <span className="text-[12px] font-bold text-slate-700">{config.splashDuracion}ms</span>
                <span className="text-[11px] text-slate-400">5000ms</span>
              </div>
            </div>
          </Field>

          <Field label="Animacion de entrada">
            <div className="space-y-1.5">
              {ANIMACIONES.map((anim) => (
                <button
                  key={anim.value}
                  onClick={() => actualizarCampo("splashAnimacion", anim.value as PWAConfig["splashAnimacion"])}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    config.splashAnimacion === anim.value
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[12px] font-semibold text-slate-700">{anim.label}</div>
                  <div className="text-[10px] text-slate-400">{anim.desc}</div>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Preview del Splash */}
      <SectionCard title="Preview" icon={<Play size={16} className="text-emerald-500" />}>
        <div className="flex justify-center">
          <div
            className="w-[200px] h-[350px] rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col items-center justify-center shadow-lg transition-all"
            style={{ backgroundColor: config.colorFondoSplash }}
          >
            {config.splashLogo ? (
              <img src={config.splashLogo} alt="" className="w-20 h-20 rounded-2xl object-cover mb-4" />
            ) : config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover mb-4" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${config.colorPrimario}20` }}
              >
                <span className="text-2xl font-bold" style={{ color: config.colorPrimario }}>TH</span>
              </div>
            )}
            <div className="text-[13px] font-bold" style={{ color: config.colorPrimario }}>
              {config.nombreApp || "TuHipotecaFacil"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cargando...</div>
            <div className="w-10 h-1 rounded-full mt-4 overflow-hidden bg-slate-200/50">
              <div
                className="h-full rounded-full animate-pulse"
                style={{ backgroundColor: config.colorPrimario, width: "60%" }}
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
