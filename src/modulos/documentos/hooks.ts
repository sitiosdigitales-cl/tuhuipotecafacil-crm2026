/**
 * Hooks del módulo Documentos
 */

import { useState, useEffect } from "react";
import { obtenerDocumentos, obtenerEstadisticasDocumentos } from "./servicios";
import type { EstadisticasDocumentos } from "./tipos";

/**
 * Hook para cargar documentos de un lead
 */
export function useDocumentos(leadId?: string) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerDocumentos(leadId);
        if (result.success) {
          setDocumentos(result.data);
        }
      } catch (err) {
        console.error("Error cargando documentos:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [leadId]);

  const documentosPorEstado = {
    pendientes: documentos.filter((d) => d.estado === "PENDIENTE").length,
    enRevision: documentos.filter((d) => d.estado === "EN_REVISION").length,
    aprobados: documentos.filter((d) => d.estado === "APROBADO").length,
    rechazados: documentos.filter((d) => d.estado === "RECHAZADO").length,
  };

  const porcentajeAprobados = documentos.length > 0
    ? Math.round((documentosPorEstado.aprobados / documentos.length) * 100)
    : 0;

  return {
    documentos,
    setDocumentos,
    cargando,
    documentosPorEstado,
    porcentajeAprobados,
    totalDocumentos: documentos.length,
  };
}

/**
 * Hook para estadísticas de documentos
 */
export function useEstadisticasDocumentos(leadId?: string) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasDocumentos | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerEstadisticasDocumentos(leadId);
        setEstadisticas(result);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [leadId]);

  return { estadisticas, cargando };
}
