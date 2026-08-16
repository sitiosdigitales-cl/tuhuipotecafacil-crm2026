"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TabPlantilla = "todas" | "email" | "whatsapp" | "sms" | "documento";

interface Plantilla {
  id: string;
  nombre: string;
  tipo: string;
  asunto?: string;
  contenido: string;
  categoria?: string;
  variables: string[];
  usos: number;
  creadoEn: Date | null;
}

interface PlantillaApi {
  id: string;
  nombre: string;
  tipo?: string;
  asunto?: string | null;
  contenido?: string;
  categoria?: string | null;
  variables?: unknown;
  usos?: unknown;
  creadoEn?: unknown;
}

const TIPO_CONFIG: Record<
  string,
  { label: string; color: string; background: string; icon: LucideIcon }
> = {
  EMAIL: {
    label: "Email",
    color: "text-blue-600",
    background: "bg-blue-50",
    icon: Mail,
  },
  WHATSAPP: {
    label: "WhatsApp",
    color: "text-green-600",
    background: "bg-green-50",
    icon: MessageSquare,
  },
  SMS: {
    label: "SMS",
    color: "text-purple-600",
    background: "bg-purple-50",
    icon: Smartphone,
  },
  DOCUMENTO: {
    label: "Documento",
    color: "text-amber-600",
    background: "bg-amber-50",
    icon: FileText,
  },
};

function normalizarPlantilla(plantilla: PlantillaApi): Plantilla {
  const fecha =
    typeof plantilla.creadoEn === "string" || plantilla.creadoEn instanceof Date
      ? new Date(plantilla.creadoEn)
      : null;

  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    tipo: plantilla.tipo ?? "EMAIL",
    asunto: plantilla.asunto ?? undefined,
    contenido: plantilla.contenido ?? "",
    categoria: plantilla.categoria ?? undefined,
    variables: Array.isArray(plantilla.variables)
      ? plantilla.variables.filter(
          (variable): variable is string => typeof variable === "string"
        )
      : [],
    usos:
      typeof plantilla.usos === "number" && Number.isFinite(plantilla.usos)
        ? plantilla.usos
        : 0,
    creadoEn: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
  };
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [tabActiva, setTabActiva] = useState<TabPlantilla>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const response = await fetch("/api/plantillas", {
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error("No se pudo cargar el catálogo");
        }
        setPlantillas((result.data as PlantillaApi[]).map(normalizarPlantilla));
      } catch {
        setPlantillas([]);
        setError("No se pudieron cargar las plantillas persistidas.");
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, []);

  const stats = useMemo(
    () => ({
      total: plantillas.length,
      usos: plantillas.reduce((total, plantilla) => total + plantilla.usos, 0),
      email: plantillas.filter((plantilla) => plantilla.tipo === "EMAIL").length,
      whatsapp: plantillas.filter(
        (plantilla) => plantilla.tipo === "WHATSAPP"
      ).length,
      sms: plantillas.filter((plantilla) => plantilla.tipo === "SMS").length,
      documento: plantillas.filter(
        (plantilla) => plantilla.tipo === "DOCUMENTO"
      ).length,
    }),
    [plantillas]
  );

  const plantillasFiltradas = useMemo(() => {
    const filtro = busqueda.trim().toLowerCase();
    return plantillas.filter((plantilla) => {
      const coincideTipo =
        tabActiva === "todas" || plantilla.tipo.toLowerCase() === tabActiva;
      const coincideTexto =
        !filtro ||
        plantilla.nombre.toLowerCase().includes(filtro) ||
        plantilla.categoria?.toLowerCase().includes(filtro);
      return coincideTipo && coincideTexto;
    });
  }, [busqueda, plantillas, tabActiva]);

  const plantillaPreview = plantillas.find(
    (plantilla) => plantilla.id === previewId
  );

  const tabs: Array<{
    id: TabPlantilla;
    label: string;
    count: number;
    icon?: LucideIcon;
  }> = [
    { id: "todas", label: "Todas", count: stats.total },
    { id: "email", label: "Email", count: stats.email, icon: Mail },
    {
      id: "whatsapp",
      label: "WhatsApp",
      count: stats.whatsapp,
      icon: MessageSquare,
    },
    { id: "sms", label: "SMS", count: stats.sms, icon: Smartphone },
    {
      id: "documento",
      label: "Documentos",
      count: stats.documento,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-1 text-xl font-bold tracking-tight">Plantillas</h1>
            <p className="text-[11px] font-medium text-emerald-100">
              Catálogo persistido de comunicaciones y documentos
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-emerald-100">Plantillas</div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.usos}</div>
              <div className="text-[10px] text-emerald-100">Usos registrados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
        <ShieldCheck className="mt-0.5 shrink-0" size={17} />
        <div>
          <p className="text-[12px] font-semibold">Catálogo en solo lectura</p>
          <p className="mt-1 text-[11px] leading-5 text-blue-700">
            Crear, editar y eliminar permanecerán ocultos hasta que el editor
            valide el contrato completo de la API y sus variables.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                    tabActiva === tab.id
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {TabIcon && <TabIcon size={12} />}
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Buscar plantilla..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="w-56 rounded-xl border border-slate-200/60 bg-slate-50 py-2 pl-9 pr-3 text-[11px] text-slate-600 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-[12px] text-red-700">
          {error}
        </div>
      ) : plantillasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-soft">
          <FileText className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-[12px] font-semibold text-slate-600">
            No hay plantillas para este filtro
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plantillasFiltradas.map((plantilla) => {
            const typeConfig = TIPO_CONFIG[plantilla.tipo] ?? TIPO_CONFIG.EMAIL;
            const TypeIcon = typeConfig.icon;
            return (
              <article
                key={plantilla.id}
                className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-soft"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeConfig.background}`}
                    >
                      <TypeIcon size={16} className={typeConfig.color} />
                    </div>
                    <div>
                      <h2 className="text-[12px] font-bold text-slate-800">
                        {plantilla.nombre}
                      </h2>
                      <p className={`text-[10px] font-semibold ${typeConfig.color}`}>
                        {typeConfig.label}
                        {plantilla.categoria ? ` · ${plantilla.categoria}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewId(plantilla.id)}
                    className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                    aria-label={`Ver ${plantilla.nombre}`}
                  >
                    <Eye size={14} />
                  </button>
                </div>

                <div className="mb-3 max-h-24 overflow-hidden rounded-xl bg-slate-50 p-3">
                  {plantilla.asunto && (
                    <p className="mb-2 truncate text-[11px] font-semibold text-slate-600">
                      {plantilla.asunto}
                    </p>
                  )}
                  <p className="line-clamp-3 whitespace-pre-wrap text-[11px] text-slate-500">
                    {plantilla.contenido.replace(/<[^>]*>/g, " ")}
                  </p>
                </div>

                {plantilla.variables.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {plantilla.variables.slice(0, 4).map((variable) => (
                      <span
                        key={variable}
                        className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] text-violet-600"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  <span>{plantilla.usos} usos</span>
                  <span>
                    {plantilla.creadoEn
                      ? plantilla.creadoEn.toLocaleDateString("es-CL")
                      : "Fecha no disponible"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {plantillaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {plantillaPreview.nombre}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Vista previa aislada con valores sintéticos
                </p>
              </div>
              <button
                onClick={() => setPreviewId(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Cerrar vista previa"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <PreviewPlantilla plantilla={plantillaPreview} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function reemplazarVariables(texto: string) {
  return texto
    .replaceAll("{{nombre}}", "Cliente")
    .replaceAll("{{apellido}}", "Ejemplo")
    .replaceAll("{{monto_credito}}", "$ 100.000.000")
    .replaceAll("{{tipo_credito}}", "Hipotecario")
    .replaceAll("{{ejecutivo}}", "Ejecutivo Demo")
    .replaceAll("{{empresa}}", "TuHipotecaFacil")
    .replaceAll("{{fecha}}", "16 agosto 2026");
}

export function PreviewPlantilla({
  plantilla,
}: {
  plantilla: {
    nombre: string;
    contenido: string;
    tipo: string;
    asunto?: string;
  };
}) {
  if (plantilla.tipo === "EMAIL") {
    const contenido = reemplazarVariables(plantilla.contenido);
    const documentoPreview = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:">
    <meta name="referrer" content="no-referrer">
    <style>body{font-family:Arial,sans-serif;margin:0;padding:16px;color:#334155;overflow-wrap:anywhere}</style>
  </head>
  <body>${contenido}</body>
</html>`;

    return (
      <div>
        {plantilla.asunto && (
          <div className="mb-4 rounded-xl bg-slate-50 p-4">
            <div className="mb-1 text-[10px] text-slate-400">Asunto:</div>
            <div className="text-[12px] font-semibold text-slate-700">
              {reemplazarVariables(plantilla.asunto)}
            </div>
          </div>
        )}
        <iframe
          title={`Vista previa de ${plantilla.nombre}`}
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={documentoPreview}
          className="h-[500px] w-full rounded-xl border border-slate-200 bg-white"
        />
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-sans text-[11px] leading-relaxed text-slate-600">
      {reemplazarVariables(plantilla.contenido)}
    </pre>
  );
}
