"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Mail,
  Globe,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  Check,
  X,
  Copy,
  Key,
  Info,
  Search,
  Plus,
  Video,
  Cloud,
  Send,
} from "lucide-react";
import { WordPressIntegration } from "@/componentes/integraciones/WordPressIntegration";
import { toast } from "sonner";

// Categorías de integraciones
const CATEGORIAS = [
  { id: "todos", nombre: "Todos", icono: Zap, color: "text-slate-500" },
  { id: "comunicacion", nombre: "Comunicación", icono: MessageSquare, color: "text-green-500" },
  { id: "bancos", nombre: "Bancos", icono: Building2, color: "text-blue-500" },
  { id: "pagos", nombre: "Pagos", icono: CreditCard, color: "text-purple-500" },
  { id: "documentos", nombre: "Documentos", icono: FileText, color: "text-amber-500" },
  { id: "marketing", nombre: "Marketing", icono: Mail, color: "text-pink-500" },
  { id: "productividad", nombre: "Productividad", icono: Calendar, color: "text-indigo-500" },
  { id: "analitica", nombre: "Analítica", icono: BarChart3, color: "text-cyan-500" },
];

// Lista de integraciones
const INTEGRACIONES = [
  {
    id: "whatsapp-business",
    nombre: "WhatsApp Business",
    descripcion: "Envía y recibe mensajes de WhatsApp directamente desde el CRM",
    categoria: "comunicacion",
    icono: MessageSquare,
    color: "from-green-400 to-green-600",
    conectada: true,
    features: ["Mensajes entrantes", "Mensajes salientes", "Plantillas"],
  },
  {
    id: "wordpress-elementor",
    nombre: "WordPress + Elementor",
    descripcion: "Recibe leads automáticamente desde tu página web",
    categoria: "marketing",
    icono: Globe,
    color: "from-blue-600 to-indigo-600",
    conectada: true,
    features: ["Webhooks", "Mapeo de campos", "Leads en tiempo real"],
    esWordPress: true,
  },
  {
    id: "stripe",
    nombre: "Stripe",
    descripcion: "Procesa pagos y gestiona comisiones de ejecutivos",
    categoria: "pagos",
    icono: CreditCard,
    color: "from-purple-500 to-indigo-600",
    conectada: true,
    features: ["Pagos con tarjeta", "Links de pago", "Comisiones automáticas", "Webhooks"],
  },
  {
    id: "google-calendar",
    nombre: "Google Calendar",
    descripcion: "Sincroniza eventos y reuniones con tu calendario de Google",
    categoria: "productividad",
    icono: Calendar,
    color: "from-blue-400 to-blue-600",
    conectada: true,
    features: ["Crear eventos", "Google Meet", "Sincronización", "Recordatorios"],
  },
  {
    id: "resend-email",
    nombre: "Resend",
    descripcion: "Envía emails transaccionales y de marketing",
    categoria: "comunicacion",
    icono: Mail,
    color: "from-slate-400 to-slate-600",
    conectada: true,
    features: ["Emails transaccionales", "Plantillas", "Analytics"],
  },
  {
    id: "supabase",
    nombre: "Supabase",
    descripcion: "Base de datos y autenticación en la nube",
    categoria: "analitica",
    icono: Database,
    color: "from-emerald-400 to-emerald-600",
    conectada: true,
    features: ["Base de datos", "Auth", "Storage", "Realtime"],
  },
  {
    id: "telegram",
    nombre: "Telegram",
    descripcion: "Bot de Telegram para notificaciones",
    categoria: "comunicacion",
    icono: Send,
    color: "from-blue-400 to-blue-500",
    conectada: false,
    features: ["Notificaciones", "Chatbot"],
  },
  {
    id: "zoom",
    nombre: "Zoom",
    descripcion: "Gestiona reuniones de Zoom desde el CRM",
    categoria: "comunicacion",
    icono: Video,
    color: "from-blue-500 to-blue-600",
    conectada: false,
    features: ["Crear reuniones", "Agendar automáticamente"],
  },
  {
    id: "banco-estado",
    nombre: "Banco Estado",
    descripcion: "Consulta de productos y tasas",
    categoria: "bancos",
    icono: Building2,
    color: "from-blue-600 to-blue-700",
    conectada: true,
    features: ["Tasas en tiempo real", "Simulador"],
  },
  {
    id: "santander",
    nombre: "Santander",
    descripcion: "Productos y tasas del Banco Santander",
    categoria: "bancos",
    icono: Building2,
    color: "from-red-500 to-red-600",
    conectada: false,
    features: ["Tasas en tiempo real"],
  },
  {
    id: "google-drive",
    nombre: "Google Drive",
    descripcion: "Almacenamiento en la nube",
    categoria: "documentos",
    icono: Cloud,
    color: "from-green-400 to-green-500",
    conectada: false,
    features: ["Almacenamiento", "Compartir"],
  },
  {
    id: "mailchimp",
    nombre: "Mailchimp",
    descripcion: "Email marketing automatizado",
    categoria: "marketing",
    icono: Mail,
    color: "from-yellow-400 to-yellow-500",
    conectada: false,
    features: ["Email marketing", "Automatización"],
  },
  {
    id: "google-calendar",
    nombre: "Google Calendar",
    descripcion: "Sincronización de eventos",
    categoria: "productividad",
    icono: Calendar,
    color: "from-blue-400 to-blue-500",
    conectada: false,
    features: ["Sincronización", "Eventos"],
  },
  {
    id: "zapier",
    nombre: "Zapier",
    descripcion: "Automatización entre aplicaciones",
    categoria: "analitica",
    icono: Zap,
    color: "from-orange-400 to-orange-500",
    conectada: false,
    features: ["Zaps personalizados", "Miles de integraciones"],
  },
];

export default function IntegracionesPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalConfig, setModalConfig] = useState<string | null>(null);
  const [modalApiKeys, setModalApiKeys] = useState(false);
  const [integracionesState, setIntegracionesState] = useState(INTEGRACIONES);

  const integracionesFiltradas = useMemo(() => {
    return integracionesState.filter((int) => {
      const coincideCategoria = categoriaActiva === "todos" || int.categoria === categoriaActiva;
      const coincideBusqueda = !busqueda ||
        int.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        int.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });
  }, [categoriaActiva, busqueda, integracionesState]);

  const stats = useMemo(() => ({
    total: integracionesState.length,
    conectadas: integracionesState.filter((i) => i.conectada).length,
    pendientes: integracionesState.filter((i) => !i.conectada).length,
  }), [integracionesState]);

  const integracionesConectadas = integracionesState.filter((i) => i.conectada);

  const toggleConexion = (id: string) => {
    setIntegracionesState((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, conectada: !int.conectada } : int
      )
    );
    const int = integracionesState.find((i) => i.id === id);
    if (int) {
      toast.success(int.conectada ? "Integración desconectada" : "Integración conectada", {
        description: `${int.nombre} ha sido ${int.conectada ? "desconectada" : "conectada"}`,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">Integraciones</h1>
            <p className="text-blue-200 text-[11px] font-medium">
              Conecta tu CRM con las herramientas que ya usas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-blue-200">Disponibles</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.conectadas}</div>
              <div className="text-[10px] text-blue-200">Conectadas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.pendientes}</div>
              <div className="text-[10px] text-blue-200">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Integraciones conectadas */}
      {integracionesConectadas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              Integraciones Activas
            </h3>
            <button
              onClick={() => setModalApiKeys(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 transition-colors"
            >
              <Key size={12} /> API Keys
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {integracionesConectadas.map((int) => {
              const IconoInt = int.icono;
              return (
                <div key={int.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className={`w-10 h-10 bg-gradient-to-br ${int.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                    <IconoInt size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{int.nombre}</div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] text-emerald-600 font-medium">Activa</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalConfig(int.id)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    title="Configurar"
                  >
                    <Settings size={12} className="text-slate-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar integración..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIAS.map((cat) => {
              const IconoCat = cat.icono;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                    categoriaActiva === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <IconoCat size={12} />
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de integraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integracionesFiltradas.map((int) => {
          const IconoInt = int.icono;
          return (
            <div key={int.id} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${int.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    <IconoInt size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{int.nombre}</h3>
                    <p className="text-[10px] text-slate-400">{int.descripcion}</p>
                  </div>
                </div>
                {int.conectada && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-bold text-emerald-700">Activa</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {int.features.map((feature) => (
                  <span key={feature} className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {int.conectada ? (
                  <>
                    <button
                      onClick={() => setModalConfig(int.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition-colors"
                    >
                      <Settings size={12} /> Configurar
                    </button>
                    <button
                      onClick={() => toggleConexion(int.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-[10px] font-semibold text-red-600 transition-colors"
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleConexion(int.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] font-semibold text-white transition-colors shadow-sm shadow-blue-600/20"
                  >
                    <Zap size={12} /> Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de configuración WordPress */}
      {modalConfig === "wordpress-elementor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">WordPress + Elementor</h3>
                    <p className="text-[11px] text-slate-400">Configuración de integración</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalConfig(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <WordPressIntegration />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalConfig(null)}
                className="px-5 py-2 bg-blue-600 text-white text-[11px] font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración genérico */}
      {modalConfig && modalConfig !== "wordpress-elementor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
            {(() => {
              const int = integracionesState.find((i) => i.id === modalConfig);
              if (!int) return null;
              const IconoInt = int.icono;
              return (
                <>
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${int.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                          <IconoInt size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800">{int.nombre}</h3>
                          <p className="text-[11px] text-slate-400">{int.descripcion}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setModalConfig(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-700">API Key</label>
                      <input
                        type="password"
                        placeholder="Ingresa tu API Key"
                        className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-700">API Secret</label>
                      <input
                        type="password"
                        placeholder="Ingresa tu API Secret"
                        className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="text-blue-500 mt-0.5" />
                        <p className="text-[10px] text-blue-600">
                          Las credenciales se cifran y almacenan de forma segura.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setModalConfig(null)}
                      className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        toast.success("Configuración guardada");
                        setModalConfig(null);
                      }}
                      className="px-5 py-2 bg-blue-600 text-white text-[11px] font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                    >
                      Guardar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal API Keys */}
      {modalApiKeys && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Key size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">API Keys</h3>
                    <p className="text-[11px] text-slate-400">Gestiona las llaves de acceso</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalApiKeys(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-[12px] font-semibold text-slate-700">API Key Principal</div>
                  <div className="text-[10px] text-slate-400">Creada: 01 Julio 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    sk_live_••••••••••••••••
                  </code>
                  <button
                    onClick={() => toast.success("API Key copiada")}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Copy size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => toast.success("Nueva API Key generada")}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-[11px] font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                <Plus size={14} /> Generar Nueva API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
