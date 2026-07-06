"use client";

import { ImageIcon, Download } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";
import { IconUploader } from "./IconUploader";

interface IconosAssetsProps {
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

const ICON_SIZES = [
  { key: "icon192" as const, label: "Android / Chrome", size: "192x192", desc: "Icono principal para Android y Chrome" },
  { key: "icon512" as const, label: "Splash / Instalacion", size: "512x512", desc: "Icono grande para splash y prompt de instalacion" },
  { key: "maskableIcon" as const, label: "Maskable", size: "512x512", desc: "Icono adaptativo con zona segura para Android" },
  { key: "appleTouchIcon" as const, label: "Apple Touch", size: "180x180", desc: "Icono para iOS cuando se agrega al home screen" },
];

const FAVICON_SIZES = [
  { key: "favicon16" as const, label: "Favicon 16px", size: "16x16" },
  { key: "favicon32" as const, label: "Favicon 32px", size: "32x32" },
];

export function IconosAssets({ config, actualizarCampo }: IconosAssetsProps) {
  return (
    <div className="space-y-5">
      {/* Iconos principales */}
      <SectionCard title="Iconos de la App" icon={<ImageIcon size={16} className="text-blue-500" />}>
        <p className="text-[11px] text-slate-500 mb-4">
          Sube iconos en formato PNG con fondo transparente. Se generaran automaticamente los tamanos requeridos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ICON_SIZES.map((icon) => (
            <IconUploader
              key={icon.key}
              label={icon.label}
              sublabel={`${icon.size} - ${icon.desc}`}
              value={config[icon.key]}
              onChange={(v) => actualizarCampo(icon.key, v)}
              size={90}
            />
          ))}
        </div>
      </SectionCard>

      {/* Favicons */}
      <SectionCard title="Favicons" icon={<ImageIcon size={16} className="text-purple-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FAVICON_SIZES.map((icon) => (
            <IconUploader
              key={icon.key}
              label={icon.label}
              sublabel={icon.size}
              value={config[icon.key]}
              onChange={(v) => actualizarCampo(icon.key, v)}
              size={50}
            />
          ))}
        </div>
      </SectionCard>

      {/* Screenshots */}
      <SectionCard title="Screenshots" icon={<ImageIcon size={16} className="text-emerald-500" />}>
        <p className="text-[11px] text-slate-500 mb-4">
          Las screenshots se muestran en el prompt de instalacion de la PWA y en tiendas de apps.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <IconUploader
            label="Screenshot Wide (landscape)"
            sublabel="1280x720 - Se muestra en pantallas grandes"
            value={config.screenshotWide}
            onChange={(v) => actualizarCampo("screenshotWide", v)}
            size={120}
          />
          <IconUploader
            label="Screenshot Narrow (portrait)"
            sublabel="720x1280 - Se muestra en moviles"
            value={config.screenshotNarrow}
            onChange={(v) => actualizarCampo("screenshotNarrow", v)}
            size={120}
          />
        </div>
      </SectionCard>

      {/* Preview de tamanos */}
      <SectionCard title="Vista Previa de Iconos" icon={<ImageIcon size={16} className="text-amber-500" />}>
        <div className="flex items-end gap-4 flex-wrap">
          {[
            { size: 16, label: "16px", key: "favicon16" as const },
            { size: 32, label: "32px", key: "favicon32" as const },
            { size: 48, label: "48px", key: "appleTouchIcon" as const },
            { size: 64, label: "64px", key: "icon192" as const },
            { size: 96, label: "96px", key: "icon192" as const },
            { size: 128, label: "128px", key: "icon512" as const },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div
                className="bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200"
                style={{ width: item.size, height: item.size }}
              >
                {config[item.key] ? (
                  <img src={config[item.key]!} alt="" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon size={item.size * 0.4} className="text-slate-300" />
                )}
              </div>
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
