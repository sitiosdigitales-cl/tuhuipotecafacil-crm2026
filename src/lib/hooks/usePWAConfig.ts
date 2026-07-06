"use client";

import { useState, useCallback, useEffect } from "react";
import { PWAConfig, PWA_CONFIG_DEFAULT } from "@/tipos/pwa-config";

const STORAGE_KEY = "crm_pwa_config";

function cargarConfig(): PWAConfig {
  if (typeof window === "undefined") return PWA_CONFIG_DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PWA_CONFIG_DEFAULT;
    return { ...PWA_CONFIG_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return PWA_CONFIG_DEFAULT;
  }
}

function guardarConfig(config: PWAConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function usePWAConfig() {
  const [config, setConfig] = useState<PWAConfig>(PWA_CONFIG_DEFAULT);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setConfig(cargarConfig()); // eslint-disable-line react-hooks/set-state-in-effect -- Inicializacion de config desde localStorage
    setCargado(true);
  }, []);

  const actualizarConfig = useCallback((nuevaConfig: PWAConfig) => {
    setConfig(nuevaConfig);
    guardarConfig(nuevaConfig);
  }, []);

  const actualizarCampo = useCallback(<K extends keyof PWAConfig>(campo: K, valor: PWAConfig[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [campo]: valor };
      guardarConfig(next);
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(PWA_CONFIG_DEFAULT);
    guardarConfig(PWA_CONFIG_DEFAULT);
  }, []);

  const exportarConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pwa-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const importarConfig = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      const merged = { ...PWA_CONFIG_DEFAULT, ...parsed };
      setConfig(merged);
      guardarConfig(merged);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    config,
    cargado,
    actualizarConfig,
    actualizarCampo,
    resetConfig,
    exportarConfig,
    importarConfig,
  };
}
