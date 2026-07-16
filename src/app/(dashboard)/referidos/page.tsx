"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Gift,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Share2,
  Mail,
  MessageSquare,
  Award,
  BarChart3,
  Search,
  Clock,
  CheckCircle,
  Zap,
  Percent,
  Trophy,
  Medal,
  Crown,
  LinkIcon,
  UserPlus,
} from "lucide-react";
import { useUser } from "@/modulos/usuarios";
import { useLeads } from "@/modulos/leads";
import { formatoMonedaAbreviado } from "@/lib/utils";

// Programa de recompensas
const RECOMPENSAS = [
  { nivel: 1, nombre: "Bronce", referidos: 1, recompensa: "$ 50.000", icono: Medal, color: "from-amber-600 to-amber-700" },
  { nivel: 2, nombre: "Plata", referidos: 3, recompensa: "$ 150.000", icono: Award, color: "from-slate-400 to-slate-500" },
  { nivel: 3, nombre: "Oro", referidos: 5, recompensa: "$ 300.000", icono: Trophy, color: "from-yellow-500 to-yellow-600" },
  { nivel: 4, nombre: "Diamante", referidos: 10, recompensa: "$ 750.000 + Viaje", icono: Crown, color: "from-purple-500 to-purple-600" },
];

type TabActiva = "resumen" | "referidos" | "programa";

export default function ReferidosPage() {
  const { usuarioActual } = useUser();
  const { leads, obtenerCodigoReferido } = useLeads();

  const [tabActiva, setTabActiva] = useState<TabActiva>("resumen");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Obtener código único del usuario actual
  const codigoReferido = obtenerCodigoReferido(usuarioActual.id);
  const linkReferido = `https://tuhipotecafacil.cl/referir/${codigoReferido}`;

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
    navigator.clipboard.writeText(linkReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirWhatsApp = () => {
    const mensaje = `Hola! Te invito a conocer TuHipotecaFacil. Usa mi código de referido ${codigoReferido} o haz clic en este enlace: ${linkReferido}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const compartirEmail = () => {
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
            <span className="text-[12px] text-slate-600 font-mono break-all">{linkReferido}</span>
          </div>
          <button
            onClick={copiarLink}
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
            <span className="text-[12px] font-bold text-purple-600 font-mono">{codigoReferido}</span>
            <button onClick={copiarCodigo} className="p-1 hover:bg-slate-100 rounded transition-colors">
              <Copy size={10} className="text-slate-400" />
            </button>
          </div>
          <div className="flex-1" />
          <button onClick={compartirWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-colors">
            <MessageSquare size={13} /> WhatsApp
          </button>
          <button onClick={compartirEmail} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors">
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
            { id: "programa", label: "Programa de Recompensas", icono: Gift },
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

          {/* Progreso del nivel */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Tu Progreso
            </h3>
            <div className="flex items-center gap-4">
              {RECOMPENSAS.map((nivel) => {
                const IconoNivel = nivel.icono;
                const alcanzado = stats.completados >= nivel.referidos;
                const progreso = Math.min(100, (stats.completados / nivel.referidos) * 100);
                return (
                  <div key={nivel.nivel} className="flex-1 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 ${
                      alcanzado
                        ? `bg-gradient-to-br ${nivel.color} shadow-lg`
                        : "bg-slate-100"
                    }`}>
                      <IconoNivel size={24} className={alcanzado ? "text-white" : "text-slate-400"} />
                    </div>
                    <div className={`text-[11px] font-bold ${alcanzado ? "text-slate-800" : "text-slate-400"}`}>
                      {nivel.nombre}
                    </div>
                    <div className="text-[11px] text-slate-400">{nivel.referidos} referidos</div>
                    {!alcanzado && (
                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: `${progreso}%` }} />
                      </div>
                    )}
                    {alcanzado && (
                      <CheckCircle size={14} className="text-emerald-500 mx-auto mt-1" />
                    )}
                  </div>
                );
              })}
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

      {/* Tab Programa de Recompensas */}
      {tabActiva === "programa" && (
        <div className="space-y-6">
          {/* Header del programa */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Gift size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Programa de Referidos Premium</h3>
                <p className="text-amber-100 text-[12px] mt-1">
                  Por cada cliente que refieras y se apruebe su crédito, ganas recompensas increíbles
                </p>
              </div>
            </div>
          </div>

          {/* Niveles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOMPENSAS.map((nivel) => {
              const IconoNivel = nivel.icono;
              const alcanzado = stats.completados >= nivel.referidos;
              return (
                <div key={nivel.nivel} className={`bg-white rounded-2xl border p-5 shadow-soft text-center hover:shadow-md transition-shadow ${
                  alcanzado ? "border-purple-200 ring-2 ring-purple-100" : "border-slate-100/80"
                }`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${nivel.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <IconoNivel size={28} className="text-white" />
                  </div>
                  <div className="text-lg font-bold text-slate-800 mb-1">Nivel {nivel.nivel}</div>
                  <div className="text-sm font-semibold text-purple-600 mb-2">{nivel.nombre}</div>
                  <div className="text-[11px] text-slate-400 mb-3">
                    {nivel.referidos} referido{nivel.referidos > 1 ? "s" : ""} convertido{nivel.referidos > 1 ? "s" : ""}
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100/50">
                    <div className="text-[10px] text-purple-400 font-medium">Recompensa</div>
                    <div className="text-sm font-bold text-purple-700">{nivel.recompensa}</div>
                  </div>
                  {alcanzado && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle size={12} /> Alcanzado
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cómo funciona */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4">¿Cómo funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { paso: 1, titulo: "Comparte tu link", descripcion: "Envía tu link único por WhatsApp, email o redes sociales", icono: Share2, color: "from-blue-400 to-blue-500" },
                { paso: 2, titulo: "Amigo se registra", descripcion: "Tu amigo ingresa al link y completa el formulario", icono: Users, color: "from-purple-400 to-purple-500" },
                { paso: 3, titulo: "Se aprueba crédito", descripcion: "El equipo evalúa y aprueba la solicitud", icono: CheckCircle, color: "from-emerald-400 to-emerald-500" },
                { paso: 4, titulo: "¡Gana recompensa!", descripcion: "Recibes tu recompensa en dinero o beneficios", icono: Gift, color: "from-amber-400 to-amber-500" },
              ].map((paso) => {
                const IconoPaso = paso.icono;
                return (
                  <div key={paso.paso} className="text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${paso.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                      <IconoPaso size={22} className="text-white" />
                    </div>
                    <div className="text-[10px] text-purple-400 font-bold mb-1">PASO {paso.paso}</div>
                    <div className="text-[12px] font-bold text-slate-800 mb-1">{paso.titulo}</div>
                    <div className="text-[10px] text-slate-400">{paso.descripcion}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beneficios */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Beneficios adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { titulo: "Comisión del 0.5%", descripcion: "Gana el 0.5% del monto del crédito aprobado", icono: Percent, color: "text-emerald-500" },
                { titulo: "Bonos escalonados", descripcion: "A más referidos, mayores bonos por conversión", icono: TrendingUp, color: "text-blue-500" },
                { titulo: "Pagos rápidos", descripcion: "Comisiones pagadas en máximo 48 horas", icono: Zap, color: "text-amber-500" },
              ].map((beneficio, idx) => {
                const IconoBeneficio = beneficio.icono;
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50/80 rounded-xl">
                    <IconoBeneficio size={20} className={beneficio.color} />
                    <div>
                      <div className="text-[12px] font-bold text-slate-700">{beneficio.titulo}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{beneficio.descripcion}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
