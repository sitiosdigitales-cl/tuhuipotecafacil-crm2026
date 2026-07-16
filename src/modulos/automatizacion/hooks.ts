/**
 * Hooks del módulo Automatización
 */

import { useState, useEffect, useCallback } from "react";
import { obtenerFlujos, obtenerTriggers, obtenerPlantillas } from "./servicios";

export function useFlujos() {
  const [flujos, setFlujos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerFlujos();
        if (result.success) setFlujos(result.data);
      } catch (err) {
        console.error("Error cargando flujos:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { flujos, setFlujos, cargando };
}

export function useTriggers() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerTriggers();
        if (result.success) setTriggers(result.data);
      } catch (err) {
        console.error("Error cargando triggers:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { triggers, setTriggers, cargando };
}

export function usePlantillas() {
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerPlantillas();
        if (result.success) setPlantillas(result.data);
      } catch (err) {
        console.error("Error cargando plantillas:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { plantillas, setPlantillas, cargando };
}

export function useTriggerHistorial(triggerId: string | null) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    exitosas: number;
    fallidas: number;
    parciales: number;
    tasaExito: number;
  } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    if (!triggerId) {
      setHistorial([]);
      setStats(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`/api/triggers/${triggerId}/historial?page=${pagina}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setHistorial(json.data);
        setStats(json.stats);
        setTotal(json.total);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setCargando(false);
    }
  }, [triggerId, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return {
    historial,
    stats,
    cargando,
    pagina,
    setPagina,
    total,
    recargar: cargar,
  };
}