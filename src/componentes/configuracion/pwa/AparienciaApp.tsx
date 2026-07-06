"use client";

import { Palette, Moon, Sun } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";
import { ColorPicker } from "./ColorPicker";
import { IconUploader } from "./IconUploader";
import { PhoneMockup } from "./PhoneMockup";

interface AparienciaAppProps {
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

export function AparienciaApp({ config, actualizarCampo }: AparienciaAppProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-5">
        {/* Nombre de la App */}
        <SectionCard title="Identidad de la App" icon={<Palette size={16} className="text-purple-500" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo">
              <input
                type="text"
                value={config.nombreApp}
                onChange={(e) => actualizarCampo("nombreApp", e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                placeholder="TuHipotecaFacil CRM"
              />
            </Field>
            <Field label="Nombre corto (PWA)">
              <input
                type="text"
                value={config.shortName}
                onChange={(e) => actualizarCampo("shortName", e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                placeholder="THF CRM"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Maximo 12 caracteres. Se muestra en la pantalla de inicio.</p>
            </Field>
          </div>
        </SectionCard>

        {/* Logo y Favicon */}
        <SectionCard title="Logo y Favicon" icon={<Palette size={16} className="text-blue-500" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <IconUploader
              label="Logo de la App"
              sublabel="Se muestra en la app, splash screen e instalacion. Recomendado: 512x512px"
              value={config.logoUrl}
              onChange={(v) => actualizarCampo("logoUrl", v)}
              size={100}
            />
            <IconUploader
              label="Favicon"
              sublabel="Icono del navegador. Recomendado: SVG o PNG 32x32px"
              value={config.faviconUrl}
              onChange={(v) => actualizarCampo("faviconUrl", v)}
              size={60}
            />
          </div>
        </SectionCard>

        {/* Colores */}
        <SectionCard title="Colores" icon={<Palette size={16} className="text-emerald-500" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ColorPicker
              label="Color Primario"
              value={config.colorPrimario}
              onChange={(v) => actualizarCampo("colorPrimario", v)}
            />
            <ColorPicker
              label="Color Secundario"
              value={config.colorSecundario}
              onChange={(v) => actualizarCampo("colorSecundario", v)}
            />
            <ColorPicker
              label="Fondo Splash"
              value={config.colorFondoSplash}
              onChange={(v) => actualizarCampo("colorFondoSplash", v)}
            />
          </div>
        </SectionCard>

        {/* Dark Mode */}
        <SectionCard title="Modo Oscuro" icon={config.darkMode ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-amber-500" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  {config.darkMode ? <Moon size={14} className="text-indigo-500" /> : <Sun size={14} className="text-amber-500" />}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-700">Habilitar modo oscuro</div>
                  <div className="text-[10px] text-slate-400">Permitir a los usuarios cambiar entre tema claro y oscuro</div>
                </div>
              </div>
              <button
                onClick={() => actualizarCampo("darkMode", !config.darkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  config.darkMode ? "bg-indigo-500" : "bg-slate-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                  config.darkMode ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {config.darkMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-0 sm:pl-11">
                <ColorPicker
                  label="Primario (Dark)"
                  value={config.colorPrimarioDark}
                  onChange={(v) => actualizarCampo("colorPrimarioDark", v)}
                  showPresets={false}
                />
                <ColorPicker
                  label="Secundario (Dark)"
                  value={config.colorSecundarioDark}
                  onChange={(v) => actualizarCampo("colorSecundarioDark", v)}
                  showPresets={false}
                />
                <ColorPicker
                  label="Fondo (Dark)"
                  value={config.colorFondoDark}
                  onChange={(v) => actualizarCampo("colorFondoDark", v)}
                  showPresets={false}
                />
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Preview */}
      <div className="hidden xl:block sticky top-24 self-start">
        <PhoneMockup config={config} />
      </div>
    </div>
  );
}
