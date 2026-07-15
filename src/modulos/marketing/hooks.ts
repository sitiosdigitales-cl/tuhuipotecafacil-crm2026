/**
 * Hooks del módulo Marketing
 */

import { useState, useEffect } from "react";
import { obtenerCampanas, obtenerLandings, obtenerBiblioteca } from "./servicios";

export function useCampanas() {
  const [campanas, setCampanas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerCampanas();
        if (result.success) setCampanas(result.data);
      } catch (err) {
        console.error("Error cargando campañas:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { campanas, setCampanas, cargando };
}

export function useLandings() {
  const [landings, setLandings] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerLandings();
        if (result.success) setLandings(result.data);
      } catch (err) {
        console.error("Error cargando landings:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { landings, setLandings, cargando };
}

export function useBiblioteca() {
  const [recursos, setRecursos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerBiblioteca();
        if (result.success) setRecursos(result.data);
      } catch (err) {
        console.error("Error cargando biblioteca:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { recursos, setRecursos, cargando };
}
