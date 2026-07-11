"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Calendar,
  Bell,
  MessageSquare,
  Command,
  Menu,
  PanelRightOpen,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  RefreshCw,
  Check,
  FileText,
  Phone,
  Mail,
  X,
  Clock,
  AlertTriangle,
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

export function BarraSuperior({ onMenuClick, onPanelClick, panelColapsado }: BarraSuperiorProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { usuarioActual, cambiarUsuario, esSuperAdmin, usuarios } = useUser();
  const { logout } = useAuth();
  const [mostrarUsuario, setMostrarUsuario] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const usuarioRef = useRef<HTMLDivElement>(null);

  const rolConfig = ROLES_CONFIG[usuarioActual.rol];

  const handleActualizarSistema = async () => {
    setActualizando(true);
    window.location.reload();
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usuarioRef.current && !usuarioRef.current.contains(event.target as Node)) {
        setMostrarUsuario(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[64px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Sección Izquierda */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-slate-600 dark:text-slate-400" />
        </button>

        {/* Info del Usuario */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20">
            {usuarioActual.nombre[0]}{usuarioActual.apellido[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-bold text-slate-900 dark:text-white">
                {usuarioActual.nombre} {usuarioActual.apellido}
              </h1>
              {esSuperAdmin && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${rolConfig?.color || "bg-slate-100 text-slate-600"}`}>
                {rolConfig?.label || usuarioActual.rol}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda Central */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
        >
          <Search size={15} className="text-slate-400" />
          <span className="text-[12px] text-slate-400 flex-1">Buscar clientes, leads...</span>
          <div className="flex items-center gap-0.5 text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
            <Command size={10} />
            <span className="text-[10px] font-medium">K</span>
          </div>
        </button>
      </div>

      {/* Sección Derecha */}
      <div className="flex items-center gap-2">
        <InstallAppButton />

        {/* Dark Mode */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Agenda */}
        <button
          onClick={() => router.push("/agenda")}
          className="w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
          title="Agenda"
        >
          <Calendar size={16} />
        </button>

        {/* Notificaciones */}
        <CampanaNotificaciones />

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Actualizar */}
        {esSuperAdmin && (
          <button
            onClick={handleActualizarSistema}
            disabled={actualizando}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Actualizar sistema"
          >
            <RefreshCw size={13} className={actualizando ? "animate-spin" : ""} />
            <span className="hidden lg:inline">Actualizar</span>
          </button>
        )}

        {/* Usuario Dropdown */}
        <div className="relative" ref={usuarioRef}>
          <button
            onClick={() => setMostrarUsuario(!mostrarUsuario)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-[11px] font-bold">
              {usuarioActual.nombre[0]}{usuarioActual.apellido[0]}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${mostrarUsuario ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {mostrarUsuario && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMostrarUsuario(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-[12px] font-bold text-slate-900 dark:text-white">{usuarioActual.nombre} {usuarioActual.apellido}</div>
                  <div className="text-[10px] text-slate-400">{usuarioActual.email || "Sin email"}</div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { router.push("/configuracion"); setMostrarUsuario(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Settings size={14} /> Configuración
                  </button>
                  <button
                    onClick={() => { logout(); setMostrarUsuario(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut size={14} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </header>
  );
}
