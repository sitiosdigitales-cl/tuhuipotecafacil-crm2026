"use client";

import { useEffect, useState } from "react";

export interface TasaBancoPublica {
  actualizadoEn: string;
  cae: number;
  color: string;
  id: string;
  nombre: string;
  tasa: number;
}

export function useTasasBancosPublicas() {
  const [bancos, setBancos] = useState<TasaBancoPublica[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/bancos/tasas-publicas", { signal: controller.signal })
      .then((response) => response.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setBancos(result.data);
      })
      .catch(() => undefined)
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, []);

  return { bancos, cargando };
}
