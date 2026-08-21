"use client";

import { useState, useEffect, useCallback } from "react";

export function useTareaCount() {
  const [count, setCount] = useState(0);

  const cargarCount = useCallback(async () => {
    try {
      // Se pide el numero, no la tabla. El filtro por estado lo hace la base:
      // traer todas las tareas para contarlas en el navegador movia medio mega
      // en cada sondeo, desde todas las paginas del panel.
      const response = await fetch("/api/tareas?soloConteo=pendientes", {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && typeof data.count === "number") {
        setCount(data.count);
      }
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void cargarCount(), 0);
    const interval = setInterval(cargarCount, 30000);
    return () => {
      window.clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [cargarCount]);

  return count;
}
