-- ============================================
-- TABLAS PARA PÁGINAS PLACEHOLDER
-- ============================================

-- 1. CAMPAÑAS
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

-- 2. LANDING PAGES
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

-- 3. BIBLIOTECA
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

-- 4. FLUJOS AUTOMÁTICOS
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

-- 5. PLANTILLAS
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

-- 6. TRIGGERS
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

-- 7. INTEGRACIONES
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

-- 8. COMISIONES
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
-- ÍNDICES
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
-- RLS POLICIES
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
