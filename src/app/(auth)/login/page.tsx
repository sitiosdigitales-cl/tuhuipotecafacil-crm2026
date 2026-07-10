"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Home,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const exito = await login(email, password);

    if (exito) {
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas.");
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            TuHipotecaFacil.cl
          </h1>
          <p className="text-blue-200/70 text-sm">
            CRM Hipotecario Inteligente
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              Iniciar Sesión
            </h2>
            <p className="text-blue-200/60 text-sm">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50"
                />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition-colors"
                >
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-blue-200/30 mt-6">
          © 2026 TuHipotecaFacil.cl - Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
