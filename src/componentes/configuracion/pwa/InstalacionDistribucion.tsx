"use client";

import { useState } from "react";
import { Download, QrCode, Plus, Trash2, ExternalLink, Link, Edit3, Check } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";

interface InstalacionDistribucionProps {
  config: PWAConfig;
  actualizarCampo: <K extends keyof PWAConfig>(campo: K, valor: PWAConfig[K]) => void;
  exportarConfig: () => void;
  importarConfig: (json: string) => boolean;
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

// Simple QR code generator using SVG
function QRCodeSVG({ value, size = 150 }: { value: string; size?: number }) {
  // Simple hash-based QR-like pattern for visual representation
  const hash = Array.from(value).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  const modules = 21;
  const cellSize = size / modules;
  const cells: boolean[][] = [];

  for (let y = 0; y < modules; y++) {
    cells[y] = [];
    for (let x = 0; x < modules; x++) {
      // Finder patterns (corners)
      const inFinderTL = x < 7 && y < 7;
      const inFinderTR = x >= modules - 7 && y < 7;
      const inFinderBL = x < 7 && y >= modules - 7;

      if (inFinderTL || inFinderTR || inFinderBL) {
        const fx = inFinderTL ? x : inFinderTR ? x - (modules - 7) : x;
        const fy = inFinderTL ? y : inFinderTR ? y : y - (modules - 7);
        cells[y][x] = fx === 0 || fx === 6 || fy === 0 || fy === 6 ||
          (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else {
        // Pseudo-random pattern based on hash
        const seed = (hash + x * 31 + y * 17) & 0xFFFF;
        cells[y][x] = seed % 3 !== 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1E293B"
              rx={0.5}
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function InstalacionDistribucion({ config, actualizarCampo, exportarConfig, importarConfig }: InstalacionDistribucionProps) {
  const [editandoShortcut, setEditandoShortcut] = useState<number | null>(null);
  const [nuevoShortcut, setNuevoShortcut] = useState({ name: "", shortName: "", url: "/", icon: "" });
  const [importJson, setImportJson] = useState("");
  const [importado, setImportado] = useState(false);

  const agregarShortcut = () => {
    if (nuevoShortcut.name && nuevoShortcut.url) {
      actualizarCampo("shortcuts", [
        ...config.shortcuts,
        { ...nuevoShortcut, icon: null },
      ]);
      setNuevoShortcut({ name: "", shortName: "", url: "/", icon: "" });
    }
  };

  const eliminarShortcut = (index: number) => {
    actualizarCampo("shortcuts", config.shortcuts.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    const success = importarConfig(importJson);
    setImportado(success);
    if (success) setImportJson("");
    setTimeout(() => setImportado(false), 2000);
  };

  const installUrl = typeof window !== "undefined" ? window.location.origin : "https://tuhipotecafacil.cl";

  return (
    <div className="space-y-5">
      {/* Install Banner */}
      <SectionCard title="Banner de Instalacion" icon={<Download size={16} className="text-blue-500" />}>
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Download size={14} className="text-blue-500" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700">Mostrar banner de instalacion</div>
              <div className="text-[10px] text-slate-400">Prompt automatico para instalar la PWA</div>
            </div>
          </div>
          <button
            onClick={() => actualizarCampo("installBanner", !config.installBanner)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              config.installBanner ? "bg-blue-500" : "bg-slate-300"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
              config.installBanner ? "translate-x-6" : "translate-x-0.5"
            }`} />
          </button>
        </div>
      </SectionCard>

      {/* QR Code */}
      <SectionCard title="QR Code de Instalacion" icon={<QrCode size={16} className="text-purple-500" />}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={installUrl} size={150} />
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-[11px] text-slate-500">
              Escanea este codigo QR para instalar la app desde un movil.
            </p>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <Link size={12} className="text-slate-400" />
              <span className="text-[11px] text-slate-600 font-mono flex-1 truncate">{installUrl}</span>
              <button
                onClick={() => navigator.clipboard.writeText(installUrl)}
                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Shortcuts */}
      <SectionCard title="Atajos (Shortcuts)" icon={<Link size={16} className="text-emerald-500" />}>
        <p className="text-[10px] text-slate-400 mb-3">
          Los atajos aparecen cuando el usuario mantiene presionado el icono de la app.
        </p>
        <div className="space-y-2">
          {config.shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-slate-50/80 rounded-xl">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                <Link size={12} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-slate-700">{shortcut.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{shortcut.url}</div>
              </div>
              <button
                onClick={() => eliminarShortcut(index)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add new shortcut */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={nuevoShortcut.name}
                onChange={(e) => setNuevoShortcut({ ...nuevoShortcut, name: e.target.value })}
                className="h-9 px-3 bg-white border border-slate-200/60 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                placeholder="Nombre"
              />
              <input
                type="text"
                value={nuevoShortcut.url}
                onChange={(e) => setNuevoShortcut({ ...nuevoShortcut, url: e.target.value })}
                className="h-9 px-3 bg-white border border-slate-200/60 rounded-lg text-[11px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                placeholder="/ruta"
              />
            </div>
            <button
              onClick={agregarShortcut}
              disabled={!nuevoShortcut.name}
              className="w-full h-9 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Agregar Atajo
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Export / Import */}
      <SectionCard title="Exportar / Importar Configuracion" icon={<Download size={16} className="text-amber-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">Exporta la configuracion PWA como archivo JSON para respaldarla o transferirla a otro entorno.</p>
            <button
              onClick={exportarConfig}
              className="w-full h-10 bg-blue-500 text-white rounded-xl text-[12px] font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} /> Exportar Config JSON
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">Importa una configuracion PWA desde un archivo JSON previamente exportado.</p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[10px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all resize-none"
              placeholder='Pega el JSON aqui...'
            />
            <button
              onClick={handleImport}
              disabled={!importJson.trim()}
              className={`w-full h-10 rounded-xl text-[12px] font-medium transition-colors flex items-center justify-center gap-2 ${
                importado
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {importado ? <><Check size={14} /> Importado!</> : "Importar Config"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
