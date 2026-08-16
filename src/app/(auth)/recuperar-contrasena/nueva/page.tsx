"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Home, Lock, ShieldCheck } from "lucide-react";

import {
  obtenerErrorPoliticaPassword,
  PASSWORD_MIN_CHARACTERS,
} from "@/modulos/usuarios/politica-password";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");

    // La política se aplica igual en el servidor. Comprobarla aquí solo evita
    // gastar el viaje y que el aviso llegue después de enviar el formulario.
    const problema = obtenerErrorPoliticaPassword(password);
    if (problema) {
      setError(problema);
      return;
    }
    if (password !== repetida) {
      setError("Las dos contraseñas no coinciden");
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch("/api/auth/recuperacion/confirmacion", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const cuerpo = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !cuerpo?.success) {
        if (cuerpo?.code === "RECUPERACION_NO_VIGENTE") {
          router.replace("/recuperar-contrasena?estado=invalido");
          return;
        }
        throw new Error(
          typeof cuerpo?.error === "string"
            ? cuerpo.error
            : "No se pudo actualizar la contraseña",
        );
      }
      router.replace("/login");
    } catch (razon) {
      setError(
        razon instanceof Error
          ? razon.message
          : "No se pudo actualizar la contraseña",
      );
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Define tu contraseña
          </h1>
          <p className="text-blue-200/70 text-sm">
            Al guardarla se cierran todas las sesiones abiertas de tu cuenta.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={guardar} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-200">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="nueva-password"
                className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider"
              >
                Contraseña nueva
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50"
                />
                <input
                  id="nueva-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-blue-200/50">
                Mínimo {PASSWORD_MIN_CHARACTERS} caracteres, con mayúscula,
                minúscula, número y símbolo.
              </p>
            </div>

            <div>
              <label
                htmlFor="repetir-password"
                className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider"
              >
                Repite la contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50"
                />
                <input
                  id="repetir-password"
                  type="password"
                  autoComplete="new-password"
                  value={repetida}
                  onChange={(evento) => setRepetida(evento.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              {guardando ? "Guardando…" : "Guardar y volver a entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-blue-200/30 mt-6">
          El enlace del correo vence a los 15 minutos desde que lo abriste.
        </p>
      </div>
    </div>
  );
}
