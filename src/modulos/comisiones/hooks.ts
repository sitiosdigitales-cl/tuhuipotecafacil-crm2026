/**
 * Hooks del módulo Comisiones
 */

import { useState, useEffect } from "react";
import { obtenerComisiones } from "./servicios";

export function useComisiones() {
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const result = await obtenerComisiones();
        if (result.success) setComisiones(result.data);
      } catch (err) {
        console.error("Error cargando comisiones:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return { comisiones, setComisiones, cargando };
}
