"use client";

import { useFlujoHistorial } from "@/modulos/automatizacion/hooks";
import type {
  AccionEjecutada,
  EjecucionAutomatizacion,
} from "@/modulos/automatizacion/tipos";

interface FlujoHistorialProps {
  flujoId: string;
}

function esAccionEjecutada(valor: unknown): valor is AccionEjecutada {
  if (!valor || typeof valor !== "object") return false;
  const accion = valor as Record<string, unknown>;
  return typeof accion.tipo === "string" && typeof accion.estado === "string";
}

function parseAccionesEjecutadas(
  valor: EjecucionAutomatizacion["accionesEjecutadas"]
): AccionEjecutada[] {
  if (Array.isArray(valor)) return valor.filter(esAccionEjecutada);
  if (!valor) return [];
  try {
    const resultado: unknown = JSON.parse(valor);
    return Array.isArray(resultado) ? resultado.filter(esAccionEjecutada) : [];
  } catch {
    return [];
  }
}

export function FlujoHistorial({ flujoId }: FlujoHistorialProps) {
  const { historial, stats, cargando, pagina, setPagina, total } = useFlujoHistorial(flujoId);

  if (cargando) {
    return <div className="text-center py-8 text-[11px] text-slate-400">Cargando historial...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-slate-700">{stats.total}</div>
            <div className="text-[10px] text-slate-400">Total</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-700">{stats.exitosas}</div>
            <div className="text-[10px] text-emerald-500">Exitosas</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-700">{stats.fallidas}</div>
            <div className="text-[10px] text-red-500">Fallidas</div>
          </div>
          <div className="bg-violet-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-violet-700">{stats.tasaExito}%</div>
            <div className="text-[10px] text-violet-500">Exito</div>
          </div>
        </div>
      )}

      {/* Lista */}
      {historial.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[11px] text-slate-400">No hay ejecuciones registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {historial.map((ejecucion) => {
            const accionesEjecutadas = parseAccionesEjecutadas(ejecucion.accionesEjecutadas);
            return (
              <div key={ejecucion.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ejecucion.estado === "EXITOSO" ? "bg-emerald-100 text-emerald-700" :
                      ejecucion.estado === "FALLIDO" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {ejecucion.estado}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">{ejecucion.leadNombre || "Sin lead"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ejecucion.ejecutadoEn || ejecucion.ejecutado_en || 0).toLocaleString("es-CL")}
                  </span>
                </div>
                {accionesEjecutadas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {accionesEjecutadas.map((accion, idx) => (
                      <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded ${
                        accion.estado === "EXITOSO" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                        {accion.tipo}: {accion.estado}
                      </span>
                    ))}
                  </div>
                )}
                {ejecucion.errorMensaje && (
                  <p className="text-[10px] text-red-500 mt-1">{ejecucion.errorMensaje}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginacion */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-3 py-1 text-[10px] font-semibold bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-[10px] text-slate-400">Pagina {pagina}</span>
          <button
            onClick={() => setPagina((p) => p + 1)}
            disabled={historial.length < 20}
            className="px-3 py-1 text-[10px] font-semibold bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
