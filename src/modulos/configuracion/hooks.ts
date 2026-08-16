/**
 * Hooks del módulo Configuración
 */

import { useState, useEffect } from "react";
import { obtenerIntegraciones } from "./servicios";
import type { Integracion } from "./servicios";

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
