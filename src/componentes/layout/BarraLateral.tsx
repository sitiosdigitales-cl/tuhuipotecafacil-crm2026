"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  FileText,
  Calendar,
  CheckSquare,
  Bell,
  MessageSquare,
  BarChart3,
  Share2,
  Target,
  Globe,
  BookOpen,
  DollarSign,
  GitBranch,
  FileStack,
  Zap,
  Plug,
  Settings,
  Shield,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Home,
  Bot,
  Sparkles,
  Calculator,
} from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { useUser } from "@/modulos/usuarios";
import { CambioRapidoUsuario } from "@/componentes/layout/CambioRapidoUsuario";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTareaCount } from "@/modulos/tareas";
import { LogOut } from "lucide-react";
import type { Rol } from "@/tipos";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  badgeColor?: string;
  roles?: Rol[]; // Roles que pueden ver este item
}

// Secciones del menú con control de roles
const seccionesCompletas: { titulo: string; items: MenuItem[]; roles?: Rol[] }[] = [
  {
    titulo: "GENERAL",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={17} />, href: "/dashboard" },
      { label: "Resumen Ejecutivo", icon: <BarChart3 size={17} />, href: "/resumen", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
    ],
  },
  {
    titulo: "CRM COMERCIAL",
    items: [
      { label: "Pipeline Comercial", icon: <GitBranch size={17} />, href: "/pipeline" },
      { label: "Leads", icon: <UserPlus size={17} />, href: "/leads", badge: 56, badgeColor: "bg-blue-500" },
      { label: "Clientes", icon: <Users size={17} />, href: "/clientes" },
      { label: "Bancos", icon: <Building2 size={17} />, href: "/bancos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
      { label: "Simulador", icon: <Calculator size={17} />, href: "/simulador" },
      { label: "Portal del Cliente", icon: <Globe size={17} />, href: "/portal" },
      { label: "Documentos", icon: <FileText size={17} />, href: "/documentos" },
      { label: "Agenda", icon: <Calendar size={17} />, href: "/agenda" },
      { label: "Actividades", icon: <CheckSquare size={17} />, href: "/actividades", badge: 18, badgeColor: "bg-amber-500" },
      { label: "Conversaciones", icon: <MessageSquare size={17} />, href: "/conversaciones" },
      { label: "Reportes", icon: <BarChart3 size={17} />, href: "/reportes", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
    ],
  },
  {
    titulo: "MARKETING Y REFERIDOS",
    roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
    items: [
      { label: "Referidos", icon: <Share2 size={17} />, href: "/referidos" },
      { label: "Campañas", icon: <Target size={17} />, href: "/campanas" },
      { label: "Landing Pages", icon: <Globe size={17} />, href: "/landings" },
      { label: "Biblioteca Comercial", icon: <BookOpen size={17} />, href: "/biblioteca" },
      { label: "Comisiones", icon: <DollarSign size={17} />, href: "/comisiones" },
    ],
  },
  {
    titulo: "AUTOMATIZACIONES",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      { label: "Flujos Automáticos", icon: <GitBranch size={17} />, href: "/flujos" },
      { label: "Plantillas", icon: <FileStack size={17} />, href: "/plantillas" },
      { label: "Triggers", icon: <Zap size={17} />, href: "/triggers" },
      { label: "Integraciones", icon: <Plug size={17} />, href: "/integraciones" },
      { label: "Asistente IA", icon: <Sparkles size={17} />, href: "/configuracion?tab=asistente-ia" },
    ],
  },
  {
    titulo: "ADMINISTRACIÓN",
    roles: ["SUPER_ADMIN"], // Solo Super Admin ve administración
    items: [
      { label: "Usuarios y Roles", icon: <Users size={17} />, href: "/usuarios" },
      { label: "Configuración", icon: <Settings size={17} />, href: "/configuracion" },
      { label: "Permisos", icon: <Shield size={17} />, href: "/permisos" },
      { label: "Auditoría del Sistema", icon: <ClipboardList size={17} />, href: "/auditoria" },
    ],
  },
];

interface BarraLateralProps {
  onClose?: () => void;
}

export function BarraLateral({ onClose }: BarraLateralProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads } = useLeads();
  const { usuarioActual } = useUser();
  const { logout } = useAuth();
  const tareasCount = useTareaCount();
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    GENERAL: true,
    "CRM COMERCIAL": true,
  });

  // Verificar si es admin
  const esAdmin = ["SUPER_ADMIN", "ADMIN"].includes(usuarioActual.rol);

  // Calcular badges dinámicos
  const badges = useMemo(() => ({
    leads: leads.length,
    tareas: tareasCount,
  }), [leads, tareasCount]);

  // Filtrar secciones según el rol del usuario
  const secciones = useMemo(() => {
    const rol = usuarioActual.rol;

    return seccionesCompletas
      .filter((seccion) => {
        // Si la sección tiene restricción de roles, verificar
        if (seccion.roles) {
          return seccion.roles.includes(rol);
        }
        return true; // Sin restricción, todos pueden ver
      })
      .map((seccion) => ({
        ...seccion,
        items: seccion.items.filter((item) => {
          // Si el item tiene restricción de roles, verificar
          if (item.roles) {
            return item.roles.includes(rol);
          }
          return true; // Sin restricción, todos pueden ver
        }),
      }))
      .filter((seccion) => seccion.items.length > 0); // No mostrar secciones vacías
  }, [usuarioActual.rol]);

  const toggleSeccion = (titulo: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [titulo]: !prev[titulo] }));
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  // Actualizar badges en las secciones
  const seccionesConBadges = secciones.map(seccion => ({
    ...seccion,
    items: seccion.items.map(item => {
      if (item.label === "Leads") return { ...item, badge: badges.leads };
      if (item.label === "Actividades") return { ...item, badge: badges.tareas };
      return item;
    })
  }));

  return (
    <aside className="w-[260px] h-screen gradient-sidebar text-slate-300 flex flex-col fixed left-0 top-0 z-40 border-r border-white/5">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-[15px] leading-tight tracking-tight">TuHipotecaFacil.cl</div>
            <div className="text-[11px] text-slate-400 font-medium">CRM Hipotecario Inteligente</div>
          </div>
        </Link>
      </div>

      {/* Separador */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Menú */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {seccionesConBadges.map((seccion, seccionIdx) => (
          <div key={seccion.titulo} className={seccionIdx > 0 ? "pt-4" : ""}>
            <button
              onClick={() => toggleSeccion(seccion.titulo)}
              className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em] px-3 py-2 hover:text-slate-300 transition-colors rounded-lg"
            >
              {seccion.titulo}
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${seccionesAbiertas[seccion.titulo] ? "" : "-rotate-90"}`}
              />
            </button>
            <div
              className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ${
                seccionesAbiertas[seccion.titulo] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {seccion.items.map((item) => {
                const isActive = item.href && pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href || "#"}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <span className={`transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`${item.badgeColor || "bg-red-500"} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* IA Asistente */}
      <div className="px-3 mb-2">
        <Link href="/asistente" onClick={handleLinkClick}>
          <div className="bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-blue-600/10 rounded-lg p-2.5 border border-violet-500/10 hover:border-violet-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-white group-hover:text-purple-200 transition-colors">IA Asistente</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] text-green-400 font-medium">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Separador */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Selector Rápido de Usuario (solo para admins) */}
      {esAdmin && (
        <div className="px-3 py-2">
          <CambioRapidoUsuario />
        </div>
      )}

      {/* Botón Cerrar Sesión */}
      <div className="px-3 pb-2">
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={13} />
          <span className="text-[11px] font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
