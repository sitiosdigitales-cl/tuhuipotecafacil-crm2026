"use client";

import { useState, useEffect, useCallback } from "react";

export function useTareaCount() {
  const [count, setCount] = useState(0);

  const cargarCount = useCallback(async () => {
    try {
      const response = await fetch("/api/tareas", { credentials: "include" });
      const data = await response.json();
      if (data.success && data.data) {
        const pendientes = data.data.filter(
          (t: { estado: string }) => t.estado === "PENDIENTE" || t.estado === "EN_PROGRESO" || t.estado === "VENCIDA"
        );
        setCount(pendientes.length);
      }
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    cargarCount();
    const interval = setInterval(cargarCount, 30000);
    return () => clearInterval(interval);
  }, [cargarCount]);

  return count;
}
