export interface AISugerencia {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  prompt: string;
}

export const SUGERENCIAS_IA: AISugerencia[] = [
  {
    id: "stats-pipeline",
    icono: "📊",
    titulo: "Estadísticas del pipeline",
    descripcion: "Ver métricas reales de ventas",
    prompt: "Muéstrame las estadísticas generales del pipeline con los datos actuales",
  },
  {
    id: "ranking-ejecutivos",
    icono: "🏆",
    titulo: "Ranking de ejecutivos",
    descripcion: "Rendimiento del equipo comercial",
    prompt: "¿Cómo está el rendimiento de cada ejecutivo con sus leads asignados?",
  },
  {
    id: "mejores-bancos",
    icono: "🏦",
    titulo: "Análisis por banco",
    descripcion: "Distribución y montos por banco",
    prompt: "¿Cuáles son los bancos con más créditos y qué montos manejan?",
  },
  {
    id: "leads-atencion",
    icono: "⚠️",
    titulo: "Leads que necesitan atención",
    descripcion: "Oportunidades urgentes o estancadas",
    prompt: "¿Hay leads urgentes o estancados que requieran atención inmediata?",
  },
  {
    id: "origen-leads",
    icono: "🔍",
    titulo: "Análisis por origen",
    descripcion: "De dónde vienen los mejores leads",
    prompt: "¿De qué origen vienen más leads y cuáles tienen mejor conversión?",
  },
  {
    id: "resumen-ejecutivo",
    icono: "📈",
    titulo: "Resumen ejecutivo",
    descripcion: "Reporte consolidado del negocio",
    prompt: "Genera un resumen ejecutivo del estado actual del negocio con los datos disponibles",
  },
];
