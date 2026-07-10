"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Mail,
  Phone,
  Clock,
  Key,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { USUARIOS_MOCK } from "@/datos/mock";
import { ESTADOS_USUARIO_CONFIG, ROLES_CONFIG } from "@/tipos";
import { formatoMoneda } from "@/lib/utils";
import type { Usuario, Rol, EstadoUsuario } from "@/tipos";

export default function UsuariosPage() {
  const router = useRouter();
  const ahora = useMemo(() => Date.now(), []); // eslint-disable-line react-hooks/purity
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | "todos">("todos");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const res = await fetch("/api/usuarios");
        const json = await res.json();
        if (json.success && json.data) {
          setUsuarios(json.data.map((u: Record<string, any>) => ({
            ...u,
            ultimoAcceso: u.ultimoAcceso ? new Date(u.ultimoAcceso) : undefined,
            creadoEn: u.creadoEn ? new Date(u.creadoEn) : new Date(),
          })));
        }
      } catch {
        setUsuarios([]);
      } finally {
        setCargando(false);
      }
    }
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((user) => {
    const coincideBusqueda =
      !busqueda ||
      user.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === "todos" || user.rol === filtroRol;
    const coincideEstado = filtroEstado === "todos" || user.estado === filtroEstado;
    return coincideBusqueda && coincideRol && coincideEstado;
  });

  const estadisticas = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.estado === "ACTIVO").length,
    inactivos: usuarios.filter((u) => u.estado === "INACTIVO").length,
    suspendidos: usuarios.filter((u) => u.estado === "SUSPENDIDO").length,
  };

  const handleCambiarEstado = async (usuarioId: string, nuevoEstado: EstadoUsuario) => {
    try {
      await fetch(`/api/usuarios/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioId ? { ...u, estado: nuevoEstado } : u
        )
      );
    } catch {
      // Error silencioso
    }
  };

  const getIniciales = (nombre: string, apellido: string) => {
    return `${nombre[0]}${apellido[0]}`;
  };

  const getTiempoDesde = (fecha?: Date) => {
    if (!fecha) return "Nunca";
    const diff = ahora - fecha.getTime();
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (horas < 1) return "Hace minutos";
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${dias}d`;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Usuarios y Roles</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={() => {
              setUsuarioSeleccionado(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
          >
            <Plus size={14} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{estadisticas.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activos</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{estadisticas.activos}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <UserX size={14} className="text-slate-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Inactivos</span>
          </div>
          <div className="text-xl font-bold text-slate-600">{estadisticas.inactivos}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX size={14} className="text-red-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Suspendidos</span>
          </div>
          <div className="text-xl font-bold text-red-600">{estadisticas.suspendidos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as Rol | "todos")}
          className="px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
        >
          <option value="todos">Todos los roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Administrador</option>
          <option value="GERENTE">Gerente</option>
          <option value="AGENTE">Agente</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoUsuario | "todos")}
          className="px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
        >
          <option value="todos">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Último Acceso</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">2FA</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((user) => (
              <tr key={user.id} className="border-b border-slate-50/80 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/usuarios/${user.id}`)}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shadow-sm ${
                      user.rol === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      user.rol === 'ADMIN' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      user.rol === 'GERENTE' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                      'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      {getIniciales(user.nombre, user.apellido)}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">{user.nombre} {user.apellido}</div>
                      <div className="text-[10px] text-slate-400 font-medium">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-0.5">
                    <Mail size={10} className="text-slate-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Phone size={10} className="text-slate-400" />
                    {user.telefono}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${ROLES_CONFIG[user.rol].color}`}>
                    {ROLES_CONFIG[user.rol].label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${ESTADOS_USUARIO_CONFIG[user.estado].color}`}>
                    {ESTADOS_USUARIO_CONFIG[user.estado].label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock size={10} className="text-slate-400" />
                    {getTiempoDesde(user.ultimoAcceso)}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {user.doisFA ? (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <Key size={10} />
                      Activo
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">No</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Ver perfil">
                      <Eye size={13} className="text-slate-400" />
                    </button>
                    <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit size={13} className="text-blue-500" />
                    </button>
                    <button className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors" title="Restablecer contraseña">
                      <RefreshCw size={13} className="text-amber-500" />
                    </button>
                    {user.estado === "ACTIVO" ? (
                      <button 
                        onClick={() => handleCambiarEstado(user.id, "SUSPENDIDO")}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Suspender"
                      >
                        <UserX size={13} className="text-red-500" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCambiarEstado(user.id, "ACTIVO")}
                        className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" 
                        title="Activar"
                      >
                        <UserCheck size={13} className="text-emerald-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Información de permisos */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Roles y Permisos</h3>
            <p className="text-[10px] text-slate-400">Solo Super Admin puede gestionar usuarios</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(ROLES_CONFIG).map(([key, config]) => (
            <div key={key} className="bg-white/10 rounded-xl p-3">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.color}`}>
                {config.label}
              </span>
              <p className="text-[10px] text-slate-400 mt-2">{config.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}