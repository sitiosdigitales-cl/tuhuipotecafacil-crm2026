"use client";

import type { EtapaPipeline } from "@/tipos";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Database, Settings } from "lucide-react";
import { TabNotificaciones } from "./_components/tab-notificaciones";
import { TabPipeline } from "./_components/tab-pipeline";
import { TabSistema } from "./_components/tab-sistema";

type TabConfig = "notificaciones" | "pipeline" | "sistema";

const tabs: { id: TabConfig; label: string; icono: React.ReactNode }[] = [
  { id: "notificaciones", label: "Notificaciones", icono: <Bell size={16} /> },
  { id: "pipeline", label: "Pipeline", icono: <Settings size={16} /> },
  { id: "sistema", label: "Sistema", icono: <Database size={16} /> },
];

function ConfiguracionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tabActiva, setTabActiva] = useState<TabConfig>(
    tabs.some((tab) => tab.id === requestedTab)
      ? (requestedTab as TabConfig)
      : "notificaciones"
  );
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([]);
  const [cargandoEtapas, setCargandoEtapas] = useState(true);

  useEffect(() => {
    async function cargarEtapas() {
      try {
        const response = await fetch("/api/pipeline/stages");
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          setEtapas(result.data);
        }
      } catch {
        setEtapas([]);
      } finally {
        setCargandoEtapas(false);
      }
    }

    void cargarEtapas();
  }, []);

  const handleTabChange = (tab: TabConfig) => {
    setTabActiva(tab);
    router.replace(`/configuracion?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <h1 className="mb-1 text-xl font-bold tracking-tight">
            Configuracion del Sistema
          </h1>
          <p className="text-[11px] font-medium text-slate-300">
            Administra preferencias persistidas y consulta el estado operativo
          </p>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="hidden w-56 flex-shrink-0 md:block">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-soft">
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[12px] font-semibold transition-all ${
                    tabActiva === tab.id
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <span
                    className={
                      tabActiva === tab.id
                        ? "text-purple-500"
                        : "text-slate-400"
                    }
                  >
                    {tab.icono}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-medium">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-semibold transition-all ${
                    tabActiva === tab.id
                      ? "bg-purple-500 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.icono}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {tabActiva === "notificaciones" && <TabNotificaciones />}
          {tabActiva === "pipeline" && (
            <TabPipeline
              etapas={etapas}
              setEtapas={setEtapas}
              cargandoEtapas={cargandoEtapas}
            />
          )}
          {tabActiva === "sistema" && <TabSistema />}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      }
    >
      <ConfiguracionContent />
    </Suspense>
  );
}
