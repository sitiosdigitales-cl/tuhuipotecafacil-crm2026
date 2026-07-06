"use client";

import { useState } from "react";
import { Wifi, WifiOff, Bell, Plus, Trash2, RefreshCw, Database } from "lucide-react";
import { PWAConfig } from "@/tipos/pwa-config";

interface ServiceWorkerConfigProps {
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

const CACHE_STRATEGIES = [
  { value: "cache-first", label: "Cache First", desc: "Busca en cache primero, si no existe va a la red. Rapido pero puede mostrar contenido desactualizado." },
  { value: "network-first", label: "Network First", desc: "Va a la red primero, si falla usa el cache. Siempre muestra contenido actualizado." },
  { value: "stale-while-revalidate", label: "Stale While Revalidate", desc: "Muestra cache inmediatamente y actualiza en segundo plano. Balance entre rapidez y actualizacion." },
];

export function ServiceWorkerConfig({ config, actualizarCampo }: ServiceWorkerConfigProps) {
  const [nuevaUrl, setNuevaUrl] = useState("");

  const agregarUrl = () => {
    if (nuevaUrl.trim() && !config.precacheUrls.includes(nuevaUrl.trim())) {
      actualizarCampo("precacheUrls", [...config.precacheUrls, nuevaUrl.trim()]);
      setNuevaUrl("");
    }
  };

  const eliminarUrl = (url: string) => {
    actualizarCampo("precacheUrls", config.precacheUrls.filter((u) => u !== url));
  };

  return (
    <div className="space-y-5">
      {/* Estrategia de Cache */}
      <SectionCard title="Estrategia de Cache" icon={<Database size={16} className="text-blue-500" />}>
        <div className="space-y-2">
          {CACHE_STRATEGIES.map((strategy) => (
            <button
              key={strategy.value}
              onClick={() => actualizarCampo("cacheStrategy", strategy.value as PWAConfig["cacheStrategy"])}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                config.cacheStrategy === strategy.value
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold text-slate-700">{strategy.label}</div>
                {config.cacheStrategy === strategy.value && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{strategy.desc}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Offline y Push */}
      <SectionCard title="Funcionalidad Offline" icon={<WifiOff size={16} className="text-amber-500" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <WifiOff size={14} className="text-amber-500" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-700">Pagina offline</div>
                <div className="text-[10px] text-slate-400">Mostrar pagina personalizada cuando no hay conexion</div>
              </div>
            </div>
            <button
              onClick={() => actualizarCampo("offlineActivo", !config.offlineActivo)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config.offlineActivo ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                config.offlineActivo ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Bell size={14} className="text-blue-500" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-700">Push Notifications</div>
                <div className="text-[10px] text-slate-400">Enviar notificaciones push a los usuarios</div>
              </div>
            </div>
            <button
              onClick={() => actualizarCampo("pushNotifications", !config.pushNotifications)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config.pushNotifications ? "bg-blue-500" : "bg-slate-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                config.pushNotifications ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* VAPID Key */}
      {config.pushNotifications && (
        <SectionCard title="Clave VAPID" icon={<Bell size={16} className="text-purple-500" />}>
          <Field label="VAPID Public Key">
            <div className="flex gap-2">
              <input
                type="text"
                value={config.vapidKey}
                onChange={(e) => actualizarCampo("vapidKey", e.target.value)}
                className="flex-1 h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                placeholder="Tu clave publica VAPID..."
              />
              <button
                onClick={() => navigator.clipboard.writeText(config.vapidKey)}
                className="h-10 px-3 bg-slate-100 rounded-xl text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Copiar
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Genera tu clave en <span className="font-mono">web-push-codelab.appspot.com</span>
            </p>
          </Field>
        </SectionCard>
      )}

      {/* Precache URLs */}
      <SectionCard title="URLs en Cache" icon={<Database size={16} className="text-emerald-500" />}>
        <p className="text-[10px] text-slate-400 mb-3">
          Estas URLs se precargan cuando el usuario instala la PWA. Mantenlas al minimo para mejor performance.
        </p>
        <div className="space-y-2">
          {config.precacheUrls.map((url) => (
            <div key={url} className="flex items-center gap-2 p-2 bg-slate-50/80 rounded-lg">
              <Wifi size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-600 font-mono flex-1">{url}</span>
              <button
                onClick={() => eliminarUrl(url)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaUrl}
              onChange={(e) => setNuevaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarUrl()}
              className="flex-1 h-9 px-3 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="/nueva-ruta"
            />
            <button
              onClick={agregarUrl}
              disabled={!nuevaUrl.trim()}
              className="h-9 px-3 bg-blue-500 text-white rounded-xl text-[11px] font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Version del Cache */}
      <SectionCard title="Versionado" icon={<RefreshCw size={16} className="text-indigo-500" />}>
        <Field label="Version del Cache">
          <div className="flex gap-2">
            <input
              type="text"
              value={config.cacheVersion}
              onChange={(e) => actualizarCampo("cacheVersion", e.target.value)}
              className="flex-1 h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
              placeholder="v1"
            />
            <button
              onClick={() => {
                const match = config.cacheVersion.match(/v(\d+)/);
                const num = match ? parseInt(match[1]) + 1 : 1;
                actualizarCampo("cacheVersion", `v${num}`);
              }}
              className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} /> Incrementar
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cambia la version para forzar a los usuarios a descargar una nueva version de la cache.
          </p>
        </Field>
      </SectionCard>
    </div>
  );
}
