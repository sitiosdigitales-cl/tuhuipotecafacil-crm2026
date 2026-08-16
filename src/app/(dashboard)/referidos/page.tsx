"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Mail,
  MessageSquare,
  BarChart3,
  Search,
  Clock,
  CheckCircle,
  LinkIcon,
  UserPlus,
} from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { formatoMonedaAbreviado } from "@/lib/utils";

type TabActiva = "resumen" | "referidos";

export default function ReferidosPage() {
  const { leads } = useLeads();

  const [tabActiva, setTabActiva] = useState<TabActiva>("resumen");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [codigoReferido, setCodigoReferido] = useState("");
  const [linkReferido, setLinkReferido] = useState("");
  const [codigoError, setCodigoError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCodigo() {
      try {
        const response = await fetch("/api/referidos/codigo", {
          credentials: "include",
          signal: controller.signal,
        });
        const resultado = await response.json() as {
          success: boolean;
          data?: { codigo?: string };
        };
        if (!response.ok || !resultado.success || !resultado.data?.codigo) {
          throw new Error("Código no disponible");
        }
        setCodigoReferido(resultado.data.codigo);
        setLinkReferido(
          `${window.location.origin}/referir/${encodeURIComponent(resultado.data.codigo)}`
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCodigoError("No se pudo cargar tu código de referido");
      }
    }

    void cargarCodigo();
    return () => controller.abort();
  }, []);

  // Leads referidos por este usuario
  const leadsReferidos = useMemo(() => {
    return leads.filter((l) => l.codigoReferido === codigoReferido);
  }, [leads, codigoReferido]);

  // Estadísticas
  const stats = useMemo(() => ({
    totalReferidos: leadsReferidos.length,
    completados: leadsReferidos.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    ).length,
    enProceso: leadsReferidos.filter((l) =>
      !["NUEVO_LEAD", "APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    ).length,
    pendientes: leadsReferidos.filter((l) => l.etapa === "NUEVO_LEAD").length,
    totalMontos: leadsReferidos.reduce((sum, l) => sum + (l.montoSolicitado || 0), 0),
  }), [leadsReferidos]);

  const referidosFiltrados = useMemo(() => {
    return leadsReferidos.filter((l) => {
      const coincideBusqueda = !busqueda ||
        l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.rut.includes(busqueda);
      return coincideBusqueda;
    });
  }, [leadsReferidos, busqueda]);

  const copiarLink = () => {
    if (!linkReferido) return;
    navigator.clipboard.writeText(linkReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const copiarCodigo = () => {
    if (!codigoReferido) return;
    navigator.clipboard.writeText(codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirWhatsApp = () => {
    if (!linkReferido || !codigoReferido) return;
    const mensaje = `Hola! Te invito a conocer TuHipotecaFacil. Usa mi código de referido ${codigoReferido} o haz clic en este enlace: ${linkReferido}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const compartirEmail = () => {
    if (!linkReferido || !codigoReferido) return;
    const asunto = "Te invito a TuHipotecaFacil";
    const cuerpo = `Hola!\n\nTe invito a conocer TuHipotecaFacil, tu plataforma de créditos hipotecarios.\n\nUsa mi código de referido: ${codigoReferido}\nO haz clic en este enlace: ${linkReferido}\n\nSaludos!`;
    window.open(`mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Mis Referidos
            </h1>
            <p className="text-purple-200 text-[11px] font-medium">
              Comparte tu enlace único y gana recompensas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalReferidos}</div>
              <div className="text-[10px] text-purple-200">Mis Referidos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.completados}</div>
              <div className="text-[10px] text-purple-200">Convertidos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{formatoMonedaAbreviado(stats.totalMontos)}</div>
              <div className="text-[10px] text-purple-200">En créditos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Link de referido único */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <LinkIcon size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Tu Enlace Único de Referidos</h3>
            <p className="text-[11px] text-slate-400">Comparte este enlace para que nuevos clientes se registren bajo tu referido</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200/60">
            <span className="text-[12px] text-slate-600 font-mono break-all">
              {codigoError || linkReferido || "Cargando enlace..."}
            </span>
          </div>
          <button
            onClick={copiarLink}
            disabled={!linkReferido}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-semibold transition-all ${
              copiado
                ? "bg-emerald-500 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
            }`}
          >
            {copiado ? <Check size={14} /> : <Copy size={14} />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Código:</span>
            <span className="text-[12px] font-bold text-purple-600 font-mono">{codigoReferido || "Cargando..."}</span>
            <button disabled={!codigoReferido} onClick={copiarCodigo} className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-40">
              <Copy size={10} className="text-slate-400" />
            </button>
          </div>
          <div className="flex-1" />
          <button disabled={!linkReferido} onClick={compartirWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-colors disabled:opacity-40">
            <MessageSquare size={13} /> WhatsApp
          </button>
          <button disabled={!linkReferido} onClick={compartirEmail} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40">
            <Mail size={13} /> Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-1.5 shadow-soft">
        <div className="flex gap-1">
          {[
            { id: "resumen", label: "Resumen", icono: BarChart3 },
            { id: "referidos", label: "Mis Referidos", icono: Users },
          ].map((tab) => {
            const IconoTab = tab.icono;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabActiva)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <IconoTab size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Resumen */}
      {tabActiva === "resumen" && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-violet-500" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Mis Referidos</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalReferidos}</div>
              <div className="text-[10px] text-slate-400 mt-1">{stats.pendientes} pendientes</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-500" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Convertidos</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{stats.completados}</div>
              <div className="text-[10px] text-emerald-500 mt-1">
                {stats.totalReferidos > 0 ? Math.round((stats.completados / stats.totalReferidos) * 100) : 0}% conversión
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">En Proceso</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.enProceso}</div>
              <div className="text-[10px] text-blue-500 mt-1">Creditos en evaluación</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Monto Total</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">{formatoMonedaAbreviado(stats.totalMontos)}</div>
              <div className="text-[10px] text-amber-500 mt-1">En créditos solicitados</div>
            </div>
          </div>

          {/* Últimos referidos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Últimos Referidos
            </h3>
            {leadsReferidos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <UserPlus size={24} className="text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">Sin referidos aún</p>
                <p className="text-[10px] text-slate-300 mt-1">Comparte tu enlace para empezar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leadsReferidos.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-[11px] font-bold">
                      {lead.nombre[0]}{lead.apellido[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-slate-700">{lead.nombre} {lead.apellido}</div>
                      <div className="text-[10px] text-slate-400">{lead.rut}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-700">
                        {lead.montoSolicitado ? formatoMonedaAbreviado(lead.montoSolicitado) : "-"}
                      </div>
                      <div className="text-[11px] text-slate-400">{lead.creadoEn.toLocaleDateString("es-CL")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Mis Referidos */}
      {tabActiva === "referidos" && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                />
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="font-bold text-slate-600">{referidosFiltrados.length}</span> referidos
              </div>
            </div>
          </div>

          {/* Lista de referidos */}
          {referidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-12 text-center shadow-soft">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Sin referidos</p>
              <p className="text-[11px] text-slate-400 mt-1">Comparte tu enlace para que nuevos clientes se registren</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">RUT</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banco</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referidosFiltrados.map((lead) => (
                    <tr key={lead.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-[11px] font-bold">
                            {lead.nombre[0]}{lead.apellido[0]}
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold text-slate-800">{lead.nombre} {lead.apellido}</div>
                            <div className="text-[10px] text-slate-400">{lead.email || "Sin email"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-slate-600 font-medium">{lead.rut}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600">
                          {lead.etapa.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {lead.montoSolicitado ? formatoMonedaAbreviado(lead.montoSolicitado) : "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-slate-600">{lead.banco || "-"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-slate-500">
                          {lead.creadoEn.toLocaleDateString("es-CL")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
