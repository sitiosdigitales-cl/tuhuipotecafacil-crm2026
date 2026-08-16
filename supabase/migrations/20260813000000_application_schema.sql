-- Baseline del contrato que usa la aplicación.
--
-- No contiene datos. Antes de marcarla como aplicada en un proyecto existente,
-- una persona autorizada debe comparar este esquema con un dump remoto sin
-- datos. En proyectos nuevos se ejecuta normalmente desde cero.

CREATE TABLE public.usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'AGENTE',
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  avatar TEXT,
  doisfa BOOLEAN NOT NULL DEFAULT false,
  intentosfallidos INTEGER NOT NULL DEFAULT 0,
  suspendidohasta TIMESTAMPTZ,
  ultimoacceso TIMESTAMPTZ,
  cargo TEXT,
  departamento TEXT,
  telefonotrabajo TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  fechaingreso DATE,
  fechanacimiento DATE,
  biografia TEXT,
  linkedin TEXT,
  website TEXT,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  idiomas TEXT[] NOT NULL DEFAULT '{}',
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX usuarios_email_unique ON public.usuarios (lower(email));

CREATE TABLE public.leads (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rut TEXT NOT NULL,
  edad INTEGER,
  email TEXT,
  telefono TEXT,
  origen TEXT NOT NULL DEFAULT 'WEB',
  etapa TEXT NOT NULL DEFAULT 'NUEVO_LEAD',
  prioridad TEXT NOT NULL DEFAULT 'MEDIA',
  asignadoa TEXT,
  nombreejecutivo TEXT,
  banco TEXT,
  tipocredito TEXT,
  montosolicitado NUMERIC(18, 2),
  valorpropiedad NUMERIC(18, 2),
  piedisponible NUMERIC(18, 2),
  etiquetas TEXT,
  notas TEXT,
  situacionlaboral TEXT NOT NULL DEFAULT 'DEPENDIENTE',
  endicom BOOLEAN NOT NULL DEFAULT false,
  dicomdetalle TEXT,
  rentamensual TEXT,
  complementarrenta BOOLEAN NOT NULL DEFAULT false,
  cuentapie BOOLEAN NOT NULL DEFAULT false,
  comentarios TEXT,
  referidopor TEXT,
  referidopornombre TEXT,
  codigoreferido TEXT,
  diasenetapa INTEGER NOT NULL DEFAULT 0,
  cargaslegales TEXT,
  estadocivil TEXT,
  regimenmatrimonial TEXT,
  fechanacimiento DATE,
  estudios TEXT,
  profesion TEXT,
  domicilioparticular TEXT,
  comunaciudad TEXT,
  valorarriendo NUMERIC(18, 2),
  afp TEXT,
  nombreempleador TEXT,
  rutfactura TEXT,
  fechaingreso DATE,
  cargo TEXT,
  rentaliquida NUMERIC(18, 2),
  bancoabonorenta TEXT,
  fechapago TEXT,
  direccionlaboral TEXT,
  comunaciudadlaboral TEXT,
  telefonolaboralfijo TEXT,
  emaillaboral TEXT,
  otrosingresos TEXT,
  patrimoniovehiculo TEXT,
  patrimoniovivienda TEXT,
  patrimoniootros TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_rut_unique ON public.leads (rut) WHERE rut <> '';

CREATE TABLE public.documentos (
  id TEXT PRIMARY KEY,
  leadid TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  leadnombre TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'OTRO',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  archivourl TEXT,
  tamano BIGINT,
  observaciones TEXT,
  aprobadoen TIMESTAMPTZ,
  aprobadopor TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tareas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  tipo TEXT NOT NULL DEFAULT 'SEGUIMIENTO',
  prioridad TEXT NOT NULL DEFAULT 'MEDIA',
  asignadoa TEXT,
  nombreejecutivo TEXT,
  leadid TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  leadnombre TEXT,
  fechavencimiento TIMESTAMPTZ,
  recordatorio TIMESTAMPTZ,
  duracionestimada INTEGER,
  etiquetas TEXT,
  comentarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  historial JSONB NOT NULL DEFAULT '[]'::jsonb,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.actividades (
  id TEXT PRIMARY KEY,
  leadid TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario TEXT,
  usuarioid TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.eventos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  horainicio TIME,
  horafin TIME,
  tipo TEXT NOT NULL DEFAULT 'reunion',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  leadid TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  leadnombre TEXT,
  ubicacion TEXT,
  recordatorio BOOLEAN NOT NULL DEFAULT false,
  completado BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.recordatorios (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'sistema',
  frecuencia TEXT NOT NULL DEFAULT 'una_vez',
  leadid TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  leadnombre TEXT,
  fechaenvio TIMESTAMPTZ NOT NULL DEFAULT now(),
  proximoenvio TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'pendiente',
  activo BOOLEAN NOT NULL DEFAULT true,
  intentos INTEGER NOT NULL DEFAULT 0,
  maxintentos INTEGER NOT NULL DEFAULT 3,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.solicitudes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  cliente_id TEXT NOT NULL,
  tipo_credito TEXT NOT NULL,
  monto_solicitado NUMERIC(18, 2) NOT NULL,
  plazo_meses INTEGER NOT NULL,
  tasa_interes NUMERIC(8, 4),
  cuota_mensual NUMERIC(18, 2),
  valor_propiedad NUMERIC(18, 2) NOT NULL,
  pie_disponible NUMERIC(18, 2) NOT NULL,
  direccion_propiedad TEXT,
  comuna_propiedad TEXT,
  estado TEXT NOT NULL DEFAULT 'EN_REVISION',
  banco_asignado TEXT,
  ejecutivo_id TEXT NOT NULL,
  fecha_envio_banco TIMESTAMPTZ,
  fecha_respuesta TIMESTAMPTZ,
  fecha_aprobacion TIMESTAMPTZ,
  fecha_firma TIMESTAMPTZ,
  fecha_desembolso TIMESTAMPTZ,
  documentos_completos INTEGER NOT NULL DEFAULT 0,
  documentos_requeridos INTEGER NOT NULL DEFAULT 0,
  dias_en_proceso INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  etiquetas TEXT[] NOT NULL DEFAULT '{}',
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'DIRECTO',
  descripcion TEXT,
  participantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  mensajesnoleidos INTEGER NOT NULL DEFAULT 0,
  esfijo BOOLEAN NOT NULL DEFAULT false,
  creadopor TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mensajes (
  id TEXT PRIMARY KEY,
  conversacionid TEXT NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  remitenteid TEXT NOT NULL,
  remitentenombre TEXT NOT NULL,
  remitenteavatar TEXT,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'TEXTO',
  estado TEXT NOT NULL DEFAULT 'ENVIADO',
  archivourl TEXT,
  editadoen TIMESTAMPTZ,
  respondiendoa TEXT,
  reacciones JSONB NOT NULL DEFAULT '{}'::jsonb,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notificaciones (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'info',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  leida BOOLEAN NOT NULL DEFAULT false,
  usuarioid TEXT,
  leadid TEXT,
  accionurl TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.preferencias_notificacion (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'in_app',
  evento TEXT NOT NULL,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, canal, evento)
);

CREATE TABLE public.campanas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'EMAIL',
  estado TEXT NOT NULL DEFAULT 'PROGRAMADA',
  descripcion TEXT,
  fechainicio TIMESTAMPTZ,
  fechafin TIMESTAMPTZ,
  presupuesto NUMERIC(18, 2) NOT NULL DEFAULT 0,
  gastado NUMERIC(18, 2) NOT NULL DEFAULT 0,
  audiencia INTEGER NOT NULL DEFAULT 0,
  enviados INTEGER NOT NULL DEFAULT 0,
  abiertos INTEGER NOT NULL DEFAULT 0,
  clics INTEGER NOT NULL DEFAULT 0,
  conversiones INTEGER NOT NULL DEFAULT 0,
  ingresos NUMERIC(18, 2) NOT NULL DEFAULT 0,
  roi NUMERIC(10, 2) NOT NULL DEFAULT 0,
  segmento TEXT,
  plantilla TEXT,
  creador TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.landings (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  url TEXT,
  tipo TEXT NOT NULL DEFAULT 'FORMULARIO',
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  descripcion TEXT,
  visitas INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversiones INTEGER NOT NULL DEFAULT 0,
  tasaconversion NUMERIC(10, 2) NOT NULL DEFAULT 0,
  templates TEXT,
  configuracion JSONB NOT NULL DEFAULT '{}'::jsonb,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.biblioteca (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'DOCUMENTO',
  categoria TEXT,
  descripcion TEXT,
  archivourl TEXT,
  tamanio INTEGER NOT NULL DEFAULT 0,
  formatos TEXT,
  descargas INTEGER NOT NULL DEFAULT 0,
  favorito BOOLEAN NOT NULL DEFAULT false,
  etiquetas TEXT[] NOT NULL DEFAULT '{}',
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.flujos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  trigger TEXT,
  pasos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ejecuciones INTEGER NOT NULL DEFAULT 0,
  exitosos INTEGER NOT NULL DEFAULT 0,
  fallidos INTEGER NOT NULL DEFAULT 0,
  ultimoejecucion TIMESTAMPTZ,
  ultimo_ejecucion TIMESTAMPTZ,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.plantillas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'EMAIL',
  asunto TEXT,
  contenido TEXT NOT NULL,
  categoria TEXT,
  variables TEXT[] NOT NULL DEFAULT '{}',
  usos INTEGER NOT NULL DEFAULT 0,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.triggers (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'CAMBIO_ETAPA',
  condicion JSONB,
  accion TEXT,
  accionconfig JSONB,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  ejecuciones INTEGER NOT NULL DEFAULT 0,
  exitosos INTEGER NOT NULL DEFAULT 0,
  fallidos INTEGER NOT NULL DEFAULT 0,
  ultimoejecucion TIMESTAMPTZ,
  ultimo_ejecucion TIMESTAMPTZ,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.integraciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'API',
  proveedor TEXT,
  estado TEXT NOT NULL DEFAULT 'DESCONECTADA',
  configuracion JSONB NOT NULL DEFAULT '{}'::jsonb,
  ultimasync TIMESTAMPTZ,
  synccount INTEGER NOT NULL DEFAULT 0,
  errores INTEGER NOT NULL DEFAULT 0,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comisiones (
  id TEXT PRIMARY KEY,
  ejecutivoid TEXT NOT NULL,
  ejecutivonombre TEXT NOT NULL,
  mes TEXT NOT NULL,
  anio INTEGER NOT NULL,
  creditosaprobados INTEGER NOT NULL DEFAULT 0,
  montototal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tasacomision NUMERIC(8, 4) NOT NULL DEFAULT 0,
  comisiontotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  pagado BOOLEAN NOT NULL DEFAULT false,
  fechapago TIMESTAMPTZ,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.flujo_ejecuciones (
  id TEXT PRIMARY KEY,
  flujo_id TEXT NOT NULL REFERENCES public.flujos(id) ON DELETE CASCADE,
  lead_id TEXT,
  lead_nombre TEXT,
  lead_email TEXT,
  estado TEXT NOT NULL DEFAULT 'EXITOSO',
  acciones_ejecutadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
  duracion_total_ms INTEGER NOT NULL DEFAULT 0,
  error_mensaje TEXT,
  ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trigger_ejecuciones (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL REFERENCES public.triggers(id) ON DELETE CASCADE,
  lead_id TEXT,
  lead_nombre TEXT,
  lead_email TEXT,
  estado TEXT NOT NULL DEFAULT 'EXITOSO',
  acciones_ejecutadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
  duracion_total_ms INTEGER NOT NULL DEFAULT 0,
  error_mensaje TEXT,
  ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mensajes_whatsapp (
  id TEXT PRIMARY KEY,
  leadid TEXT NOT NULL,
  leadnombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL DEFAULT 'ENVIADO',
  contenido TEXT NOT NULL,
  tipomensaje TEXT NOT NULL DEFAULT 'text',
  templateid TEXT,
  whatsappmessageid TEXT,
  estado TEXT NOT NULL DEFAULT 'ENVIADO',
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  procesado BOOLEAN NOT NULL DEFAULT false,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_estadisticas (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT current_date,
  enviados INTEGER NOT NULL DEFAULT 0,
  recibidos INTEGER NOT NULL DEFAULT 0,
  entregados INTEGER NOT NULL DEFAULT 0,
  leidos INTEGER NOT NULL DEFAULT 0,
  fallidos INTEGER NOT NULL DEFAULT 0,
  plantillasenviadas INTEGER NOT NULL DEFAULT 0,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fecha)
);

CREATE TABLE public.auditoria (
  id TEXT PRIMARY KEY,
  usuarioid TEXT NOT NULL,
  usuarionombre TEXT NOT NULL,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  registroid TEXT,
  registronombre TEXT,
  valoranterior TEXT,
  valornuevo TEXT,
  motivo TEXT,
  ip TEXT,
  navegador TEXT,
  dispositivo TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bancos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  convenio TEXT NOT NULL DEFAULT 'Estandar',
  tasa_base NUMERIC(8, 4) NOT NULL DEFAULT 0,
  tasa_preferencial NUMERIC(8, 4) NOT NULL DEFAULT 0,
  cae NUMERIC(8, 4) NOT NULL DEFAULT 0,
  financiamiento_maximo INTEGER NOT NULL DEFAULT 90,
  plazo_maximo INTEGER NOT NULL DEFAULT 30,
  pie_minimo INTEGER NOT NULL DEFAULT 10,
  pie_maximo INTEGER NOT NULL DEFAULT 20,
  prepago BOOLEAN NOT NULL DEFAULT true,
  complemento_renta BOOLEAN NOT NULL DEFAULT true,
  independientes BOOLEAN NOT NULL DEFAULT true,
  empresas BOOLEAN NOT NULL DEFAULT true,
  productos JSONB NOT NULL DEFAULT '[]'::jsonb,
  requisitos JSONB NOT NULL DEFAULT '[]'::jsonb,
  contacto_nombre TEXT NOT NULL DEFAULT '',
  contacto_email TEXT NOT NULL DEFAULT '',
  contacto_telefono TEXT NOT NULL DEFAULT '',
  contacto_whatsapp TEXT NOT NULL DEFAULT '',
  sucursal TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  horario_atencion TEXT NOT NULL DEFAULT '',
  tiempo_aprobacion TEXT NOT NULL DEFAULT '',
  tiempo_escrituracion TEXT NOT NULL DEFAULT '',
  tiempo_pago TEXT NOT NULL DEFAULT '',
  comision_convenio TEXT NOT NULL DEFAULT '',
  requisitos_minimos JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasas_por_tipo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_stages (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748B',
  orden INTEGER NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (orden)
);

CREATE INDEX documentos_leadid_idx ON public.documentos (leadid);
CREATE INDEX tareas_leadid_idx ON public.tareas (leadid);
CREATE INDEX tareas_asignadoa_idx ON public.tareas (asignadoa);
CREATE INDEX actividades_leadid_fecha_idx ON public.actividades (leadid, fecha DESC);
CREATE INDEX eventos_fecha_idx ON public.eventos (fecha);
CREATE INDEX recordatorios_proximoenvio_idx ON public.recordatorios (proximoenvio);
CREATE INDEX solicitudes_lead_id_idx ON public.solicitudes (lead_id);
CREATE INDEX solicitudes_ejecutivo_id_idx ON public.solicitudes (ejecutivo_id);
CREATE INDEX mensajes_conversacionid_idx ON public.mensajes (conversacionid, creadoen);
CREATE INDEX notificaciones_usuarioid_leida_idx ON public.notificaciones (usuarioid, leida);
CREATE INDEX comisiones_periodo_idx ON public.comisiones (anio, mes);
CREATE INDEX auditoria_fecha_idx ON public.auditoria (fecha DESC);
CREATE INDEX pipeline_stages_orden_idx ON public.pipeline_stages (orden);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;
