"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LinkIcon, User, Mail, Phone, CheckCircle, ArrowRight } from "lucide-react";

export default function ReferirPage() {
  const params = useParams();
  const router = useRouter();
  const codigo = params?.codigo as string;

  const [valido, setValido] = useState<boolean | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!codigo) return;
    fetch(`/api/referidos/validar?codigo=${encodeURIComponent(codigo)}`)
      .then((r) => r.json())
      .then((data) => setValido(data.valido))
      .catch(() => setValido(false));
  }, [codigo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) {
      setError("Nombre y email son requeridos");
      return;
    }
    setRegistrando(true);
    setError("");
    try {
      const res = await fetch("/api/referidos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nombre, email, telefono }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrado(true);
        setTimeout(() => router.push("/"), 3000);
      } else {
        setError(data.error || "Error al registrar");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setRegistrando(false);
    }
  };

  if (valido === null) {
    return (<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>);
  }
  if (!valido) {
    return (<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"><div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl">X</span></div><h1 className="text-xl font-bold text-slate-800 mb-2">Codigo invalido</h1><p className="text-sm text-slate-500">El codigo de referido no es valido o ha expirado.</p></div></div>);
  }
  if (registrado) {
    return (<div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"><div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-500" /></div><h1 className="text-xl font-bold text-slate-800 mb-2">Registro exitoso!</h1><p className="text-sm text-slate-500">Gracias por registrarte. Un ejecutivo te contactara pronto.</p></div></div>);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><LinkIcon size={28} className="text-white" /></div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">Referido por un amigo</h1>
          <p className="text-sm text-slate-500">Completa tus datos para comenzar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Nombre completo *</label><div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" placeholder="Juan Perez" /></div></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Email *</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" placeholder="juan@email.com" /></div></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Telefono</label><div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" placeholder="+56 9 1234 5678" /></div></div>
          {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={registrando} className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-purple-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">{registrando ? "Registrando..." : "Registrarme"}<ArrowRight size={16} /></button>
        </form>
      </div>
    </div>
  );
}