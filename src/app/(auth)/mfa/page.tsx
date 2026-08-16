"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Smartphone,
} from "lucide-react";

type MfaMode = "loading" | "enroll" | "challenge" | "verifying";

interface UsuarioMfa {
  rol: string;
}

function destinoPorRol(rol: string): string {
  if (rol === "CLIENTE") return "/portal-cliente";
  if (rol === "AGENTE") return "/documentos";
  return "/dashboard";
}

export default function MfaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<MfaMode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void fetch("/api/auth/mfa/status", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.status === 401 || response.status === 403) {
          router.replace("/login");
          return;
        }
        if (!response.ok || !body?.success || !body.data?.mode) {
          throw new Error(
            typeof body?.error === "string"
              ? body.error
              : "La sesión de verificación no está vigente",
          );
        }
        if (!active) return;
        if (body.data.mode === "satisfied") {
          router.replace("/dashboard");
          return;
        }
        if (body.data.mode === "challenge" && typeof body.data.factorId === "string") {
          setFactorId(body.data.factorId);
          setMode("challenge");
          return;
        }
        setMode("enroll");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "No se pudo comprobar la verificación en dos pasos",
        );
        setMode("enroll");
      });

    return () => {
      active = false;
    };
  }, [router]);

  const iniciarEnrolamiento = async () => {
    setError("");
    setMode("loading");
    try {
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);
      if (
        !response.ok ||
        !body?.success ||
        typeof body.data?.factorId !== "string" ||
        typeof body.data?.qrCode !== "string" ||
        typeof body.data?.secret !== "string"
      ) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "No se pudo configurar el autenticador",
        );
      }
      setFactorId(body.data.factorId);
      setQrCode(body.data.qrCode);
      setSecret(body.data.secret);
      setMode("challenge");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo configurar el autenticador",
      );
      setMode("enroll");
    }
  };

  const verificar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Ingresa los seis dígitos de tu aplicación autenticadora");
      return;
    }

    setError("");
    setMode("verifying");
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, code }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success || !body.data?.usuario) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "No se pudo verificar el código",
        );
      }
      const usuario = body.data.usuario as UsuarioMfa;
      router.replace(destinoPorRol(usuario.rol));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo verificar el código",
      );
      setCode("");
      setMode("challenge");
    }
  };

  const cancelar = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);
    router.replace("/login");
  };

  const cargando = mode === "loading" || mode === "verifying";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verificación en dos pasos</h1>
          <p className="text-blue-200/70 text-sm">
            Protege las funciones administrativas con tu autenticador.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="flex items-start gap-2 p-3 mb-5 bg-red-500/20 border border-red-500/30 rounded-xl">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-200">{error}</span>
            </div>
          )}

          {mode === "loading" && (
            <div className="flex flex-col items-center gap-3 py-12 text-blue-100">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm">Comprobando tu sesión…</p>
            </div>
          )}

          {mode === "enroll" && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <Smartphone size={28} className="text-blue-300 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-white">Configura una aplicación autenticadora</h2>
                  <p className="mt-1 text-sm text-blue-100/70">
                    Usa Google Authenticator, Microsoft Authenticator, 1Password u otra aplicación TOTP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={iniciarEnrolamiento}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Configurar autenticador
              </button>
            </div>
          )}

          {(mode === "challenge" || mode === "verifying") && (
            <form onSubmit={verificar} className="space-y-5">
              {qrCode && (
                <div className="space-y-4">
                  <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                    <Image
                      src={qrCode}
                      alt="Código QR para configurar el autenticador"
                      width={224}
                      height={224}
                      unoptimized
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-blue-100/70 mb-2">
                      Si no puedes escanear, ingresa esta clave manualmente:
                    </p>
                    <code className="block break-all text-sm text-white select-all">{secret}</code>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="mfa-code" className="block text-[11px] font-semibold text-blue-200/80 mb-2 uppercase tracking-wider">
                  Código de seis dígitos
                </label>
                <div className="relative">
                  <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/50" />
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center tracking-[0.45em] placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando || code.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mode === "verifying" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Verificar y continuar
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={cancelar}
            className="mt-6 w-full py-2 text-sm text-blue-200/70 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={15} />
            Cancelar e iniciar con otra cuenta
          </button>
        </div>

        <p className="text-center text-[10px] text-blue-200/30 mt-6">
          La clave se muestra solo durante esta configuración y no usa almacenamiento local.
        </p>
      </div>
    </div>
  );
}
