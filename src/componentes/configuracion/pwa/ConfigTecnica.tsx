"use client";

import { Settings, Info } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";
import { ColorPicker } from "./ColorPicker";

interface ConfigTecnicaProps {
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; desc?: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

const DISPLAY_MODES = [
  { value: "standalone", label: "Standalone", desc: "Sin UI del navegador, como app nativa" },
  { value: "fullscreen", label: "Fullscreen", desc: "Pantalla completa, sin barra del navegador" },
  { value: "minimal-ui", label: "Minimal UI", desc: "Controles de navegacion minimos" },
  { value: "browser", label: "Browser", desc: "Se abre en una pestana del navegador" },
];

const ORIENTATIONS = [
  { value: "portrait", label: "Portrait (vertical)" },
  { value: "landscape", label: "Landscape (horizontal)" },
  { value: "any", label: "Cualquier orientacion" },
];

export function ConfigTecnica({ config, actualizarCampo }: ConfigTecnicaProps) {
  return (
    <div className="space-y-5">
      {/* Display y Orientacion */}
      <SectionCard title="Presentacion" icon={<Settings size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Modo de visualizacion">
            <Select
              value={config.displayMode}
              onChange={(v) => actualizarCampo("displayMode", v as PWAConfig["displayMode"])}
              options={DISPLAY_MODES}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {DISPLAY_MODES.find((m) => m.value === config.displayMode)?.desc}
            </p>
          </Field>
          <Field label="Orientacion">
            <Select
              value={config.orientation}
              onChange={(v) => actualizarCampo("orientation", v as PWAConfig["orientation"])}
              options={ORIENTATIONS}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Colores del tema */}
      <SectionCard title="Colores del Tema" icon={<Settings size={16} className="text-purple-500" />}>
        <p className="text-[10px] text-slate-400 mb-3">
          El theme color se usa en la barra del navegador y en la pantalla de inicio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorPicker
            label="Theme Color"
            value={config.themeColor}
            onChange={(v) => actualizarCampo("themeColor", v)}
          />
          <ColorPicker
            label="Background Color"
            value={config.backgroundColor}
            onChange={(v) => actualizarCampo("backgroundColor", v)}
          />
        </div>
      </SectionCard>

      {/* URLs y Metadata */}
      <SectionCard title="URLs y Metadata" icon={<Info size={16} className="text-emerald-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start URL">
            <input
              type="text"
              value={config.startUrl}
              onChange={(e) => actualizarCampo("startUrl", e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="/dashboard"
            />
          </Field>
          <Field label="Scope">
            <input
              type="text"
              value={config.scope}
              onChange={(e) => actualizarCampo("scope", e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="/"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripcion">
              <textarea
                value={config.descripcion}
                onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all resize-none"
                placeholder="Descripcion corta de la app..."
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Categorias */}
      <SectionCard title="Categorias" icon={<Settings size={16} className="text-amber-500" />}>
        <p className="text-[10px] text-slate-400 mb-3">
          Las categorias ayudan a las tiendas a clasificar tu app.
        </p>
        <div className="flex flex-wrap gap-2">
          {["finance", "business", "productivity", "utilities", "lifestyle", "education"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                const cats = config.categorias.includes(cat)
                  ? config.categorias.filter((c) => c !== cat)
                  : [...config.categorias, cat];
                actualizarCampo("categorias", cats);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                config.categorias.includes(cat)
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* JSON Preview */}
      <SectionCard title="Vista Previa del Manifest" icon={<Settings size={16} className="text-slate-500" />}>
        <pre className="bg-slate-900 text-slate-300 rounded-xl p-4 text-[10px] overflow-x-auto font-mono leading-relaxed">
{`{
  "name": "${config.nombreApp}",
  "short_name": "${config.shortName}",
  "description": "${config.descripcion}",
  "start_url": "${config.startUrl}",
  "display": "${config.displayMode}",
  "orientation": "${config.orientation}",
  "theme_color": "${config.themeColor}",
  "background_color": "${config.backgroundColor}",
  "scope": "${config.scope}",
  "lang": "es",
  "categories": ${JSON.stringify(config.categorias)}
}`}
        </pre>
      </SectionCard>
    </div>
  );
}
