/**
 * Hooks del módulo Automatización
 */

import { useState, useEffect } from "react";
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
