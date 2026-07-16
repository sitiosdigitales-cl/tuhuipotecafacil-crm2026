"use client";

import { useState } from "react";
import { Mail, Send, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailToLeadProps {
  open: boolean;
  onClose: () => void;
}

// Extraer datos del contenido del email
function parsearEmail(texto: string) {
  // Buscar asunto
  const asuntoMatch = texto.match(/(?:asunto|subject|re)\s*:\s*(.+)/i);
  const asunto = asuntoMatch ? asuntoMatch[1].trim() : "";

  // Buscar remitente
  const fromMatch = texto.match(/(?:de|from|para ti|enviado por)\s*:?\s*(.+)/i) ||
                    texto.match(/^[\w.-]+@[\w.-]+\.\w+$/m);
  let emailRemitente = "";
  let nombreRemitente = "";

  if (fromMatch) {
    const fromLine = fromMatch[1].trim();
    const emailMatch = fromLine.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      emailRemitente = emailMatch[0];
      nombreRemitente = fromLine.replace(emailMatch[0], "").replace(/[<>"]/, "").trim();
    } else {
      nombreRemitente = fromLine;
    }
  }

  // Si el texto contiene un email directo
  if (!emailRemitente) {
    const allEmails = texto.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (allEmails && allEmails.length > 0) {
      emailRemitente = allEmails[0];
    }
  }

  // Buscar teléfono
  const phonePatterns = [
    /(?:\+?56)?\s*9\s*\d{4}\s*\d{4}/,
    /tel(?:é|e)fono?\s*:?\s*([+\d\s()-]{8,})/i,
    /celular\s*:?\s*([+\d\s()-]{8,})/i,
    /whatsapp\s*:?\s*([+\d\s()-]{8,})/i,
  ];
  let telefono = "";
  for (const p of phonePatterns) {
    const m = texto.match(p);
    if (m) { telefono = m[0].replace(/[^0-9+]/g, ""); break; }
  }

  // Determinar tipo de consulta
  const lower = texto.toLowerCase();
  let tipoConsulta = "Consulta general";
  if (lower.includes("hipotecario") || lower.includes("casa") || lower.includes("departamento") || lower.includes("vivienda") || lower.includes("credito hipotecario")) {
    tipoConsulta = "Crédito Hipotecario";
  } else if (lower.includes("consumo")) {
    tipoConsulta = "Crédito de Consumo";
  } else if (lower.includes("empresa") || lower.includes("pyme")) {
    tipoConsulta = "Capital para Empresas";
  }

  // Separar nombre si viene junto al email
  if (nombreRemitente && !emailRemitente) {
    const parts = nombreRemitente.split(/\s+/);
    return {
      nombre: parts[0] || "",
      apellido: parts.slice(1).join(" ") || "",
      email: "",
      telefono,
      tipoConsulta,
      asunto,
      comentarios: texto.substring(0, 500),
    };
  }

  // Si tenemos email, intentar extraer nombre del local part
  let nombre = nombreRemitente;
  let apellido = "";
  if (!nombre && emailRemitente) {
    const localPart = emailRemitente.split("@")[0];
    const parts = localPart.replace(/[._-]/g, " ").split(/\s+/);
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  } else if (nombre) {
    const parts = nombre.split(/\s+/);
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  }

  return { nombre, apellido, email: emailRemitente, telefono, tipoConsulta, asunto, comentarios: texto.substring(0, 500) };
}

export function EmailToLead({ open, onClose }: EmailToLeadProps) {
  const [paso, setPaso] = useState<"pegar" | "editar" | "listo">("pegar");
  const [textoEmail, setTextoEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [datos, setDatos] = useState({
    nombre: "", apellido: "", email: "", telefono: "",
    tipoConsulta: "Consulta general", asunto: "", comentarios: "",
  });

  const handleParsear = () => {
    if (!textoEmail.trim()) {
      toast.error("Pega el contenido del email");
      return;
    }
    const parsed = parsearEmail(textoEmail);
    setDatos(parsed);
    setPaso("editar");
  };

  const handleEnviar = async () => {
    if (!datos.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/pre-evaluacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre,
          apellido: datos.apellido,
          email: datos.email,
          telefono: datos.telefono,
          tipoCredito: datos.tipoConsulta,
          comentarios: datos.comentarios,
          origen: "email_corporativo",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPaso("listo");
        toast.success("Lead creado desde email");
      } else {
        toast.error("Error al crear lead");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  const handleCerrar = () => {
    setPaso("pegar");
    setTextoEmail("");
    setDatos({ nombre: "", apellido: "", email: "", telefono: "", tipoConsulta: "Consulta general", asunto: "", comentarios: "" });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCerrar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1E40AF] to-[#2563EB] px-6 py-4 rounded-t-2xl z-10">
          <button onClick={handleCerrar} className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Convertir Email a Lead</h2>
              <p className="text-[10px] text-blue-100">
                {paso === "pegar" ? "Pega el contenido del email" : paso === "editar" ? "Revisa los datos extraídos" : "Lead creado correctamente"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Paso 1: Pegar email */}
          {paso === "pegar" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Copia el contenido completo del email recibido en <strong>contacto@tuhipotecafacil.cl</strong> y pégalo aquí.
              </p>
              <textarea
                value={textoEmail}
                onChange={(e) => setTextoEmail(e.target.value)}
                placeholder={`De: Juan Pérez <juan@email.com>\nAsunto: Consulta crédito hipotecario\n\nHola, me gustaría saber más sobre créditos hipotecarios. Mi teléfono es +56 9 1234 5678.`}
                rows={10}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
              <button onClick={handleParsear}
                className="w-full py-3 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                <FileText size={14} /> Extraer datos del email
              </button>
            </div>
          )}

          {/* Paso 2: Editar datos */}
          {paso === "editar" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Revisa y corrige los datos extraídos del email:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Nombre *</label>
                  <input type="text" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Apellido</label>
                  <input type="text" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500">Email</label>
                <input type="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500">Teléfono</label>
                <input type="text" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500">Tipo de consulta</label>
                <select value={datos.tipoConsulta} onChange={(e) => setDatos({ ...datos, tipoConsulta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500">
                  <option>Consulta general</option>
                  <option>Crédito Hipotecario</option>
                  <option>Crédito de Consumo</option>
                  <option>Capital para Empresas</option>
                  <option>Refinanciamiento</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPaso("pegar")} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors">
                  ← Volver
                </button>
                <button onClick={handleEnviar} disabled={enviando}
                  className="flex-1 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {enviando ? <><Loader2 size={14} className="animate-spin" /> Creando lead...</> : <><Send size={14} /> Crear Lead</>}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Listo */}
          {paso === "listo" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Lead creado correctamente</h3>
              <p className="text-[11px] text-slate-500 mb-4">
                <strong>{datos.nombre} {datos.apellido}</strong> fue agregado al Pipeline como Nuevo Lead.
              </p>
              <button onClick={handleCerrar}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
