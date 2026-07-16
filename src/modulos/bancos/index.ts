import { useState, useEffect, useCallback } from "react";
import type { Banco } from "./types";

export function useBancos() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarBancos = useCallback(async () => {
    try {
      const res = await fetch("/api/bancos");
      const data = await res.json();
      if (data.success && data.data) {
        setBancos(data.data);
      }
    } catch {
      setBancos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarBancos(); }, [cargarBancos]);

  const crearBanco = async (banco: Omit<Banco, "id">) => {
    const res = await fetch("/api/bancos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banco),
    });
    const data = await res.json();
    if (data.success && data.data) {
      setBancos((prev) => [...prev, data.data]);
      return data.data;
    }
    return null;
  };

  const actualizarBanco = async (id: string, updates: Partial<Banco>) => {
    const res = await fetch(`/api/bancos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success && data.data) {
      setBancos((prev) => prev.map((b) => (b.id === id ? data.data : b)));
      return data.data;
    }
    return null;
  };

  const eliminarBanco = async (id: string) => {
    const res = await fetch(`/api/bancos/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setBancos((prev) => prev.filter((b) => b.id !== id));
    }
    return data.success;
  };

  return { bancos, cargando, crearBanco, actualizarBanco, eliminarBanco, recargar: cargarBancos };
}

export type { Banco } from "./types";