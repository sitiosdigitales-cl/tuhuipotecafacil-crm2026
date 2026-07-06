"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  Users,
  Lock,
  Unlock,
  Check,
  X,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Settings,
  FileText,
  BarChart3,
  DollarSign,
  Calendar,
  MessageSquare,
  Bell,
  Database,
  Globe,
  Mail,
  Phone,
  Building2,
  UserCheck,
  AlertTriangle,
  Save,
  Copy,
  ArrowRight,
} from "lucide-react";
import { USUARIOS_MOCK } from "@/datos/mock";
import { ROLES_CONFIG } from "@/tipos";

// Módulos del sistema
const MODULOS = [
  {
    id: "dashboard",
    nombre: "Dashboard",
    icono: BarChart3,
    permisos: ["ver", "exportar"],
  },
  {
    id: "pipeline",
    nombre: "Pipeline",
    icono: ArrowRight,
    permisos: ["ver", "editar", "mover_etapa", "eliminar"],
  },
  {
    id: "leads",
    nombre: "Leads",
    icono: Users,
    permisos: ["ver", "crear", "editar", "eliminar", "asignar", "exportar"],
  },
  {
    id: "clientes",
    nombre: "Clientes",
    icono: UserCheck,
    permisos: ["ver", "crear", "editar", "eliminar"],
  },
  {
    id: "documentos",
    nombre: "Documentos",
    icono: FileText,
    permisos: ["ver", "subir", "aprobar", "rechazar", "eliminar"],
  },
  {
    id: "tareas",
    nombre: "Tareas",
    icono: Calendar,
    permisos: ["ver", "crear", "editar", "eliminar", "asignar"],
  },
  {
    id: "reportes",
    nombre: "Reportes",
    icono: BarChart3,
    permisos: ["ver", "exportar", "crear"],
  },
  {
    id: "comisiones",
    nombre: "Comisiones",
    icono: DollarSign,
    permisos: ["ver", "aprobar", "pagar"],
  },
  {
    id: "usuarios",
    nombre: "Usuarios",
    icono: Users,
    permisos: ["ver", "crear", "editar", "eliminar", "asignar_roles"],
  },
  {
    id: "configuracion",
    nombre: "Configuración",
    icono: Settings,
    permisos: ["ver", "editar"],
  },
  {
    id: "auditoria",
    nombre: "Auditoría",
    icono: Database,
    permisos: ["ver", "exportar"],
  },
  {
    id: "marketing",
    nombre: "Marketing",
    icono: Mail,
    permisos: ["ver", "crear", "editar", "eliminar", "enviar"],
  },
];

// Roles del sistema
const ROLES = [
  {
    id: "SUPER_ADMIN",
    nombre: "Super Admin",
    descripcion: "Acceso total al sistema sin restricciones",
    color: "from-purple-500 to-purple-600",
    usuarios: 1,
    esSistema: true,
  },
  {
    id: "ADMIN",
    nombre: "Administrador",
    descripcion: "Gestión avanzada del sistema y usuarios",
    color: "from-blue-500 to-blue-600",
    usuarios: 2,
    esSistema: true,
  },
  {
    id: "GERENTE",
    nombre: "Gerente",
    descripcion: "Supervisión de equipo y reportes",
    color: "from-amber-500 to-amber-600",
    usuarios: 2,
    esSistema: true,
  },
  {
    id: "AGENTE",
    nombre: "Agente",
    descripcion: "Operaciones básicas de ventas",
    color: "from-emerald-500 to-emerald-600",
    usuarios: 3,
    esSistema: true,
  },
  {
    id: "VISOR",
    nombre: "Visor",
    descripcion: "Solo lectura en todo el sistema",
    color: "from-slate-400 to-slate-500",
    usuarios: 0,
    esSistema: false,
  },
];

// Permisos por defecto por rol
const PERMISOS_POR_ROL: Record<string, Record<string, string[]>> = {
  SUPER_ADMIN: Object.fromEntries(MODULOS.map((m) => [m.id, m.permisos])),
  ADMIN: {
    dashboard: ["ver", "exportar"],
    pipeline: ["ver", "editar", "mover_etapa"],
    leads: ["ver", "crear", "editar", "eliminar", "asignar", "exportar"],
    clientes: ["ver", "crear", "editar", "eliminar"],
    documentos: ["ver", "subir", "aprobar", "rechazar"],
    tareas: ["ver", "crear", "editar", "eliminar", "asignar"],
    reportes: ["ver", "exportar", "crear"],
    comisiones: ["ver", "aprobar"],
    usuarios: ["ver", "crear", "editar"],
    configuracion: ["ver", "editar"],
    auditoria: ["ver", "exportar"],
    marketing: ["ver", "crear", "editar", "enviar"],
  },
  GERENTE: {
    dashboard: ["ver", "exportar"],
    pipeline: ["ver", "editar", "mover_etapa"],
    leads: ["ver", "crear", "editar", "asignar"],
    clientes: ["ver", "crear", "editar"],
    documentos: ["ver", "subir", "aprobar"],
    tareas: ["ver", "crear", "editar", "asignar"],
    reportes: ["ver", "exportar"],
    comisiones: ["ver"],
    usuarios: ["ver"],
    configuracion: ["ver"],
    auditoria: ["ver"],
    marketing: ["ver", "crear", "editar"],
  },
  AGENTE: {
    dashboard: ["ver"],
    pipeline: ["ver", "editar", "mover_etapa"],
    leads: ["ver", "crear", "editar"],
    clientes: ["ver", "crear", "editar"],
    documentos: ["ver", "subir"],
    tareas: ["ver", "crear", "editar"],
    reportes: ["ver"],
    comisiones: [],
    usuarios: [],
    configuracion: [],
    auditoria: [],
    marketing: ["ver"],
  },
  VISOR: {
    dashboard: ["ver"],
    pipeline: ["ver"],
    leads: ["ver"],
    clientes: ["ver"],
    documentos: ["ver"],
    tareas: ["ver"],
    reportes: ["ver"],
    comisiones: [],
    usuarios: [],
    configuracion: [],
    auditoria: ["ver"],
    marketing: ["ver"],
  },
};

const PERMISOS_LABELS: Record<string, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  asignar: "Asignar",
  exportar: "Exportar",
  subir: "Subir",
  aprobar: "Aprobar",
  rechazar: "Rechazar",
  mover_etapa: "Mover Etapa",
  asignar_roles: "Asignar Roles",
  enviar: "Enviar",
};

export default function PermisosPage() {
  const [rolSeleccionado, setRolSeleccionado] = useState("SUPER_ADMIN");
  const [permisos, setPermisos] = useState(PERMISOS_POR_ROL);
  const [busqueda, setBusqueda] = useState("");
  const [expandedModulos, setExpandedModulos] = useState<string[]>(["leads", "clientes"]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [modalNuevoRol, setModalNuevoRol] = useState(false);

  const rolActual = ROLES.find((r) => r.id === rolSeleccionado);
  const permisosActuales = permisos[rolSeleccionado] || {};

  const modulosFiltrados = useMemo(() => {
    if (!busqueda) return MODULOS;
    return MODULOS.filter((m) =>
      m.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [busqueda]);

  const togglePermiso = (moduloId: string, permiso: string) => {
    setPermisos((prev) => {
      const nuevosPermisos = { ...prev };
      if (!nuevosPermisos[rolSeleccionado]) {
        nuevosPermisos[rolSeleccionado] = {};
      }
      if (!nuevosPermisos[rolSeleccionado][moduloId]) {
        nuevosPermisos[rolSeleccionado][moduloId] = [];
      }

      const permisosModulo = [...nuevosPermisos[rolSeleccionado][moduloId]];
      const idx = permisosModulo.indexOf(permiso);

      if (idx >= 0) {
        permisosModulo.splice(idx, 1);
      } else {
        permisosModulo.push(permiso);
      }

      nuevosPermisos[rolSeleccionado][moduloId] = permisosModulo;
      return nuevosPermisos;
    });
  };

  const toggleTodosPermisos = (moduloId: string) => {
    const modulo = MODULOS.find((m) => m.id === moduloId);
    if (!modulo) return;

    const permisosActualesModulo = permisosActuales[moduloId] || [];
    const todosPermitidos = modulo.permisos.every((p) =>
      permisosActualesModulo.includes(p)
    );

    setPermisos((prev) => {
      const nuevosPermisos = { ...prev };
      if (!nuevosPermisos[rolSeleccionado]) {
        nuevosPermisos[rolSeleccionado] = {};
      }
      nuevosPermisos[rolSeleccionado][moduloId] = todosPermitidos
        ? []
        : [...modulo.permisos];
      return nuevosPermisos;
    });
  };

  const expandirColapsar = (moduloId: string) => {
    setExpandedModulos((prev) =>
      prev.includes(moduloId)
        ? prev.filter((id) => id !== moduloId)
        : [...prev, moduloId]
    );
  };

  const handleGuardar = () => {
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }, 1000);
  };

  const totalPermisos = useMemo(() => {
    let total = 0;
    let permitidos = 0;
    MODULOS.forEach((m) => {
      total += m.permisos.length;
      permitidos += (permisosActuales[m.id] || []).length;
    });
    return { total, permitidos };
  }, [permisosActuales]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Permisos y Roles
            </h1>
            <p className="text-slate-300 text-[11px] font-medium">
              Gestiona el acceso de cada rol a los módulos del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{ROLES.length}</div>
              <div className="text-[10px] text-slate-400">Roles</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{totalPermisos.permitidos}</div>
              <div className="text-[10px] text-slate-400">Permisos Activos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{MODULOS.length}</div>
              <div className="text-[10px] text-slate-400">Módulos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Panel izquierdo - Roles */}
        <div className="lg:col-span-1 space-y-4">
          {/* Lista de roles */}
          <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-purple-500" />
                Roles del Sistema
              </h3>
            </div>
            <div className="p-2">
              {ROLES.map((rol) => (
                <button
                  key={rol.id}
                  onClick={() => setRolSeleccionado(rol.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    rolSeleccionado === rol.id
                      ? "bg-slate-100 border border-slate-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${rol.color} rounded-xl flex items-center justify-center text-white text-[11px] font-bold shadow-sm`}>
                    {rol.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[12px] font-semibold text-slate-700">{rol.nombre}</div>
                    <div className="text-[11px] text-slate-400">{rol.usuarios} usuario{rol.usuarios !== 1 ? "s" : ""}</div>
                  </div>
                  {rol.esSistema && (
                    <Shield size={12} className="text-slate-300" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => setModalNuevoRol(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors"
              >
                <Plus size={14} /> Nuevo Rol
              </button>
            </div>
          </div>

          {/* Info del rol seleccionado */}
          {rolActual && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${rolActual.color} rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {rolActual.nombre.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800">{rolActual.nombre}</h4>
                  <p className="text-[10px] text-slate-400">{rolActual.descripcion}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Permisos activos</span>
                  <span className="font-bold text-slate-700">
                    {totalPermisos.permitidos}/{totalPermisos.total}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all"
                    style={{
                      width: `${totalPermisos.total > 0 ? (totalPermisos.permitidos / totalPermisos.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho - Permisos */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header de permisos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Permisos de {rolActual?.nombre}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configura qué puede hacer cada rol en el sistema
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar módulo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                    guardado
                      ? "bg-emerald-500 text-white"
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : guardado ? (
                    <>
                      <Check size={14} /> Guardado
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de permisos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
            {/* Header de columnas */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Módulo
              </div>
              <div className="col-span-7 flex justify-between">
                {Object.values(PERMISOS_LABELS).slice(0, 6).map((label) => (
                  <span key={label} className="text-[11px] font-bold text-slate-400 uppercase w-12 text-center">
                    {label}
                  </span>
                ))}
              </div>
              <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">
                Todos
              </div>
            </div>

            {/* Módulos */}
            <div className="divide-y divide-slate-50">
              {modulosFiltrados.map((modulo) => {
                const IconoModulo = modulo.icono;
                const permisosModulo = permisosActuales[modulo.id] || [];
                const todosPermitidos = modulo.permisos.every((p) =>
                  permisosModulo.includes(p)
                );
                const expandido = expandedModulos.includes(modulo.id);

                return (
                  <div key={modulo.id}>
                    {/* Fila del módulo */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-slate-50/50 transition-colors items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <button
                          onClick={() => expandirColapsar(modulo.id)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          {expandido ? (
                            <ChevronDown size={14} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                        </button>
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <IconoModulo size={14} className="text-slate-500" />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-700">
                          {modulo.nombre}
                        </span>
                      </div>
                      <div className="col-span-7 flex justify-between">
                        {modulo.permisos.map((permiso) => (
                          <button
                            key={permiso}
                            onClick={() => togglePermiso(modulo.id, permiso)}
                            className={`w-12 h-6 rounded-lg flex items-center justify-center transition-all ${
                              permisosModulo.includes(permiso)
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                            title={PERMISOS_LABELS[permiso]}
                          >
                            {permisosModulo.includes(permiso) ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => toggleTodosPermisos(modulo.id)}
                          className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
                            todosPermitidos
                              ? "bg-purple-500 text-white"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title="Toggle todos"
                        >
                          {todosPermitidos ? <Check size={12} /> : <X size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Detalle expandible */}
                    {expandido && (
                      <div className="px-5 py-3 bg-slate-50/30 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {modulo.permisos.map((permiso) => (
                            <div
                              key={permiso}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                permisosModulo.includes(permiso)
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : "bg-white border border-slate-200 hover:bg-slate-50"
                              }`}
                              onClick={() => togglePermiso(modulo.id, permiso)}
                            >
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center ${
                                  permisosModulo.includes(permiso)
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-200 text-slate-400"
                                }`}
                              >
                                {permisosModulo.includes(permiso) && <Check size={10} />}
                              </div>
                              <span className="text-[11px] font-medium text-slate-600">
                                {PERMISOS_LABELS[permiso]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Leyenda de Permisos
            </h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(PERMISOS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
