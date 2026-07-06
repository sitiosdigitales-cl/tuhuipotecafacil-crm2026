"use client";

import { Smartphone, Copy, Check, Info } from "lucide-react";
import { useState } from "react";
import { PWAConfig } from "@/tipos/pwa-config";
import { ColorPicker } from "./ColorPicker";

interface CapacitorConfigProps {
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

const STATUS_BAR_STYLES = [
  { value: "light", label: "Light", desc: "Iconos oscuros en la barra de estado" },
  { value: "dark", label: "Dark", desc: "Iconos claros en la barra de estado" },
  { value: "default", label: "Default", desc: "Estilo del sistema operativo" },
];

export function CapacitorConfig({ config, actualizarCampo }: CapacitorConfigProps) {
  const [copiado, setCopiado] = useState(false);

  const configCode = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${config.appId}',
  appName: '${config.appNameNativo}',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: ${config.splashNativoDuracion},
      backgroundColor: '${config.splashNativoColor}',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: '${config.statusBarStyle}',
      backgroundColor: '${config.splashNativoColor}',
    },
  },
};

export default config;`;

  const copiarConfig = () => {
    navigator.clipboard.writeText(configCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Identificacion de la App */}
      <SectionCard title="Identificacion" icon={<Smartphone size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="App ID (package name)">
            <input
              type="text"
              value={config.appId}
              onChange={(e) => actualizarCampo("appId", e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="cl.tuhuipotecafacil.crm"
            />
            <p className="text-[11px] text-slate-400 mt-1">Formato: com.company.appname</p>
          </Field>
          <Field label="Nombre de la App (nativo)">
            <input
              type="text"
              value={config.appNameNativo}
              onChange={(e) => actualizarCampo("appNameNativo", e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="TuHipotecaFacil"
            />
          </Field>
          <Field label="Version">
            <input
              type="text"
              value={config.version}
              onChange={(e) => actualizarCampo("version", e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="1.0.0"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Status Bar */}
      <SectionCard title="Barra de Estado" icon={<Smartphone size={16} className="text-purple-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Estilo">
            <div className="space-y-1.5">
              {STATUS_BAR_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => actualizarCampo("statusBarStyle", style.value as PWAConfig["statusBarStyle"])}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    config.statusBarStyle === style.value
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[12px] font-semibold text-slate-700">{style.label}</div>
                  <div className="text-[10px] text-slate-400">{style.desc}</div>
                </button>
              ))}
            </div>
          </Field>
          <div className="space-y-4">
            <ColorPicker
              label="Color de fondo Status Bar"
              value={config.splashNativoColor}
              onChange={(v) => actualizarCampo("splashNativoColor", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Splash Nativo */}
      <SectionCard title="Splash Screen Nativo" icon={<Smartphone size={16} className="text-emerald-500" />}>
        <Field label="Duracion (ms)">
          <div className="space-y-2">
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={config.splashNativoDuracion}
              onChange={(e) => actualizarCampo("splashNativoDuracion", Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">500ms</span>
              <span className="text-[12px] font-bold text-slate-700">{config.splashNativoDuracion}ms</span>
              <span className="text-[11px] text-slate-400">5000ms</span>
            </div>
          </div>
        </Field>
      </SectionCard>

      {/* Config Code Preview */}
      <SectionCard title="Capacitor Config" icon={<Smartphone size={16} className="text-amber-500" />}>
        <div className="relative">
          <button
            onClick={copiarConfig}
            className="absolute top-2 right-2 p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors z-10"
          >
            {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <pre className="bg-slate-900 text-slate-300 rounded-xl p-4 text-[10px] overflow-x-auto font-mono leading-relaxed pr-12">
            {configCode}
          </pre>
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-start gap-2">
          <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-blue-700">
            Copia este codigo y reemplaza el contenido de <span className="font-mono font-semibold">capacitor.config.ts</span> en la raiz del proyecto. Luego ejecuta <span className="font-mono font-semibold">npx cap sync</span> para aplicar los cambios.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
