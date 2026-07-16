-- ============================================
-- SCRIPT UNIFICADO: TODAS LAS TABLAS PENDIENTES
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. TABLA DE AUDITORÍA
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  usuarioId TEXT NOT NULL,
  usuarioNombre TEXT NOT NULL,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  registroId TEXT,
  registroNombre TEXT,
  valorAnterior TEXT,
  valorNuevo TEXT,
  motivo TEXT,
  ip TEXT,
  navegador TEXT,
  dispositivo TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuarioId);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo ON auditoria(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);

ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view auditoria" ON auditoria
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert auditoria" ON auditoria
  FOR INSERT WITH CHECK (true);


-- 2. TABLA DE CONVERSACIONES
CREATE TABLE IF NOT EXISTS conversaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'DIRECTO',
  descripcion TEXT,
  participantes JSONB DEFAULT '[]',
  mensajesnoleidos INTEGER DEFAULT 0,
  esfijo BOOLEAN DEFAULT false,
  creadopor TEXT,
  creadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE MENSAJES
CREATE TABLE IF NOT EXISTS mensajes (
  id TEXT PRIMARY KEY,
  conversacionid TEXT NOT NULL,
  remitenteid TEXT NOT NULL,
  remitentenombre TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'TEXTO',
  estado TEXT DEFAULT 'ENVIADO',
  archivourl TEXT,
  creadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacionid);
CREATE INDEX IF NOT EXISTS idx_conversaciones_participantes ON conversaciones USING GIN(participantes);

ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on conversaciones" ON conversaciones FOR ALL USING (true);
CREATE POLICY "Allow all on mensajes" ON mensajes FOR ALL USING (true);


-- 4. TABLA DE EJECUCIONES DE FLUJOS
CREATE TABLE IF NOT EXISTS flujo_ejecuciones (
  id TEXT PRIMARY KEY,
  flujo_id TEXT NOT NULL,
  lead_id TEXT,
  lead_nombre TEXT,
  lead_email TEXT,
  estado TEXT NOT NULL DEFAULT 'EXITOSO',
  acciones_ejecutadas JSONB DEFAULT '[]'::jsonb,
  contexto JSONB DEFAULT '{}'::jsonb,
  duracion_total_ms INTEGER DEFAULT 0,
  error_mensaje TEXT,
  ejecutado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_flujo_id ON flujo_ejecuciones(flujo_id);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_lead_id ON flujo_ejecuciones(lead_id);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_estado ON flujo_ejecuciones(estado);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_ejecutado_en ON flujo_ejecuciones(ejecutado_en DESC);

ALTER TABLE flujo_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view flujo_ejecuciones"
  ON flujo_ejecuciones FOR SELECT USING (true);
CREATE POLICY "System can insert flujo_ejecuciones"
  ON flujo_ejecuciones FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update flujo_ejecuciones"
  ON flujo_ejecuciones FOR UPDATE USING (true);


-- 5. TABLA DE EJECUCIONES DE TRIGGERS
CREATE TABLE IF NOT EXISTS trigger_ejecuciones (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL,
  lead_id TEXT,
  lead_nombre TEXT,
  lead_email TEXT,
  estado TEXT NOT NULL DEFAULT 'EXITOSO',
  acciones_ejecutadas JSONB DEFAULT '[]'::jsonb,
  contexto JSONB DEFAULT '{}'::jsonb,
  duracion_total_ms INTEGER DEFAULT 0,
  error_mensaje TEXT,
  ejecutado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_trigger_id ON trigger_ejecuciones(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_lead_id ON trigger_ejecuciones(lead_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_estado ON trigger_ejecuciones(estado);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_ejecutado_en ON trigger_ejecuciones(ejecutado_en DESC);

ALTER TABLE trigger_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trigger_ejecuciones"
  ON trigger_ejecuciones FOR SELECT USING (true);
CREATE POLICY "System can insert trigger_ejecuciones"
  ON trigger_ejecuciones FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update trigger_ejecuciones"
  ON trigger_ejecuciones FOR UPDATE USING (true);


-- 6. TABLA DE PREFERENCIAS DE NOTIFICACIÓN
CREATE TABLE IF NOT EXISTS preferencias_notificacion (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'in_app',
  evento TEXT NOT NULL,
  habilitado BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pref_notif_usuario_canal_evento
  ON preferencias_notificacion(usuario_id, canal, evento);

ALTER TABLE preferencias_notificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view preferencias" ON preferencias_notificacion FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert preferencias" ON preferencias_notificacion FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update preferencias" ON preferencias_notificacion FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete preferencias" ON preferencias_notificacion FOR DELETE USING (true);


-- 7. TABLAS PLACEHOLDER (Marketing, Landing Pages, etc.)

-- 7.1 CAMPAÑAS
CREATE TABLE IF NOT EXISTS campanas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'EMAIL',
  estado TEXT NOT NULL DEFAULT 'PROGRAMADA',
  descripcion TEXT,
  fechaInicio TIMESTAMP WITH TIME ZONE,
  fechaFin TIMESTAMP WITH TIME ZONE,
  presupuesto NUMERIC DEFAULT 0,
  gastado NUMERIC DEFAULT 0,
  audiencia INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  abiertos INTEGER DEFAULT 0,
  clics INTEGER DEFAULT 0,
  conversiones INTEGER DEFAULT 0,
  ingresos NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  segmento TEXT,
  plantilla TEXT,
  creador TEXT,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.2 LANDING PAGES
CREATE TABLE IF NOT EXISTS landings (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  url TEXT,
  tipo TEXT NOT NULL DEFAULT 'FORMULARIO',
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  descripcion TEXT,
  visitas INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversiones INTEGER DEFAULT 0,
  tasaConversion NUMERIC DEFAULT 0,
  templates TEXT,
  configuracion JSONB,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.3 BIBLIOTECA
CREATE TABLE IF NOT EXISTS biblioteca (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'DOCUMENTO',
  categoria TEXT,
  descripcion TEXT,
  archivoUrl TEXT,
  tamanio INTEGER DEFAULT 0,
  formatos TEXT,
  descargas INTEGER DEFAULT 0,
  favorito BOOLEAN DEFAULT FALSE,
  etiquetas TEXT[],
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.4 FLUJOS AUTOMÁTICOS
CREATE TABLE IF NOT EXISTS flujos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  trigger TEXT,
  pasos JSONB DEFAULT '[]'::jsonb,
  ejecuciones INTEGER DEFAULT 0,
  exitosos INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,
  ultimoEjecucion TIMESTAMP WITH TIME ZONE,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.5 PLANTILLAS
CREATE TABLE IF NOT EXISTS plantillas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'EMAIL',
  asunto TEXT,
  contenido TEXT NOT NULL,
  categoria TEXT,
  variables TEXT[],
  usos INTEGER DEFAULT 0,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.6 TRIGGERS
CREATE TABLE IF NOT EXISTS triggers (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'CAMBIO_ETAPA',
  condicion JSONB,
  accion TEXT,
  accionConfig JSONB,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  ejecuciones INTEGER DEFAULT 0,
  ultimoEjecucion TIMESTAMP WITH TIME ZONE,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.7 INTEGRACIONES
CREATE TABLE IF NOT EXISTS integraciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'API',
  proveedor TEXT,
  estado TEXT NOT NULL DEFAULT 'DESCONECTADA',
  configuracion JSONB,
  ultimaSync TIMESTAMP WITH TIME ZONE,
  syncCount INTEGER DEFAULT 0,
  errores INTEGER DEFAULT 0,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.8 COMISIONES
CREATE TABLE IF NOT EXISTS comisiones (
  id TEXT PRIMARY KEY,
  ejecutivoId TEXT NOT NULL,
  ejecutivoNombre TEXT NOT NULL,
  mes TEXT NOT NULL,
  anio INTEGER NOT NULL,
  creditosAprobados INTEGER DEFAULT 0,
  montoTotal NUMERIC DEFAULT 0,
  tasaComision NUMERIC DEFAULT 0,
  comisionTotal NUMERIC DEFAULT 0,
  pagado BOOLEAN DEFAULT FALSE,
  fechaPago TIMESTAMP WITH TIME ZONE,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- ÍNDICES PARA TABLAS PLACEHOLDER
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON campanas(estado);
CREATE INDEX IF NOT EXISTS idx_campanas_tipo ON campanas(tipo);
CREATE INDEX IF NOT EXISTS idx_landings_estado ON landings(estado);
CREATE INDEX IF NOT EXISTS idx_biblioteca_categoria ON biblioteca(categoria);
CREATE INDEX IF NOT EXISTS idx_biblioteca_tipo ON biblioteca(tipo);
CREATE INDEX IF NOT EXISTS idx_flujos_estado ON flujos(estado);
CREATE INDEX IF NOT EXISTS idx_plantillas_tipo ON plantillas(tipo);
CREATE INDEX IF NOT EXISTS idx_triggers_estado ON triggers(estado);
CREATE INDEX IF NOT EXISTS idx_integraciones_estado ON integraciones(estado);
CREATE INDEX IF NOT EXISTS idx_comisiones_ejecutivo ON comisiones(ejecutivoId);
CREATE INDEX IF NOT EXISTS idx_comisiones_periodo ON comisiones(mes, anio);


-- ============================================
-- RLS POLICIES PARA TABLAS PLACEHOLDER
-- ============================================
ALTER TABLE campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE landings ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE integraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campanas" ON campanas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert campanas" ON campanas FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update campanas" ON campanas FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete campanas" ON campanas FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view landings" ON landings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert landings" ON landings FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update landings" ON landings FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete landings" ON landings FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view biblioteca" ON biblioteca FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert biblioteca" ON biblioteca FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update biblioteca" ON biblioteca FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete biblioteca" ON biblioteca FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view flujos" ON flujos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert flujos" ON flujos FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update flujos" ON flujos FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete flujos" ON flujos FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view plantillas" ON plantillas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert plantillas" ON plantillas FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update plantillas" ON plantillas FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete plantillas" ON plantillas FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view triggers" ON triggers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert triggers" ON triggers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update triggers" ON triggers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete triggers" ON triggers FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view integraciones" ON integraciones FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert integraciones" ON integraciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update integraciones" ON integraciones FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete integraciones" ON integraciones FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view comisiones" ON comisiones FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comisiones" ON comisiones FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update comisiones" ON comisiones FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete comisiones" ON comisiones FOR DELETE USING (true);


-- ============================================
-- FIX: COLUMNAS FALTANTES EN USUARIOS
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimoacceso TIMESTAMP WITH TIME ZONE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doisfa BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentosfallidos INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS suspendidohasta TIMESTAMP WITH TIME ZONE;


-- ============================================
-- BUCKET PARA BACKUPS (si no existe)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service role can manage backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups');


-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================
-- ¡Todas las tablas creadas exitosamente!
-- Resumen:
-- - auditoria (con índices y RLS)
-- - conversaciones + mensajes (con índices y RLS)
-- - flujo_ejecuciones (con índices y RLS)
-- - trigger_ejecuciones (con índices y RLS)
-- - preferencias_notificacion (con índices y RLS)
-- - campanas, landings, biblioteca, flujos, plantillas, triggers, integraciones, comisiones (con índices y RLS)
-- - Bucket de backups en Storage
-- - Columnas faltantes en usuarios
