/**
 * Hooks del módulo Reportes
 */

import { useState } from "react";
import { generarReportePipeline, generarReporteConversion, generarReporteEjecutivos } from "./servicios";

export function useReportePipeline() {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const result = await generarReportePipeline();
      setDatos(result);
    } catch (err) {
      console.error("Error generando reporte:", err);
    } finally {
      setCargando(false);
    }
  };

  return { datos, cargando, cargar };
}

export function useReporteConversion() {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const result = await generarReporteConversion();
      setDatos(result);
    } catch (err) {
      console.error("Error generando reporte:", err);
    } finally {
      setCargando(false);
    }
  };

  return { datos, cargando, cargar };
}

export function useReporteEjecutivos() {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const result = await generarReporteEjecutivos();
      setDatos(result);
    } catch (err) {
      console.error("Error generando reporte:", err);
    } finally {
      setCargando(false);
    }
  };

  return { datos, cargando, cargar };
}
