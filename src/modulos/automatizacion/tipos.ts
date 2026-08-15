export type EstadoAutomatizacion = "ACTIVO" | "PAUSADO" | "BORRADOR";
export type LogicaCondiciones = "AND" | "OR";

export interface CondicionAutomatizacion {
  campo: string;
  operador: string;
  valor?: string;
}

export interface AccionAutomatizacion {
  tipo: string;
  configuracion: Record<string, unknown>;
  delay: number;
  orden: number;
}

export interface FormularioAutomatizacion {
  nombre: string;
  descripcion: string;
  trigger: string;
  categoria: string;
  condiciones: CondicionAutomatizacion[];
  logica_condiciones: LogicaCondiciones;
  acciones: AccionAutomatizacion[];
  estado: EstadoAutomatizacion;
}

export interface AutomatizacionGuardada {
  id: string;
  nombre: string;
  descripcion?: string;
  trigger?: string;
  categoria?: string;
  condiciones?: CondicionAutomatizacion[];
  logica_condiciones?: LogicaCondiciones;
  acciones?: AccionAutomatizacion[];
  pasos?: AccionAutomatizacion[];
  estado: EstadoAutomatizacion;
  ejecuciones?: number;
  exitosas?: number;
  fallidas?: number;
  ultimoEjecucion?: string;
  ultimo_ejecucion?: string;
  ultimoDisparo?: string;
  creadoEn?: string;
  creadoPor?: string;
}

export type FlujoAutomatizacion = AutomatizacionGuardada;

export interface TriggerAutomatizacion extends FormularioAutomatizacion {
  id: string;
  ejecuciones?: number;
  exitosas?: number;
  fallidas?: number;
  ultimoDisparo?: string;
}

export interface PlantillaAutomatizacion {
  id: string;
  nombre: string;
  tipo: string;
  asunto?: string;
  contenido: string;
  categoria?: string;
  variables?: string[];
}

export interface AccionEjecutada {
  tipo: string;
  estado: string;
}

export interface EjecucionAutomatizacion {
  id: string;
  estado: string;
  leadNombre?: string;
  ejecutadoEn?: string;
  ejecutado_en?: string;
  accionesEjecutadas?: string | AccionEjecutada[];
  errorMensaje?: string;
}

export interface EstadisticasAutomatizacion {
  total: number;
  exitosas: number;
  fallidas: number;
  parciales: number;
  tasaExito: number;
}

export type CampoAccionActualizable = "configuracion" | "delay";
export type ValorAccionActualizable = Record<string, unknown> | number;
export type ActualizarAccion = (
  index: number,
  campo: CampoAccionActualizable,
  valor: ValorAccionActualizable
) => void;
