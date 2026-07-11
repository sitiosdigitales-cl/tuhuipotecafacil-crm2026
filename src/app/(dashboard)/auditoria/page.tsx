"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Clock,
  User,
  Globe,
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { ACCIONES_AUDITORIA_CONFIG } from "@/tipos";
import type { RegistroAuditoria, TipoAccion } from "@/tipos";

const iconoAccion: Record<TipoAccion, React.ReactNode> = {
  CREAR: <Plus size={14} />,
  EDITAR: <Edit size={14} />,
  ELIMINAR: <Trash2 size={14} />,
  RESTAURAR: <RefreshCw size={14} />,
  LOGIN: <LogIn size={14} />,
  LOGOUT: <LogOut size={14} />,
  EXPORTAR: <Download size={14} />,
  IMPORTAR: <ArrowUpRight size={14} />,
  CAMBIO_ROL: <User size={14} />,
  CAMBIO_ESTADO: <ArrowDownRight size={14} />,
};

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/auditoria");
        const json = await res.json();
        if (json.success && json.data) {
          setRegistros(json.data.map((r: Record<string, any>) => ({
            ...r,
            fecha: r.fecha ? new Date(r.fecha) : new Date(),
          })));
        }
      } catch {
        setRegistros([]);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAccion, setFiltroAccion] = useState<TipoAccion | "todos">("todos");
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroAuditoria | null>(null);

  const registrosFiltrados = registros.filter((reg) => {
    const coincideBusqueda =
      !busqueda ||
      reg.usuarioNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      reg.modulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      reg.registroNombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideAccion = filtroAccion === "todos" || reg.accion === filtroAccion;
    return coincideBusqueda && coincideAccion;
  });

  const estadisticas = {
    total: registros.length,
    creaciones: registros.filter((r) => r.accion === "CREAR").length,
    ediciones: registros.filter((r) => r.accion === "EDITAR").length,
    eliminaciones: registros.filter((r) => r.accion === "ELIMINAR").length,
    logins: registros.filter((r) => r.accion === "LOGIN").length,
  };

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Auditoría del Sistema</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Registro de todas las actividades del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <RefreshCw size={14} /> Actualizar
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
            <Download size={14} /> Exportar Registro
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Total Registros</div>
          <div className="text-xl font-bold text-slate-900">{estadisticas.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Creaciones</div>
          <div className="text-xl font-bold text-emerald-600">{estadisticas.creaciones}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Ediciones</div>
          <div className="text-xl font-bold text-blue-600">{estadisticas.ediciones}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Eliminaciones</div>
          <div className="text-xl font-bold text-red-600">{estadisticas.eliminaciones}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Logins</div>
          <div className="text-xl font-bold text-indigo-600">{estadisticas.logins}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, módulo o registro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
          />
        </div>
        <select
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value as TipoAccion | "todos")}
          className="px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
        >
          <option value="todos">Todas las acciones</option>
          <option value="CREAR">Crear</option>
          <option value="EDITAR">Editar</option>
          <option value="ELIMINAR">Eliminar</option>
          <option value="LOGIN">Login</option>
          <option value="CAMBIO_ROL">Cambio Rol</option>
          <option value="CAMBIO_ESTADO">Cambio Estado</option>
        </select>
      </div>

      {/* Timeline de auditoría */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
        <div className="divide-y divide-slate-100">
          {registrosFiltrados.map((reg) => (
            <div
              key={reg.id}
              className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => setRegistroSeleccionado(registroSeleccionado?.id === reg.id ? null : reg)}
            >
              <div className="flex items-start gap-4">
                {/* Icono de acción */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCIONES_AUDITORIA_CONFIG[reg.accion].color}`}>
                  {iconoAccion[reg.accion]}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-800">{reg.usuarioNombre}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${ACCIONES_AUDITORIA_CONFIG[reg.accion].color}`}>
                      {ACCIONES_AUDITORIA_CONFIG[reg.accion].label}
                    </span>
                    <span className="text-[10px] text-slate-500">{reg.modulo}</span>
                  </div>
                  
                  {reg.registroNombre && (
                    <div className="text-[10px] text-slate-600 mb-1">
                      Registro: <span className="font-medium">{reg.registroNombre}</span>
                    </div>
                  )}

                  {reg.valorAnterior && reg.valorNuevo && (
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                      <span className="text-red-500 line-through">{reg.valorAnterior}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-600 font-medium">{reg.valorNuevo}</span>
                    </div>
                  )}

                  {reg.motivo && (
                    <div className="text-[10px] text-slate-500 mt-1 italic">
                      Motivo: {reg.motivo}
                    </div>
                  )}
                </div>

                {/* Información técnica */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                    <Clock size={10} className="text-slate-400" />
                    {formatearFecha(reg.fecha)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe size={9} />
                      {reg.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      {reg.dispositivo === "Desktop" ? <Monitor size={9} /> : <Smartphone size={9} />}
                      {reg.dispositivo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {registroSeleccionado?.id === reg.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">ID Registro</div>
                    <div className="text-[11px] text-slate-700 font-medium">{reg.registroId || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Navegador</div>
                    <div className="text-[11px] text-slate-700 font-medium">{reg.navegador}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Dirección IP</div>
                    <div className="text-[11px] text-slate-700 font-medium">{reg.ip}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Dispositivo</div>
                    <div className="text-[11px] text-slate-700 font-medium">{reg.dispositivo}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nota de seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-semibold text-amber-800 mb-1">Registros Inmutables</div>
          <div className="text-[10px] text-amber-700">
            Los registros de auditoría no pueden ser eliminados ni modificados por ningún usuario, incluido el Super Admin.
            Esta información es requerida para el cumplimiento normativo y la seguridad del sistema.
          </div>
        </div>
      </div>
    </div>
  );
}