"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Clock,
  Edit,
  Trash2,
  Eye,
  Download,
  MoreVertical,
  Lock,
  X,
} from "lucide-react";
import { ESTADOS_USUARIO_CONFIG, ROLES_CONFIG } from "@/tipos";
import { toast } from "sonner";
import { useUser } from "@/modulos/usuarios";
import type { Usuario, Rol, EstadoUsuario } from "@/tipos";

export default function UsuariosPage() {
  const router = useRouter();
  const { esSuperAdmin } = useUser();
  const ahora = useMemo(() => Date.now(), []);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | "todos">("ACTIVO");
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  // Modal nuevo usuario
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formApellido, setFormApellido] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formRol, setFormRol] = useState<Rol>("AGENTE");
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Modal editar usuario
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editRol, setEditRol] = useState<Rol>("AGENTE");
  const [editError, setEditError] = useState("");

  // Modal restablecer contraseña
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [passwordUsuario, setPasswordUsuario] = useState<Usuario | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const res = await fetch("/api/usuarios", { credentials: "include" });
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

  // Cerrar menu al hacer click fuera
  useEffect(() => {
    if (!menuAbierto) return;
    const handler = () => setMenuAbierto(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuAbierto]);

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

  // === FUNCIONES ===

  const handleCambiarEstado = async (usuarioId: string, nuevoEstado: EstadoUsuario) => {
    try {
      const res = await fetch(`/api/usuarios/${usuarioId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        setUsuarios((prev) => prev.map((u) => u.id === usuarioId ? { ...u, estado: nuevoEstado } : u));
        toast.success(nuevoEstado === "ACTIVO" ? "Usuario activado" : "Usuario suspendido");
      }
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleEliminar = async (user: Usuario, hardDelete = false) => {
    const accion = hardDelete ? "eliminar permanentemente" : "desactivar";
    const confirmado = window.confirm(`¿Estás seguro de ${accion} la cuenta de ${user.nombre} ${user.apellido}?\n\n${hardDelete ? "Esta acción NO se puede deshacer." : "El usuario quedará INACTIVO."}`);
    if (!confirmado) return;
    try {
      const url = hardDelete ? `/api/usuarios/${user.id}?hard=true` : `/api/usuarios/${user.id}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        if (hardDelete) {
          setUsuarios((prev) => prev.filter((u) => u.id !== user.id));
          toast.success(`${user.nombre} eliminado permanentemente`);
        } else {
          setUsuarios((prev) => prev.map((u) => u.id === user.id ? { ...u, estado: "INACTIVO" } : u));
          toast.success(`${user.nombre} desactivado`);
        }
      } else if (res.status === 403) {
        toast.error("Solo Super Admin puede eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  // Crear usuario
  const handleCrearUsuario = async () => {
    setFormError("");
    if (!formNombre.trim() || !formApellido.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError("Nombre, apellido, email y contraseña son requeridos");
      return;
    }
    if (formPassword.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre.trim(),
          apellido: formApellido.trim(),
          email: formEmail.trim(),
          password: formPassword,
          telefono: formTelefono.trim() || null,
          rol: formRol,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNuevoOpen(false);
        resetForm();
        const reload = await fetch("/api/usuarios", { credentials: "include" });
        const reloadData = await reload.json();
        if (reloadData.success && reloadData.data) {
          setUsuarios(reloadData.data.map((u: Record<string, any>) => ({
            ...u,
            ultimoAcceso: u.ultimoAcceso ? new Date(u.ultimoAcceso) : undefined,
            creadoEn: u.creadoEn ? new Date(u.creadoEn) : new Date(),
          })));
        }
        toast.success("Usuario creado exitosamente");
      } else {
        setFormError(data.error || "Error al crear usuario");
      }
    } catch {
      setFormError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Editar usuario
  const handleEditar = (user: Usuario) => {
    setEditandoUsuario(user);
    setEditNombre(user.nombre);
    setEditApellido(user.apellido);
    setEditEmail(user.email);
    setEditTelefono(user.telefono || "");
    setEditRol(user.rol);
    setEditError("");
    setModalEditarOpen(true);
    setMenuAbierto(null);
  };

  const handleGuardarEdicion = async () => {
    if (!editandoUsuario) return;
    setEditError("");
    if (!editNombre.trim() || !editApellido.trim() || !editEmail.trim()) {
      setEditError("Nombre, apellido y email son requeridos");
      return;
    }
    try {
      const res = await fetch(`/api/usuarios/${editandoUsuario.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          apellido: editApellido.trim(),
          email: editEmail.trim(),
          telefono: editTelefono.trim() || null,
          rol: editRol,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsuarios((prev) => prev.map((u) =>
          u.id === editandoUsuario.id
            ? { ...u, nombre: editNombre.trim(), apellido: editApellido.trim(), email: editEmail.trim(), telefono: editTelefono.trim(), rol: editRol }
            : u
        ));
        setModalEditarOpen(false);
        toast.success("Usuario actualizado");
      } else {
        setEditError(data.error || "Error al actualizar");
      }
    } catch {
      setEditError("Error de conexión");
    }
  };

  // Restablecer contraseña
  const handleAbrirPassword = (user: Usuario) => {
    setPasswordUsuario(user);
    setNuevaPassword("");
    setPasswordError("");
    setModalPasswordOpen(true);
    setMenuAbierto(null);
  };

  const handleRestablecerPassword = async () => {
    if (!passwordUsuario) return;
    setPasswordError("");
    if (nuevaPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      const res = await fetch(`/api/usuarios/${passwordUsuario.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nuevaPassword }),
      });
      if (res.ok) {
        setModalPasswordOpen(false);
        toast.success(`Contraseña de ${passwordUsuario.nombre} actualizada`);
      } else {
        setPasswordError("Error al actualizar contraseña");
      }
    } catch {
      setPasswordError("Error de conexión");
    }
  };

  // Exportar CSV
  const handleExportarCSV = () => {
    const headers = ["Nombre", "Apellido", "Email", "Telefono", "Rol", "Estado", "Ultimo Acceso", "Creado"];
    const rows = usuariosFiltrados.map((u) => [
      u.nombre,
      u.apellido,
      u.email,
      u.telefono || "",
      ROLES_CONFIG[u.rol]?.label || u.rol,
      ESTADOS_USUARIO_CONFIG[u.estado]?.label || u.estado,
      u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString("es-CL") : "Nunca",
      u.creadoEn ? new Date(u.creadoEn).toLocaleDateString("es-CL") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente");
  };

  const resetForm = () => {
    setFormNombre("");
    setFormApellido("");
    setFormEmail("");
    setFormPassword("");
    setFormTelefono("");
    setFormRol("AGENTE");
    setFormError("");
  };

  const getTiempoDesde = (fecha?: Date) => {
    if (!fecha) return "Nunca";
    const diff = ahora - fecha.getTime();
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (horas < 1) return "Ahora";
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
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
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {usuariosFiltrados.length} de {usuarios.length} usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportarCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            onClick={() => { resetForm(); setModalNuevoOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
          >
            <Plus size={14} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{estadisticas.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activos</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{estadisticas.activos}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <UserX size={14} className="text-slate-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Inactivos</span>
          </div>
          <div className="text-xl font-bold text-slate-600">{estadisticas.inactivos}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
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
          <option value="ACTIVO">Solo activos</option>
          <option value="todos">Todos los estados</option>
          <option value="INACTIVO">Inactivos</option>
          <option value="SUSPENDIDO">Suspendidos</option>
        </select>
      </div>

      {/* Grid de usuarios */}
      {usuariosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100/80 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserX size={24} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No se encontraron usuarios</h3>
          <p className="text-xs text-slate-400">Intenta con otros filtros o crea un nuevo usuario</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuariosFiltrados.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 hover:shadow-lg transition-all group relative"
            >
              {/* Header de card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                    user.rol === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    user.rol === 'ADMIN' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    user.rol === 'GERENTE' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {user.nombre[0]}{user.apellido[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">{user.nombre} {user.apellido}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${ROLES_CONFIG[user.rol].color}`}>
                        {ROLES_CONFIG[user.rol].label}
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${ESTADOS_USUARIO_CONFIG[user.estado].color}`}>
                        {ESTADOS_USUARIO_CONFIG[user.estado].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu de acciones */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === user.id ? null : user.id); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={14} className="text-slate-400" />
                  </button>

                  {menuAbierto === user.id && (
                    <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 overflow-hidden">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/usuarios/${user.id}`); setMenuAbierto(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Eye size={13} className="text-slate-400" /> Ver perfil
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditar(user); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Edit size={13} className="text-blue-500" /> Editar usuario
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAbrirPassword(user); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Lock size={13} className="text-amber-500" /> Restablecer contraseña
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      {user.estado === "ACTIVO" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCambiarEstado(user.id, "SUSPENDIDO"); setMenuAbierto(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <UserX size={13} /> Suspender
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCambiarEstado(user.id, "ACTIVO"); setMenuAbierto(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <UserCheck size={13} /> Activar
                        </button>
                      )}
                      {esSuperAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEliminar(user, false); setMenuAbierto(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <UserX size={13} /> Desactivar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEliminar(user, true); setMenuAbierto(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} /> Eliminar permanently
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info de contacto */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Mail size={11} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Phone size={11} className="text-slate-400 flex-shrink-0" />
                  <span>{user.telefono || "Sin teléfono"}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Clock size={10} />
                  <span>Acceso: {getTiempoDesde(user.ultimoAcceso)}</span>
                </div>
                <button
                  onClick={() => router.push(`/usuarios/${user.id}`)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver perfil →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* === MODALES === */}

      {/* Modal Nuevo Usuario */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalNuevoOpen(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Plus size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nuevo Usuario</h3>
                  <p className="text-[10px] text-slate-400">Crear una nueva cuenta</p>
                </div>
              </div>
              <button onClick={() => { setModalNuevoOpen(false); resetForm(); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre *</label>
                  <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Juan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Apellido *</label>
                  <input type="text" value={formApellido} onChange={(e) => setFormApellido(e.target.value)} placeholder="Pérez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="juan@tuhipotecafacil.cl"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Contraseña *</label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Teléfono</label>
                <input type="tel" value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Rol</label>
                <select value={formRol} onChange={(e) => setFormRol(e.target.value as Rol)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium">
                  <option value="AGENTE">Agente</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => { setModalNuevoOpen(false); resetForm(); }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleCrearUsuario} disabled={guardando}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15 disabled:opacity-50">
                {guardando ? "Creando..." : "Crear Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditarOpen && editandoUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalEditarOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Edit size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Editar Usuario</h3>
                  <p className="text-[10px] text-slate-400">{editandoUsuario.nombre} {editandoUsuario.apellido}</p>
                </div>
              </div>
              <button onClick={() => setModalEditarOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">{editError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre *</label>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Apellido *</label>
                  <input type="text" value={editApellido} onChange={(e) => setEditApellido(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Teléfono</label>
                <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Rol</label>
                <select value={editRol} onChange={(e) => setEditRol(e.target.value as Rol)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium">
                  <option value="AGENTE">Agente</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setModalEditarOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleGuardarEdicion}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-amber-600/15">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña */}
      {modalPasswordOpen && passwordUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalPasswordOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Lock size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Restablecer Contraseña</h3>
                  <p className="text-[10px] text-slate-400">{passwordUsuario.nombre} {passwordUsuario.apellido}</p>
                </div>
              </div>
              <button onClick={() => setModalPasswordOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">{passwordError}</div>
              )}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nueva contraseña *</label>
                <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setModalPasswordOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleRestablecerPassword}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-red-600/15">
                Actualizar Contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
