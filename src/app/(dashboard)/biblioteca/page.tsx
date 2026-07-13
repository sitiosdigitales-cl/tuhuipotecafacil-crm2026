"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Image,
  Video,
  Presentation,
  Download,
  Upload,
  Search,
  Plus,
  Eye,
  Star,
  Clock,
  User,
  Tag,
  Grid,
  List,
  Calendar,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";

// Datos mock de documentos de la biblioteca
const BIBLIOTECA_MOCK = [
  {
    id: "b1",
    nombre: "Propuesta Comercial Hipotecario 2024",
    descripcion: "Presentación completa del producto hipotecario con tasas y beneficios",
    tipo: "PRESENTACION",
    categoria: "VENTAS",
    formato: "PDF",
    tamano: "2.5 MB",
    autor: "Andrés Pérez",
    fechaSubida: new Date(2026, 5, 29),
    vistas: 234,
    descargas: 89,
    favorito: true,
    tags: ["propuesta", "hipotecario", "ventas"],
    icono: "📊",
  },
  {
    id: "b2",
    nombre: "Manual de Procesos Hipotecarios",
    descripcion: "Guía completa de procesos para créditos hipotecarios",
    tipo: "DOCUMENTO",
    categoria: "PROCESOS",
    formato: "PDF",
    tamano: "5.2 MB",
    autor: "Carolina Muñoz",
    fechaSubida: new Date(2026, 5, 19),
    vistas: 567,
    descargas: 234,
    favorito: true,
    tags: ["manual", "procesos", "guía"],
    icono: "📋",
  },
  {
    id: "b3",
    nombre: "Video: Cómo Solicitar tu Crédito",
    descripcion: "Tutorial en video del proceso de solicitud de crédito",
    tipo: "VIDEO",
    categoria: "CAPACITACION",
    formato: "MP4",
    tamano: "125 MB",
    autor: "Diego Silva",
    fechaSubida: new Date(2026, 5, 24),
    vistas: 892,
    descargas: 0,
    favorito: false,
    tags: ["video", "tutorial", "crédito"],
    icono: "🎥",
  },
  {
    id: "b4",
    nombre: "Infografía: Beneficios del Crédito Hipotecario",
    descripcion: "Infografía visual con los principales beneficios",
    tipo: "IMAGEN",
    categoria: "MARKETING",
    formato: "PNG",
    tamano: "1.8 MB",
    autor: "Valentina Torres",
    fechaSubida: new Date(2026, 5, 26),
    vistas: 456,
    descargas: 178,
    favorito: true,
    tags: ["infografía", "beneficios", "marketing"],
    icono: "🖼️",
  },
  {
    id: "b5",
    nombre: "Presentación Black Friday 2024",
    descripcion: "Materiales de venta para la campaña Black Friday",
    tipo: "PRESENTACION",
    categoria: "CAMPAÑAS",
    formato: "PPTX",
    tamano: "8.3 MB",
    autor: "Javier Morales",
    fechaSubida: new Date(2026, 5, 14),
    vistas: 345,
    descargas: 156,
    favorito: false,
    tags: ["black friday", "campaña", "promoción"],
    icono: "📈",
  },
  {
    id: "b6",
    nombre: "Checklist: Documentos para Crédito",
    descripcion: "Lista de verificación de documentos requeridos por tipo de crédito",
    tipo: "DOCUMENTO",
    categoria: "PROCESOS",
    formato: "PDF",
    tamano: "450 KB",
    autor: "Andrés Pérez",
    fechaSubida: new Date(2026, 6, 1),
    vistas: 789,
    descargas: 456,
    favorito: true,
    tags: ["checklist", "documentos", "crédito"],
    icono: "✅",
  },
  {
    id: "b7",
    nombre: "Video: Testimonios de Clientes",
    descripcion: "Compilación de testimonios de clientes satisfechos",
    tipo: "VIDEO",
    categoria: "MARKETING",
    formato: "MP4",
    tamano: "250 MB",
    autor: "Carolina Muñoz",
    fechaSubida: new Date(2026, 5, 22),
    vistas: 1234,
    descargas: 0,
    favorito: true,
    tags: ["testimonios", "clientes", "marketing"],
    icono: "🎥",
  },
  {
    id: "b8",
    nombre: "Guía de Tasas Hipotecarias",
    descripcion: "Comparativo de tasas de los principales bancos chilenos",
    tipo: "DOCUMENTO",
    categoria: "VENTAS",
    formato: "PDF",
    tamano: "1.2 MB",
    autor: "Diego Silva",
    fechaSubida: new Date(2026, 5, 27),
    vistas: 678,
    descargas: 345,
    favorito: false,
    tags: ["tasas", "bancos", "comparativo"],
    icono: "📊",
  },
  {
    id: "b9",
    nombre: "Plantilla: Contrato Promesa Compraventa",
    descripcion: "Modelo de contrato para operaciones hipotecarias",
    tipo: "DOCUMENTO",
    categoria: "LEGALES",
    formato: "DOCX",
    tamano: "320 KB",
    autor: "Valentina Torres",
    fechaSubida: new Date(2026, 5, 9),
    vistas: 456,
    descargas: 234,
    favorito: false,
    tags: ["contrato", "legal", "plantilla"],
    icono: "📝",
  },
  {
    id: "b10",
    nombre: "Video: Presentación Empresa",
    descripcion: "Video institucional de TuHipotecaFacil",
    tipo: "VIDEO",
    categoria: "CORPORATIVO",
    formato: "MP4",
    tamano: "180 MB",
    autor: "Andrés Pérez",
    fechaSubida: new Date(2026, 5, 4),
    vistas: 2345,
    descargas: 0,
    favorito: true,
    tags: ["empresa", "institucional", "video"],
    icono: "🎥",
  },
  {
    id: "b11",
    nombre: "Infografía: Proceso de Crédito Paso a Paso",
    descripcion: "Guía visual del proceso completo de solicitud",
    tipo: "IMAGEN",
    categoria: "CAPACITACION",
    formato: "PNG",
    tamano: "2.1 MB",
    autor: "Diego Silva",
    fechaSubida: new Date(2026, 5, 16),
    vistas: 890,
    descargas: 567,
    favorito: false,
    tags: ["proceso", "infografía", "paso a paso"],
    icono: "🖼️",
  },
  {
    id: "b12",
    nombre: "Presentación: Programa de Referidos",
    descripcion: "Materiales para promocionar el programa de referidos",
    tipo: "PRESENTACION",
    categoria: "VENTAS",
    formato: "PDF",
    tamano: "3.8 MB",
    autor: "Javier Morales",
    fechaSubida: new Date(2026, 5, 20),
    vistas: 567,
    descargas: 234,
    favorito: false,
    tags: ["referidos", "programa", "ventas"],
    icono: "📊",
  },
];

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icono: React.ElementType }> = {
  DOCUMENTO: { label: "Documento", color: "text-blue-600", bg: "bg-blue-50", icono: FileText },
  PRESENTACION: { label: "Presentación", color: "text-purple-600", bg: "bg-purple-50", icono: Presentation },
  IMAGEN: { label: "Imagen", color: "text-pink-600", bg: "bg-pink-50", icono: Image },
  VIDEO: { label: "Video", color: "text-red-600", bg: "bg-red-50", icono: Video },
};

const CATEGORIA_CONFIG: Record<string, { label: string; color: string; icono: string }> = {
  VENTAS: { label: "Ventas", color: "text-blue-600", icono: "💰" },
  PROCESOS: { label: "Procesos", color: "text-emerald-600", icono: "⚙️" },
  CAPACITACION: { label: "Capacitación", color: "text-purple-600", icono: "📚" },
  MARKETING: { label: "Marketing", color: "text-pink-600", icono: "📢" },
  CAMPAÑAS: { label: "Campañas", color: "text-amber-600", icono: "🎯" },
  LEGALES: { label: "Legales", color: "text-red-600", icono: "⚖️" },
  CORPORATIVO: { label: "Corporativo", color: "text-indigo-600", icono: "🏢" },
};

type TabBiblioteca = "todos" | "favoritos" | "recientes" | "populares";

export default function BibliotecaPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<TabBiblioteca>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [vistaActiva, setVistaActiva] = useState<"grid" | "lista">("grid");
  const [modalSubir, setModalSubir] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/purity -- Timestamp estable, calculado una vez
  const hace7Dias = useMemo(() => new Date(Date.now() - 7 * 86400000), []);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/biblioteca");
        const json = await res.json();
        if (json.success && json.data) setDocumentos(json.data);
      } catch { setDocumentos([]); }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const coincideTab =
        tabActiva === "todos" ||
        (tabActiva === "favoritos" && doc.favorito) ||
        (tabActiva === "recientes" && doc.fechaSubida > hace7Dias) ||
        (tabActiva === "populares" && doc.vistas > 500);
      const coincideBusqueda =
        !busqueda ||
        doc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (doc.tags || []).some((tag: string) => tag.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideTipo = filtroTipo === "todos" || doc.tipo === filtroTipo;
      const coincideCategoria = filtroCategoria === "todos" || doc.categoria === filtroCategoria;
      return coincideTab && coincideBusqueda && coincideTipo && coincideCategoria;
    });
  }, [tabActiva, busqueda, filtroTipo, filtroCategoria, documentos]);

  const documentoDetalle = documentos.find((doc) => doc.id === modalDetalle);

  const stats = useMemo(() => ({
    total: documentos.length,
    favoritos: documentos.filter((d) => d.favorito).length,
    totalVistas: documentos.reduce((sum: number, d: any) => sum + (d.vistas || 0), 0),
    totalDescargas: documentos.reduce((sum: number, d: any) => sum + (d.descargas || 0), 0),
    documentos: documentos.filter((d) => d.tipo === "DOCUMENTO").length,
    presentaciones: documentos.filter((d) => d.tipo === "PRESENTACION").length,
    imagenes: documentos.filter((d) => d.tipo === "IMAGEN").length,
    videos: documentos.filter((d) => d.tipo === "VIDEO").length,
  }), [documentos]);

  const toggleFavorito = (docId: string) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, favorito: !d.favorito } : d))
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Biblioteca Comercial
            </h1>
            <p className="text-indigo-200 text-[11px] font-medium">
              Repositorio de documentos, presentaciones y materiales de venta
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-indigo-200">Archivos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-300">{stats.totalVistas.toLocaleString()}</div>
              <div className="text-[10px] text-indigo-200">Vistas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.totalDescargas.toLocaleString()}</div>
              <div className="text-[10px] text-indigo-200">Descargas</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Documentos</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.documentos}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Presentation size={18} className="text-purple-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Presentaciones</span>
          </div>
          <div className="text-xl font-bold text-purple-600">{stats.presentaciones}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <Image size={18} className="text-pink-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Imágenes</span>
          </div>
          <div className="text-xl font-bold text-pink-600">{stats.imagenes}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Video size={18} className="text-red-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Videos</span>
          </div>
          <div className="text-xl font-bold text-red-600">{stats.videos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, descripción o tags..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
            >
              <option value="todos">Todos los tipos</option>
              <option value="DOCUMENTO">Documentos</option>
              <option value="PRESENTACION">Presentaciones</option>
              <option value="IMAGEN">Imágenes</option>
              <option value="VIDEO">Videos</option>
            </select>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
            >
              <option value="todos">Todas las categorías</option>
              {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.icono} {config.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setVistaActiva("grid")}
                className={`p-2 rounded-md transition-colors ${vistaActiva === "grid" ? "bg-white shadow-sm" : ""}`}
              >
                <Grid size={14} className={vistaActiva === "grid" ? "text-slate-700" : "text-slate-400"} />
              </button>
              <button
                onClick={() => setVistaActiva("lista")}
                className={`p-2 rounded-md transition-colors ${vistaActiva === "lista" ? "bg-white shadow-sm" : ""}`}
              >
                <List size={14} className={vistaActiva === "lista" ? "text-slate-700" : "text-slate-400"} />
              </button>
            </div>
            <button
              onClick={() => setModalSubir(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
            >
              <Upload size={14} /> Subir Archivo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: "todos", label: "Todos", count: stats.total },
          { id: "favoritos", label: "Favoritos", count: stats.favoritos, icono: Star },
          { id: "recientes", label: "Recientes", count: documentos.filter((d) => d.fechaSubida > hace7Dias).length },
          { id: "populares", label: "Populares", count: documentos.filter((d) => d.vistas > 500).length },
        ].map((tab) => {
          const IconoTab = tab.icono;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id as TabBiblioteca)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                tabActiva === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white border border-slate-200/60 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {IconoTab && <IconoTab size={12} />}
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vista Grid */}
      {vistaActiva === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documentosFiltrados.map((doc) => {
            const configTipo = TIPO_CONFIG[doc.tipo];
            const configCategoria = CATEGORIA_CONFIG[doc.categoria];
            const IconoTipo = configTipo?.icono;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft hover:shadow-md transition-all group"
              >
                {/* Preview */}
                <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                  <span className="text-4xl">{doc.icono}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorito(doc.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
                      doc.favorito ? "bg-amber-100 text-amber-500" : "bg-white/80 text-slate-400 hover:text-amber-500"
                    }`}
                  >
                    <Star size={14} fill={doc.favorito ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Info */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configTipo?.bg} ${configTipo?.color}`}>
                      {configTipo?.label}
                    </span>
                    <span className="text-[11px] text-slate-400">{doc.formato}</span>
                  </div>
                  <h4 className="text-[12px] font-bold text-slate-800 mt-2 line-clamp-2">{doc.nombre}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{doc.descripcion}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(doc.tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> {doc.vistas}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={10} /> {doc.descargas}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md flex items-center justify-center text-[7px] font-bold text-white">
                      {doc.autor.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <span className="text-[11px] text-slate-500">{doc.autor.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" title="Ver">
                      <Eye size={12} className="text-indigo-500" />
                    </button>
                    <button className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar">
                      <Download size={12} className="text-emerald-500" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Más">
                      <MoreHorizontal size={12} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Lista */}
      {vistaActiva === "lista" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Archivo</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamaño</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vistas</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Autor</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documentosFiltrados.map((doc) => {
                const configTipo = TIPO_CONFIG[doc.tipo];
                const configCategoria = CATEGORIA_CONFIG[doc.categoria];
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icono}</span>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{doc.nombre}</div>
                          <div className="text-[10px] text-slate-400">{doc.formato} • {doc.tamano}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configTipo?.bg} ${configTipo?.color}`}>
                        {configTipo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600">
                        {configCategoria?.icono} {configCategoria?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600">{doc.tamano}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-semibold text-slate-700">{doc.vistas}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600">{doc.autor}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" title="Ver">
                          <Eye size={12} className="text-indigo-500" />
                        </button>
                        <button className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar">
                          <Download size={12} className="text-emerald-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Subir */}
      {modalSubir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Upload size={18} className="text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Subir Archivo</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Agrega un nuevo documento a la biblioteca</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalSubir(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Zona de drag & drop */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-6 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                <Upload size={32} className="text-slate-400 mx-auto mb-3" />
                <p className="text-[12px] font-semibold text-slate-600 mb-1">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-[10px] text-slate-400">
                  PDF, DOCX, PPTX, PNG, JPG, MP4 (Máx. 500MB)
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Nombre del archivo"
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                  <textarea
                    placeholder="Describe el contenido del archivo..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 resize-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Categoría</label>
                    <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400">
                      {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.icono} {config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Tags</label>
                    <input
                      type="text"
                      placeholder="Separados por coma"
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalSubir(false)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalSubir(false)}
                className="px-5 py-2 bg-indigo-600 text-white text-[11px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
              >
                Subir Archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
