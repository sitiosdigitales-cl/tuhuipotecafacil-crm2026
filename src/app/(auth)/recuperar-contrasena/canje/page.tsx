"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Home, Loader2 } from "lucide-react";

/**
 * Destino del enlace del correo. El token llega en el fragmento
 * (`#token=…`), que el navegador NO manda al servidor: no entra a los logs de
 * acceso ni viaja en Referer. Esta página lo saca de la barra de direcciones
 * con `history.replaceState` antes de nada más, y lo entrega al servidor por
 * POST para cambiarlo por la cookie httpOnly del canje.
 */
export default function CanjeRecuperacionPage() {
  const router = useRouter();
  // El efecto corre dos veces en desarrollo con StrictMode. Sin esta guarda, el
  // segundo pase encontraría el fragmento ya limpio y anularía el canje del
  // primero. El token es de un solo uso: no hay segunda oportunidad.
  const yaCanjeado = useRef(false);

  useEffect(() => {
    if (yaCanjeado.current) return;
    yaCanjeado.current = true;

    const fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = fragmento.get("token");

    // Primero limpiar, después usar. Si el canje falla, el token igual tiene
    // que haber desaparecido de la barra de direcciones y del historial.
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      router.replace("/recuperar-contrasena?estado=invalido");
      return;
    }

    void fetch("/api/auth/recuperacion/callback", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json().catch(() => null);
        if (!respuesta.ok || !cuerpo?.success) {
          router.replace("/recuperar-contrasena?estado=invalido");
          return;
        }
        router.replace("/recuperar-contrasena/nueva");
      })
      .catch(() => {
        router.replace("/recuperar-contrasena?estado=invalido");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <Home size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Comprobando el enlace
        </h1>
        <div className="flex items-center justify-center gap-2 text-blue-200/70 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Un momento…
        </div>
      </div>
    </div>
  );
}
