"use client";

import { useState, useMemo, useEffect } from "react";
import { useLeads } from "@/modulos/leads";
import { TIPOS_DOCUMENTO_CONFIG } from "@/tipos";
import {
  Send,
  Link2,
  Check,
  Copy,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Clock,
  Users,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import type { TipoDocumento, Lead } from "@/tipos";

interface DocumentoSolicitado {
  id: string;
  tipo: TipoDocumento | "OTRO";
  nombre: string;
  seleccionado: boolean;
  esPersonalizado?: boolean;
}

interface SolicitarDocumentosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
}

const DOCUMENTOS_POR_DEFECTO: { tipo: TipoDocumento; nombre: string }[] = [
  { tipo: "CEDULA_IDENTIDAD", nombre: "Cédula de Identidad (ambos lados, vigente)" },
  { tipo: "LIQUIDACION_SUELDO", nombre: "6 Últimas Liquidaciones de Sueldo" },
  { tipo: "CERTIFICADO_COTIZACIONES_AFP", nombre: "Certificado de Cotizaciones AFP (24 meses)" },
  { tipo: "ANEXO_LABORAL", nombre: "Anexo o Permanencia Laboral" },
  { tipo: "COMPROBANTE_DOMICILIO", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)" },
  { tipo: "CERTIFICADO_CMF", nombre: "Certificado de Deudas CMF" },
  { tipo: "TITULO_UNIVERSITARIO", nombre: "Título Universitario o Certificado de Título" },
  { tipo: "PADRON_VEHICULO", nombre: "Padrón de Vehículo" },
  { tipo: "DOMINIO_PROPIEDAD", nombre: "Dominio Vigente de Propiedad" },
];

export function SolicitarDocumentos({ open, onOpenChange, leadId }: SolicitarDocumentosProps) {
  const { leads } = useLeads();
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoSolicitado[]>(
    DOCUMENTOS_POR_DEFECTO.map((d, i) => ({ ...d, id: `def-${i}`, seleccionado: false }))
  );
  const [metodoEnvio, setMetodoEnvio] = useState<"whatsapp" | "email" | "link">("whatsapp");
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [linkGenerado, setLinkGenerado] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [busquedaLead, setBusquedaLead] = useState("");

  // Pre-seleccionar lead cuando se abre con leadId
  useEffect(() => {
    if (open && leadId && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setLeadSeleccionado(lead);
      }
    }
    if (!open) {
      setLeadSeleccionado(null);
      setEnviado(false);
      setLinkGenerado("");
    }
  }, [open, leadId, leads]);

  // Estado para documento personalizado
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoDocNombre, setNuevoDocNombre] = useState("");
  const [editandoDoc, setEditandoDoc] = useState<string | null>(null);
  const [nombreEditando, setNombreEditando] = useState("");

  const leadsFiltrados = useMemo(() => {
    if (!busquedaLead) return leads.slice(0, 10);
    return leads.filter(
      (l) =>
        l.nombre.toLowerCase().includes(busquedaLead.toLowerCase()) ||
        l.apellido.toLowerCase().includes(busquedaLead.toLowerCase()) ||
        l.rut.includes(busquedaLead)
    );
  }, [leads, busquedaLead]);

  const documentosSeleccionados = documentos.filter((d) => d.seleccionado);

  const toggleDocumento = (id: string) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, seleccionado: !d.seleccionado } : d))
    );
  };

  const seleccionarTodos = () => {
    const todosSeleccionados = documentos.every((d) => d.seleccionado);
    setDocumentos((prev) => prev.map((d) => ({ ...d, seleccionado: !todosSeleccionados })));
  };

  const agregarDocumentoPersonalizado = () => {
    if (!nuevoDocNombre.trim()) {
      toast.error("Ingresa un nombre para el documento");
      return;
    }

    const nuevoDoc: DocumentoSolicitado = {
      id: `custom-${Date.now()}`,
      tipo: "OTRO",
      nombre: nuevoDocNombre.trim(),
      seleccionado: true,
      esPersonalizado: true,
    };

    setDocumentos((prev) => [...prev, nuevoDoc]);
    setNuevoDocNombre("");
    setMostrarFormulario(false);
    toast.success("Documento agregado", {
      description: `"${nuevoDoc.nombre}" fue agregado a la lista`,
    });
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    toast.info("Documento eliminado");
  };

  const iniciarEdicion = (doc: DocumentoSolicitado) => {
    setEditandoDoc(doc.id);
    setNombreEditando(doc.nombre);
  };

  const guardarEdicion = (id: string) => {
    if (!nombreEditando.trim()) return;
    setDocumentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, nombre: nombreEditando.trim() } : d))
    );
    setEditandoDoc(null);
    setNombreEditando("");
    toast.success("Documento actualizado");
  };

  const cancelarEdicion = () => {
    setEditandoDoc(null);
    setNombreEditando("");
  };

  const generarLink = () => {
    if (!leadSeleccionado || documentosSeleccionados.length === 0) {
      toast.error("Selecciona un lead y al menos un documento");
      return;
    }

    const tiposDocs = documentosSeleccionados.map((d) => d.tipo).join(",");
    const nombresDocs = documentosSeleccionados.map((d) => encodeURIComponent(d.nombre)).join(",");
    const link = `https://tuhipotecafacil.cl/subir-documentos?lead=${leadSeleccionado.id}&docs=${tiposDocs}&nombres=${nombresDocs}&token=${Math.random().toString(36).substring(2, 10)}`;
    setLinkGenerado(link);
    toast.success("Link generado", {
      description: "El link está listo para compartir",
    });
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGenerado);
    toast.success("Link copiado", {
      description: "El link se copió al portapapeles",
    });
  };

  const enviarRecordatorio = async () => {
    if (!leadSeleccionado || documentosSeleccionados.length === 0) {
      toast.error("Selecciona un lead y al menos un documento");
      return;
    }

    const listaDocumentos = documentosSeleccionados.map((d) => d.nombre);

    if (metodoEnvio === "whatsapp") {
      const mensaje = mensajePersonalizado || `Hola ${leadSeleccionado.nombre}, te solicitamos documentos para continuar con tu proceso.`;
      const numero = leadSeleccionado.telefono?.replace(/[^0-9]/g, "") || "";
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
    } else if (metodoEnvio === "email" || metodoEnvio === "link") {
      // Enviar email real a través de la API
      try {
        const response = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "documentos",
            email: leadSeleccionado.email,
            nombre: `${leadSeleccionado.nombre} ${leadSeleccionado.apellido}`,
            documentos: listaDocumentos,
            leadId: leadSeleccionado.id,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          // Error en API de email
        }
      } catch (error) {
        // Continuar de todas formas
      }
    }

    setEnviado(true);
    toast.success("Recordatorio enviado", {
      description: `Se envió a ${leadSeleccionado.nombre} ${leadSeleccionado.apellido}`,
    });

    setTimeout(() => {
      setEnviado(false);
      onOpenChange(false);
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setLeadSeleccionado(null);
    setDocumentos(DOCUMENTOS_POR_DEFECTO.map((d, i) => ({ ...d, id: `def-${i}`, seleccionado: false })));
    setMetodoEnvio("whatsapp");
    setMensajePersonalizado("");
    setLinkGenerado("");
    setBusquedaLead("");
    setMostrarFormulario(false);
    setNuevoDocNombre("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Send size={18} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Solicitar Documentos</h3>
                <p className="text-[11px] text-slate-500">Selecciona documentos y envía recordatorio al cliente</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {enviado ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">¡Recordatorio Enviado!</h4>
              <p className="text-sm text-slate-500">
                Se envió la solicitud a {leadSeleccionado?.nombre} {leadSeleccionado?.apellido}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selección de Lead */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Seleccionar Cliente
                </label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o RUT..."
                    value={busquedaLead}
                    onChange={(e) => setBusquedaLead(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                {busquedaLead && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    {leadsFiltrados.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => {
                          setLeadSeleccionado(lead);
                          setBusquedaLead("");
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors ${
                          leadSeleccionado?.id === lead.id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
                          {lead.nombre[0]}{lead.apellido[0]}
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-semibold text-slate-800">{lead.nombre} {lead.apellido}</div>
                          <div className="text-[10px] text-slate-400">{lead.rut}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {leadSeleccionado && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-[11px] font-bold text-white">
                      {leadSeleccionado.nombre[0]}{leadSeleccionado.apellido[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-slate-800">{leadSeleccionado.nombre} {leadSeleccionado.apellido}</div>
                      <div className="text-[10px] text-slate-500">{leadSeleccionado.email}</div>
                    </div>
                    <button
                      onClick={() => setLeadSeleccionado(null)}
                      className="p-1 hover:bg-white rounded-lg transition-colors"
                    >
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Selección de Documentos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Documentos a Solicitar ({documentosSeleccionados.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMostrarFormulario(!mostrarFormulario)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus size={12} /> Agregar documento
                    </button>
                    <button
                      onClick={seleccionarTodos}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {documentos.every((d) => d.seleccionado) ? "Deseleccionar" : "Seleccionar todos"}
                    </button>
                  </div>
                </div>

                {/* Formulario para agregar documento personalizado */}
                {mostrarFormulario && (
                  <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del documento (ej: Certificado de residencia)"
                        value={nuevoDocNombre}
                        onChange={(e) => setNuevoDocNombre(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && agregarDocumentoPersonalizado()}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-400"
                        autoFocus
                      />
                      <button
                        onClick={agregarDocumentoPersonalizado}
                        disabled={!nuevoDocNombre.trim()}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setMostrarFormulario(false);
                          setNuevoDocNombre("");
                        }}
                        className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {documentos.map((doc) => {
                    const esPersonalizado = doc.esPersonalizado;
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          doc.seleccionado
                            ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <button
                          onClick={() => toggleDocumento(doc.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                            doc.seleccionado
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {doc.seleccionado && <Check size={12} />}
                        </button>
                        <FileText size={14} className={doc.seleccionado ? "text-indigo-500" : "text-slate-400"} />
                        
                        {editandoDoc === doc.id ? (
                          <input
                            type="text"
                            value={nombreEditando}
                            onChange={(e) => setNombreEditando(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") guardarEdicion(doc.id);
                              if (e.key === "Escape") cancelarEdicion();
                            }}
                            className="flex-1 px-2 py-1 bg-white border border-indigo-300 rounded text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <span className="flex-1 text-[11px] font-medium text-slate-700 truncate">
                            {doc.nombre}
                          </span>
                        )}

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {esPersonalizado && (
                            <>
                              {editandoDoc === doc.id ? (
                                <>
                                  <button
                                    onClick={() => guardarEdicion(doc.id)}
                                    className="p-1 hover:bg-emerald-100 rounded transition-colors"
                                    title="Guardar"
                                  >
                                    <Check size={10} className="text-emerald-600" />
                                  </button>
                                  <button
                                    onClick={cancelarEdicion}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                    title="Cancelar"
                                  >
                                    <X size={10} className="text-slate-400" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => iniciarEdicion(doc)}
                                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                                    title="Editar nombre"
                                  >
                                    <Edit2 size={10} className="text-blue-500" />
                                  </button>
                                  <button
                                    onClick={() => eliminarDocumento(doc.id)}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={10} className="text-red-500" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {esPersonalizado && (
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Método de Envío */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Método de Envío
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMetodoEnvio("whatsapp")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      metodoEnvio === "whatsapp"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span className="text-[11px] font-semibold">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setMetodoEnvio("email")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      metodoEnvio === "email"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Mail size={16} />
                    <span className="text-[11px] font-semibold">Email</span>
                  </button>
                  <button
                    onClick={() => setMetodoEnvio("link")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      metodoEnvio === "link"
                        ? "bg-purple-50 border-purple-200 text-purple-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Link2 size={16} />
                    <span className="text-[11px] font-semibold">Copiar Link</span>
                  </button>
                </div>
              </div>

              {/* Link Generado */}
              {metodoEnvio === "link" && linkGenerado && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={linkGenerado}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono"
                    />
                    <button
                      onClick={copiarLink}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                </div>
              )}

              {/* Mensaje Personalizado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mensaje (Opcional)
                </label>
                <textarea
                  value={mensajePersonalizado}
                  onChange={(e) => setMensajePersonalizado(e.target.value)}
                  placeholder="Escribe un mensaje personalizado o deja vacío para usar el predeterminado..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!enviado && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <div className="flex items-center gap-2">
              {metodoEnvio === "link" ? (
                <button
                  onClick={generarLink}
                  disabled={!leadSeleccionado || documentosSeleccionados.length === 0}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[11px] font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link2 size={14} /> Generar Link
                </button>
              ) : (
                <button
                  onClick={enviarRecordatorio}
                  disabled={!leadSeleccionado || documentosSeleccionados.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} /> Enviar Recordatorio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
