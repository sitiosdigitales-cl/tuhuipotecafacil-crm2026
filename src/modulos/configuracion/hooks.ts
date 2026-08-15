/**
 * Hooks del módulo Configuración
 */

import { useState, useEffect } from "react";
import { obtenerConfiguracion, obtenerIntegraciones } from "./servicios";
import type { ConfiguracionInput } from "./validaciones";
import type { Integracion } from "./servicios";

export function useConfiguracion() {
  const [config, setConfig] = useState<ConfiguracionInput | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerConfiguracion();
        if (result.success) setConfig(result.data);
      } catch (err) {
        console.error("Error cargando configuración:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { config, setConfig, cargando };
}

export function useIntegraciones() {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerIntegraciones();
        if (result.success) setIntegraciones(result.data);
      } catch (err) {
        console.error("Error cargando integraciones:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { integraciones, setIntegraciones, cargando };
}
