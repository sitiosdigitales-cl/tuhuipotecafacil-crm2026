/**
 * Hooks del mÃ³dulo AutomatizaciÃ³n
 */

import { useState, useEffect, useCallback } from "react";
import { obtenerFlujos, obtenerTriggers, obtenerPlantillas } from "./servicios";
import type {
  EjecucionAutomatizacion,
  EstadisticasAutomatizacion,
  FlujoAutomatizacion,
  PlantillaAutomatizacion,
  TriggerAutomatizacion,
} from "./tipos";

interface RespuestaHistorial {
  success: boolean;
  data?: EjecucionAutomatizacion[];
  stats?: EstadisticasAutomatizacion;
  total?: number;
}

export function useFlujos() {
  const [flujos, setFlujos] = useState<FlujoAutomatizacion[]>([]);
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
  const [triggers, setTriggers] = useState<TriggerAutomatizacion[]>([]);
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
  const [plantillas, setPlantillas] = useState<PlantillaAutomatizacion[]>([]);
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
  const [historial, setHistorial] = useState<EjecucionAutomatizacion[]>([]);
  const [stats, setStats] = useState<EstadisticasAutomatizacion | null>(null);
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
      const json: RespuestaHistorial = await res.json();
      if (json.success) {
        setHistorial(json.data ?? []);
        setStats(json.stats ?? null);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setCargando(false);
    }
  }, [triggerId, pagina]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(timeoutId);
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
export function useFlujoHistorial(flujoId: string | null) {
  const [historial, setHistorial] = useState<EjecucionAutomatizacion[]>([]);
  const [stats, setStats] = useState<EstadisticasAutomatizacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    if (!flujoId) {
      setHistorial([]);
      setStats(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`/api/flujos/${flujoId}/historial?page=${pagina}&limit=20`);
      const json: RespuestaHistorial = await res.json();
      if (json.success) {
        setHistorial(json.data ?? []);
        setStats(json.stats ?? null);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setCargando(false);
    }
  }, [flujoId, pagina]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(timeoutId);
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
