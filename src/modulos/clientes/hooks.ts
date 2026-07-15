/**
 * Hooks del módulo Clientes
 */

import { useState, useEffect } from "react";
import { obtenerClientePorId, obtenerDocumentosCliente } from "./servicios";

/**
 * Hook para cargar datos del cliente
 * @param leadId - ID del lead/cliente
 */
export function useCliente(leadId: string | null) {
  const [cliente, setCliente] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      setCargando(false);
      return;
    }

    async function cargarCliente() {
      try {
        setCargando(true);
        const result = await obtenerClientePorId(leadId as string);
        if (result.success) {
          setCliente(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar cliente");
      } finally {
        setCargando(false);
      }
    }

    cargarCliente();
  }, [leadId]);

  return { cliente, cargando, error, setCliente };
}

/**
 * Hook para documentos del cliente
 * @param leadId - ID del lead/cliente
 */
export function useDocumentosCliente(leadId: string | null) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!leadId) {
      setCargando(false);
      return;
    }

    async function cargarDocumentos() {
      try {
        setCargando(true);
        const result = await obtenerDocumentosCliente(leadId as string);
        if (result.success) {
          setDocumentos(result.data);
        }
      } catch (err) {
        console.error("Error cargando documentos:", err);
      } finally {
        setCargando(false);
      }
    }

    cargarDocumentos();
  }, [leadId]);

  const documentosAprobados = documentos.filter(
    (d) => d.estado === "APROBADO" || d.estado === "RECIBIDO"
  ).length;

  const documentosPendientes = documentos.length - documentosAprobados;

  return {
    documentos,
    setDocumentos,
    cargando,
    documentosAprobados,
    documentosPendientes,
    totalDocumentos: documentos.length,
  };
}
