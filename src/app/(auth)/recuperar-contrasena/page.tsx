"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Home, Mail } from "lucide-react";

function AvisoEnlace() {
  const estado = useSearchParams().get("estado");
  if (estado !== "invalido") return null;

  return (
    <div className="flex items-start gap-2 p-3 mb-5 bg-amber-500/20 border border-amber-500/30 rounded-xl">
      <AlertCircle size={16} className="text-amber-300 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-amber-100">
        Ese enlace ya no sirve: vence a los 15 minutos y solo se puede usar una
        vez. Pide uno nuevo.
      </span>
    </div>
  );
}

function FormularioSolicitud() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const solicitar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/auth/recuperacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const cuerpo = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !cuerpo?.success) {
        throw new Error(
          typeof cuerpo?.error === "string"
            ? cuerpo.error
            : "No se pudo procesar la solicitud",
        );
      }
      setMensaje(
        typeof cuerpo.mensaje === "string"
          ? cuerpo.mensaje
          : "Revisa tu correo electrónico.",
      );
    } catch (razon) {
      setError(
        razon instanceof Error ? razon.message : "No se pudo procesar la solicitud",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={solicitar} className="space-y-5">
      {mensaje && (
        <div className="flex items-start gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
          <CheckCircle2 size={16} className="text-emerald-300 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-emerald-100">{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-200">{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="recuperacion-email"
          className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider"
        >
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50"
          />
          <input
            id="recuperacion-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="tu@correo.cl"
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enviando ? "Enviando…" : "Enviar instrucciones"}
      </button>
    </form>
  );
}

export default function RecuperarContrasenaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Recuperar contraseña
          </h1>
          <p className="text-blue-200/70 text-sm">
            Te enviamos un enlace para definir una contraseña nueva.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <Suspense fallback={null}>
            <AvisoEnlace />
          </Suspense>
          <FormularioSolicitud />

          <Link
            href="/login"
            className="mt-6 w-full py-2 text-sm text-blue-200/70 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={15} />
            Volver a iniciar sesión
          </Link>
        </div>

        <p className="text-center text-[10px] text-blue-200/30 mt-6">
          La respuesta es la misma exista o no la cuenta: así este formulario no
          sirve para averiguar qué correos pertenecen al equipo.
        </p>
      </div>
    </div>
  );
}
