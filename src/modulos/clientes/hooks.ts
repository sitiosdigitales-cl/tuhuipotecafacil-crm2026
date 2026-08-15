/**
 * Hooks del módulo Clientes
 */

import { useState, useEffect } from "react";
import { obtenerClientePorId, obtenerDocumentosCliente } from "./servicios";
import type { DocumentoCliente } from "./servicios";
import type { LeadApi } from "../leads/servicios";

/**
 * Hook para cargar datos del cliente
 * @param leadId - ID del lead/cliente
 */
export function useCliente(leadId: string | null) {
  const [cliente, setCliente] = useState<LeadApi | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarCliente(idActual: string) {
      try {
        setCargando(true);
        const result = await obtenerClientePorId(idActual);
        if (result.success) {
          setCliente(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar cliente");
      } finally {
        setCargando(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (!leadId) {
        setCliente(null);
        setCargando(false);
        return;
      }
      void cargarCliente(leadId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [leadId]);

  return { cliente, cargando, error, setCliente };
}

/**
 * Hook para documentos del cliente
 * @param leadId - ID del lead/cliente
 */
export function useDocumentosCliente(leadId: string | null) {
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDocumentos(idActual: string) {
      try {
        setCargando(true);
        const result = await obtenerDocumentosCliente(idActual);
        if (result.success) {
          setDocumentos(result.data);
        }
      } catch (err) {
        console.error("Error cargando documentos:", err);
      } finally {
        setCargando(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (!leadId) {
        setDocumentos([]);
        setCargando(false);
        return;
      }
      void cargarDocumentos(leadId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
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
