"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Plus,
  Calendar,
  Bell,
  MessageSquare,
  ChevronDown,
  Command,
  Menu,
  PanelRightOpen,
  User,
  Shield,
  Check,
  LogOut,
  Settings,
  ChevronRight,
  X,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  Send,
  Eye,
  Trash2,
  Archive,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/lib/contexts/UserContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROLES_CONFIG } from "@/tipos";
import { CampanaNotificaciones } from "@/componentes/notificaciones/CampanaNotificaciones";
import { InstallAppButton } from "@/componentes/layout/InstallAppButton";
import { CommandPalette } from "@/components/ui/command-palette";

interface BarraSuperiorProps {
  onMenuClick?: () => void;
  onPanelClick?: () => void;
  panelColapsado?: boolean;
}

// Mock data para mensajes
const MENSAJES_MOCK = [
  {
    id: "m1",
    remitente: "María González",
    avatar: "MG",
    ultimoMensaje: "Hola, ya envié los documentos que me pediste",
    tiempo: "Hace 10 min",
    noLeidos: 2,
    enLinea: true,
    tipo: "whatsapp" as const,
    enlace: "/conversaciones?chat=maria-gonzalez",
  },
  {
    id: "m2",
    remitente: "Carlos Rojas",
    avatar: "CR",
    ultimoMensaje: "¿Cuándo podemos reunirnos para revisar la propuesta?",
    tiempo: "Hace 25 min",
    noLeidos: 1,
    enLinea: true,
    tipo: "email" as const,
    enlace: "/conversaciones?chat=carlos-rojas",
  },
  {
    id: "m3",
    remitente: "Ana Torres",
    avatar: "AT",
    ultimoMensaje: "Perfecto, nos vemos mañana a las 10",
    tiempo: "Hace 1 hora",
    noLeidos: 0,
    enLinea: false,
    tipo: "whatsapp" as const,
    enlace: "/conversaciones?chat=ana-torres",
  },
  {
    id: "m4",
    remitente: "Diego Silva",
    avatar: "DS",
    ultimoMensaje: "El banco respondió sobre la tasa",
    tiempo: "Hace 2 horas",
    noLeidos: 0,
    enLinea: false,
    tipo: "email" as const,
    enlace: "/conversaciones?chat=diego-silva",
  },
  {
    id: "m5",
    remitente: "Valentina Torres",
    avatar: "VT",
    ultimoMensaje: "Revisé los documentos todo está correcto",
    tiempo: "Ayer",
    noLeidos: 0,
    enLinea: false,
    tipo: "whatsapp" as const,
    enlace: "/conversaciones?chat=valentina-torres",
  },
];

export function BarraSuperior({ onMenuClick, onPanelClick, panelColapsado }: BarraSuperiorProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { usuarioActual, cambiarUsuario, esSuperAdmin, usuarios } = useUser();
  const { logout } = useAuth();
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [mostrarMensajes, setMostrarMensajes] = useState(false);
  const [mensajes, setMensajes] = useState(MENSAJES_MOCK);
  const [actualizando, setActualizando] = useState(false);

  const mensajesRef = useRef<HTMLDivElement>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const rolConfig = ROLES_CONFIG[usuarioActual.rol];

  const mensajesNoLeidos = mensajes.reduce((sum, m) => sum + m.noLeidos, 0);

  const handleActualizarSistema = async () => {
    setActualizando(true);
    try {
      // Recargar datos del sistema
      window.location.reload();
    } finally {
      setActualizando(false);
    }
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mensajesRef.current && !mensajesRef.current.contains(event.target as Node)) {
        setMostrarMensajes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCambiarCuenta = (usuarioId: string) => {
    cambiarUsuario(usuarioId);
    setMostrarSelector(false);
  };

  return (
    <header className="h-[68px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Título y Botón Menú */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {usuarioActual.nombre} {usuarioActual.apellido}
            </h1>
            {esSuperAdmin && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                SUPER ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rolConfig.color}`}>
              {rolConfig.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Panel de Control</span>
          </div>
        </div>
      </div>

      {/* Búsqueda - Oculta en móvil */}
      <div className="hidden md:block flex-1 max-w-lg mx-8">
        <div className="relative group cursor-pointer" onClick={() => setCommandPaletteOpen(true)}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar clientes, leads, ejecutivos..."
            readOnly
            className="w-full pl-10 pr-14 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-200 cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
            <Command size={11} />
            <span className="text-[10px] font-medium">K</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5">
        <InstallAppButton />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors border border-slate-100 dark:border-slate-700"
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        
        {/* Iconos - Ocultos en móvil pequeño */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-px h-6 bg-slate-200 mx-1" />
          
          {/* Calendario */}
          <button
            onClick={() => router.push("/agenda")}
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors border border-slate-100"
            title="Ir a Agenda"
          >
            <Calendar size={17} />
          </button>

          {/* Notificaciones */}
          <CampanaNotificaciones />

          {/* Mensajes */}
          <div className="relative" ref={mensajesRef}>
            <button
              onClick={() => {
                setMostrarMensajes(!mostrarMensajes);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border relative ${
                mostrarMensajes
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100"
              }`}
            >
              <MessageSquare size={17} />
              {mensajesNoLeidos > 0 && (
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-green-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {mensajesNoLeidos}
                </span>
              )}
            </button>

            {/* Dropdown de Mensajes */}
            {mostrarMensajes && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMostrarMensajes(false)} />
                <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Mensajes</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {mensajesNoLeidos} sin leer
                        </p>
                      </div>
                      <button className="text-[10px] font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                        <Mail size={12} /> Nuevo mensaje
                      </button>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {mensajes.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <MessageSquare size={20} className="text-slate-300" />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Sin mensajes
                        </p>
                      </div>
                    ) : (
                      mensajes.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                            msg.noLeidos > 0 ? "bg-green-50/30" : ""
                          }`}
                          onClick={() => {
                            setMostrarMensajes(false);
                            if (msg.enlace) router.push(msg.enlace);
                          }}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center text-[11px] font-bold text-white">
                              {msg.avatar}
                            </div>
                            {msg.enLinea && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                {msg.remitente}
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {msg.tiempo}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {msg.ultimoMensaje}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {msg.tipo === "whatsapp" ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                                  WhatsApp
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                                  Email
                                </span>
                              )}
                              {msg.noLeidos > 0 && (
                                <span className="w-5 h-5 bg-green-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                                  {msg.noLeidos}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                    <button className="w-full text-center text-[11px] font-semibold text-green-600 hover:text-green-700 py-1">
                      Ver todos los mensajes
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botón Panel Derecho */}
        <button
          onClick={onPanelClick}
          className="lg:hidden w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors border border-slate-100"
        >
          <PanelRightOpen size={17} />
        </button>
      </div>

      {/* Botón Actualizar Sistema */}
      {esSuperAdmin && (
        <button
          onClick={handleActualizarSistema}
          disabled={actualizando}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
          title="Actualizar sistema - Recargar datos"
        >
          <RefreshCw size={14} className={actualizando ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      )}

      {/* Avatar del usuario (solo visual, sin dropdown) */}
      <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200/60">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-600/15">
          {usuarioActual.nombre[0]}{usuarioActual.apellido[0]}
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[13px] font-semibold text-slate-900">{usuarioActual.nombre}</div>
          <div className="text-[10px] text-slate-400 font-medium">{rolConfig.label}</div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </header>
  );
}
