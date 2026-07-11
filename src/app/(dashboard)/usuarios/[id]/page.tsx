"use client";

import { useState, useMemo, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Award,
  FileText,
  Building2,
  Home,
  Eye,
  ChevronRight,
  Activity,
  BarChart3,
  Star,
  Key,
  Settings,
  Bell,
  Download,
  X,
  Save,
  Lock,
  Percent,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { ROLES_CONFIG, ESTADOS_USUARIO_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF, formatoMoneda } from "@/lib/utils";
import { toast } from "sonner";
import type { Usuario, Lead, Etapa } from "@/tipos";
import { useLeads } from "@/lib/contexts/LeadContext";

// Actividad mock del usuario
function generarActividadUsuario(nombreUsuario: string) {
  const hoy = new Date();
  return [
    { id: "a1", tipo: "llamada", titulo: "Llamada de seguimiento", descripcion: `Contacto con cliente sobre documentos`, fecha: new Date(hoy.getTime() - 3600000), icono: Phone, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "a2", tipo: "whatsapp", titulo: "Mensaje enviado", descripcion: "Recordatorio de reunión", fecha: new Date(hoy.getTime() - 86400000), icono: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { id: "a3", tipo: "email", titulo: "Email de propuesta", descripcion: "Envío de condiciones crediticias", fecha: new Date(hoy.getTime() - 172800000), icono: Mail, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "a4", tipo: "reunion", titulo: "Reunión completada", descripcion: "Firma de documentos", fecha: new Date(hoy.getTime() - 259200000), icono: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "a5", tipo: "documento", titulo: "Documento aprobado", descripcion: "Cédula de identidad verificada", fecha: new Date(hoy.getTime() - 345600000), icono: FileText, color: "text-amber-500", bg: "bg-amber-50" },
  ];
}

// Datos de rendimiento mensual del usuario
const RENDIMIENTO_MENSUAL = [
  { mes: "Ene", leads: 12, aprobados: 4, monto: 320 },
  { mes: "Feb", leads: 15, aprobados: 5, monto: 410 },
  { mes: "Mar", leads: 18, aprobados: 6, monto: 480 },
  { mes: "Abr", leads: 14, aprobados: 5, monto: 390 },
  { mes: "May", leads: 20, aprobados: 8, monto: 640 },
  { mes: "Jun", leads: 22, aprobados: 9, monto: 720 },
  { mes: "Jul", leads: 19, aprobados: 7, monto: 560 },
  { mes: "Ago", leads: 16, aprobados: 6, monto: 480 },
  { mes: "Sep", leads: 24, aprobados: 10, monto: 800 },
  { mes: "Oct", leads: 28, aprobados: 12, monto: 960 },
  { mes: "Nov", leads: 25, aprobados: 11, monto: 880 },
  { mes: "Dic", leads: 21, aprobados: 9, monto: 720 },
];

export default function UsuarioPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { leads } = useLeads();
  const [esSuperAdmin, setEsSuperAdmin] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const res = await fetch(`/api/usuarios/${id}`, { credentials: "include" });
        const json = await res.json();
        if (json.success && json.data) {
          setUsuario({
            ...json.data,
            ultimoAcceso: json.data.ultimoAcceso ? new Date(json.data.ultimoAcceso) : undefined,
            creadoEn: json.data.creadoEn ? new Date(json.data.creadoEn) : new Date(),
          });
        }
      } catch {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }
    cargarUsuario();
  }, [id]);

  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [configuracionOpen, setConfiguracionOpen] = useState(false);
  const [editarNombre, setEditarNombre] = useState("");
  const [editarApellido, setEditarApellido] = useState("");
  const [editarEmail, setEditarEmail] = useState("");
  const [editarTelefono, setEditarTelefono] = useState("");
  const [editarRol, setEditarRol] = useState("");

  const [comisionesPorRol, setComisionesPorRol] = useState({
    SUPER_ADMIN: { cobroCliente: 0, comisionAgente: 0 },
    ADMIN: { cobroCliente: 5, comisionAgente: 10 },
    GERENTE: { cobroCliente: 6, comisionAgente: 12 },
    EJECUTIVO: { cobroCliente: 7, comisionAgente: 15 },
    VISOR: { cobroCliente: 0, comisionAgente: 0 },
  });

  // Abrir modal de editar perfil
  const abrirEditarPerfil = () => {
    if (!usuario) return;
    setEditarNombre(usuario.nombre);
    setEditarApellido(usuario.apellido);
    setEditarEmail(usuario.email);
    setEditarTelefono(usuario.telefono || "");
    setEditarRol(usuario.rol);
    setEditarPerfilOpen(true);
  };

  // Guardar perfil
  const guardarPerfil = () => {
    toast.success("Perfil actualizado", {
      description: `${editarNombre} ${editarApellido} fue actualizado`,
    });
    setEditarPerfilOpen(false);
  };

  // Guardar configuración de comisiones
  const guardarComisiones = () => {
    toast.success("Configuración de comisiones actualizada", {
      description: "Los porcentajes por rol han sido guardados",
    });
    setConfiguracionOpen(false);
  };

  // Leads asignados al usuario (simulado - usando nombre del ejecutivo)
  const leadsAsignados = useMemo(() => {
    if (!usuario) return [];
    return leads.filter((l) => l.nombreEjecutivo === `${usuario.nombre} ${usuario.apellido}`);
  }, [leads, usuario]);

  // Estadísticas del usuario
  const stats = useMemo(() => {
    const totalLeads = leadsAsignados.length;
    const aprobados = leadsAsignados.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)).length;
    const enPipeline = leadsAsignados.filter((l) => !["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)).length;
    const montoTotal = leadsAsignados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const tasaConversion = totalLeads > 0 ? ((aprobados / totalLeads) * 100).toFixed(1) : "0";
    const ticketPromedio = aprobados > 0 ? montoTotal / aprobados : 0;

    // Leads por etapa
    const porEtapa: Record<string, number> = {};
    leadsAsignados.forEach((l) => {
      porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
    });

    // Leads por banco
    const porBanco: Record<string, number> = {};
    leadsAsignados.forEach((l) => {
      if (l.banco) porBanco[l.banco] = (porBanco[l.banco] || 0) + 1;
    });

    // Leads por origen
    const porOrigen: Record<string, number> = {};
    leadsAsignados.forEach((l) => {
      porOrigen[l.origen] = (porOrigen[l.origen] || 0) + 1;
    });

    return { totalLeads, aprobados, enPipeline, montoTotal, tasaConversion, ticketPromedio, porEtapa, porBanco, porOrigen };
  }, [leadsAsignados]);

  const actividad = useMemo(() => generarActividadUsuario(`${usuario?.nombre} ${usuario?.apellido}`), [usuario]);
  const rolConfig = ROLES_CONFIG[usuario?.rol || "AGENTE"];
  const estadoConfig = ESTADOS_USUARIO_CONFIG[usuario?.estado || "ACTIVO"];

  // Datos para gráficos
  const datosEtapa = useMemo(() => {
    return Object.entries(stats.porEtapa).map(([etapa, cantidad]) => ({
      nombre: ETAPAS_CONFIG[etapa as Etapa]?.label || etapa,
      valor: cantidad,
      color: ETAPAS_CONFIG[etapa as Etapa]?.color || "#64748B",
    }));
  }, [stats]);

  const datosBanco = useMemo(() => {
    return Object.entries(stats.porBanco).map(([banco, cantidad]) => ({
      nombre: banco.length > 10 ? banco.substring(0, 10) + "..." : banco,
      valor: cantidad,
    }));
  }, [stats]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando usuario...</span>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Users size={24} className="text-slate-300" />
        </div>
        <h2 className="text-sm font-bold text-slate-600 mb-1">Usuario no encontrado</h2>
        <p className="text-[11px] text-slate-400 mb-4">El usuario que buscas no existe.</p>
        <button onClick={() => router.push("/usuarios")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Volver a Usuarios
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        {/* Perfil */}
        <div className="px-6 pb-5 -mt-10 relative">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-slate-900">{usuario.nombre} {usuario.apellido}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400 font-medium">{usuario.email}</span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${rolConfig.color}`}>
                    {rolConfig.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estadoConfig.color}`}>
                    {estadoConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={abrirEditarPerfil}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                <Edit size={14} /> Editar Perfil
              </button>
              {esSuperAdmin && (
                <button
                  onClick={() => setConfiguracionOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Settings size={14} /> Configuración
                </button>
              )}
            </div>
          </div>

          {/* Stats del perfil */}
          <div className="grid grid-cols-5 gap-3 mt-5">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-100/50">
              <div className="text-[9px] text-blue-500 font-medium uppercase tracking-wider mb-1">Total Leads</div>
              <div className="text-lg font-bold text-blue-700">{stats.totalLeads}</div>
              <div className="text-[10px] text-blue-500 font-medium">asignados</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-100/50">
              <div className="text-[9px] text-emerald-500 font-medium uppercase tracking-wider mb-1">Aprobados</div>
              <div className="text-lg font-bold text-emerald-700">{stats.aprobados}</div>
              <div className="text-[10px] text-emerald-500 font-medium">créditos</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-100/50">
              <div className="text-[9px] text-purple-500 font-medium uppercase tracking-wider mb-1">Monto Total</div>
              <div className="text-lg font-bold text-purple-700">{formatoMonedaAbreviado(stats.montoTotal)}</div>
              <div className="text-[10px] text-purple-500 font-medium">financiado</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-100/50">
              <div className="text-[9px] text-amber-500 font-medium uppercase tracking-wider mb-1">Conversión</div>
              <div className="text-lg font-bold text-amber-700">{stats.tasaConversion}%</div>
              <div className="text-[10px] text-amber-500 font-medium">tasa</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-3 border border-indigo-100/50">
              <div className="text-[9px] text-indigo-500 font-medium uppercase tracking-wider mb-1">Ticket Prom.</div>
              <div className="text-lg font-bold text-indigo-700">{formatoMonedaAbreviado(stats.ticketPromedio)}</div>
              <div className="text-[10px] text-indigo-500 font-medium">por crédito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-3 gap-5">
        {/* Columna Izquierda */}
        <div className="col-span-2 space-y-5">
          {/* Rendimiento Mensual */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Rendimiento Mensual</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[9px] text-slate-500">Leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-500">Aprobados</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={RENDIMIENTO_MENSUAL}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAprobados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="url(#colorLeads)" strokeWidth={2} />
                <Area type="monotone" dataKey="aprobados" stroke="#10B981" fill="url(#colorAprobados)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Leads Asignados */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Leads Asignados ({leadsAsignados.length})</h3>
              <button className="text-[10px] text-blue-600 font-semibold hover:text-blue-700">Ver todos →</button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {leadsAsignados.slice(0, 8).map((lead) => {
                const config = ETAPAS_CONFIG[lead.etapa];
                return (
                  <div
                    key={lead.id}
                    onClick={() => router.push(`/clientes/${lead.id}`)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-bold">
                      {lead.nombre[0]}{lead.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-800 truncate">{lead.nombre} {lead.apellido}</div>
                      <div className="text-[9px] text-slate-400">{lead.rut}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-800">{formatoMonedaAbreviado(lead.montoSolicitado || 0)}</div>
                      <div className="flex items-center gap-1 justify-end">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config?.color }} />
                        <span className="text-[8px] text-slate-500">{config?.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leads por Banco */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Banco</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datosBanco}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                <Bar dataKey="valor" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-5">
          {/* Información Personal */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              Información Personal
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail size={14} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400">Email</div>
                  <div className="text-[11px] font-semibold text-slate-800">{usuario.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone size={14} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400">Teléfono</div>
                  <div className="text-[11px] font-semibold text-slate-800">{usuario.telefono || "No registrado"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Shield size={14} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400">Rol</div>
                  <div className="text-[11px] font-semibold text-slate-800">{rolConfig.label}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Clock size={14} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400">Último Acceso</div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {usuario.ultimoAcceso ? usuario.ultimoAcceso.toLocaleDateString("es-CL") : "Nunca"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar size={14} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400">Miembro desde</div>
                  <div className="text-[11px] font-semibold text-slate-800">{usuario.creadoEn.toLocaleDateString("es-CL")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              {actividad.map((act, i) => (
                <div key={act.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-lg ${act.bg} flex items-center justify-center`}>
                      <act.icono size={14} className={act.color} />
                    </div>
                    {i < actividad.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="text-[10px] font-semibold text-slate-800">{act.titulo}</div>
                    <div className="text-[9px] text-slate-500">{act.descripcion}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">
                      {act.fecha.toLocaleDateString("es-CL")} • {act.fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución por Etapa */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución por Etapa</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={datosEtapa}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="valor"
                >
                  {datosEtapa.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {datosEtapa.slice(0, 6).map((item) => (
                <div key={item.nombre} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[8px] text-slate-500 truncate">{item.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Key size={16} className="text-slate-500" />
              Seguridad
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${usuario.doisFA ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className="text-[10px] text-slate-600">Autenticación 2FA</span>
                </div>
                <span className={`text-[9px] font-semibold ${usuario.doisFA ? "text-emerald-600" : "text-slate-400"}`}>
                  {usuario.doisFA ? "Activa" : "Inactiva"}
                </span>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 rounded-xl text-[10px] text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                <Key size={12} /> Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Perfil */}
      {editarPerfilOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Editar Perfil</h3>
                <button onClick={() => setEditarPerfilOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={editarNombre}
                    onChange={(e) => setEditarNombre(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Apellido</label>
                  <input
                    type="text"
                    value={editarApellido}
                    onChange={(e) => setEditarApellido(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editarEmail}
                  onChange={(e) => setEditarEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Teléfono</label>
                <input
                  type="tel"
                  value={editarTelefono}
                  onChange={(e) => setEditarTelefono(e.target.value)}
                  placeholder="+56 9 XXXX XXXX"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              {esSuperAdmin && (
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Rol</label>
                  <select
                    value={editarRol}
                    onChange={(e) => setEditarRol(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="EJECUTIVO">Ejecutivo</option>
                    <option value="VISOR">Visor</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditarPerfilOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarPerfil}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuración (Solo Super Admin) */}
      {configuracionOpen && esSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-purple-600" />
                  <h3 className="text-base font-bold text-slate-800">Configuración del Sistema</h3>
                </div>
                <button onClick={() => setConfiguracionOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Configuración general de comisiones por rol de usuario</p>
            </div>
            <div className="p-5">
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-purple-500" />
                  <span className="text-[10px] font-semibold text-purple-700">Solo Super Admin puede modificar esta configuración</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                  <Percent size={14} className="text-emerald-500" />
                  Comisiones por Rol
                </h4>

                {Object.entries(comisionesPorRol).map(([rol, config]) => {
                  const rolInfo = ROLES_CONFIG[rol as keyof typeof ROLES_CONFIG];
                  return (
                    <div key={rol} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${rolInfo?.color || "bg-slate-100 text-slate-600"}`}>
                          {rolInfo?.label || rol}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-500 mb-1 block">% Cobro al Cliente</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={config.cobroCliente}
                              onChange={(e) => setComisionesPorRol((prev) => ({
                                ...prev,
                                [rol]: { ...prev[rol as keyof typeof prev], cobroCliente: Number(e.target.value) }
                              }))}
                              min="0"
                              max="15"
                              step="0.5"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 mb-1 block">% Comisión Agente</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={config.comisionAgente}
                              onChange={(e) => setComisionesPorRol((prev) => ({
                                ...prev,
                                [rol]: { ...prev[rol as keyof typeof prev], comisionAgente: Number(e.target.value) }
                              }))}
                              min="0"
                              max="50"
                              step="5"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                          </div>
                        </div>
                      </div>
                      {config.cobroCliente > 0 && config.comisionAgente > 0 && (
                        <div className="mt-2 text-[9px] text-slate-500">
                          Ejemplo con crédito de $100.000.000: Empresa cobra ${formatoMoneda(100000000 * config.cobroCliente / 100)} → Agente recibe ${formatoMoneda(100000000 * config.cobroCliente / 100 * config.comisionAgente / 100)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-5">
                <button
                  onClick={() => setConfiguracionOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarComisiones}
                  className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl text-[11px] font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
