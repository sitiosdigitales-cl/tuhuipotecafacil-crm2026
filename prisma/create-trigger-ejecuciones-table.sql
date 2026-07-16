-- ============================================
-- TABLA: HISTORIAL DE EJECUCIONES DE TRIGGERS
-- ============================================

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

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_trigger_id ON trigger_ejecuciones(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_lead_id ON trigger_ejecuciones(lead_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_estado ON trigger_ejecuciones(estado);
CREATE INDEX IF NOT EXISTS idx_trigger_ejecuciones_ejecutado_en ON trigger_ejecuciones(ejecutado_en DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE trigger_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trigger_ejecuciones" 
  ON trigger_ejecuciones FOR SELECT USING (true);
CREATE POLICY "System can insert trigger_ejecuciones" 
  ON trigger_ejecuciones FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update trigger_ejecuciones" 
  ON trigger_ejecuciones FOR UPDATE USING (true);
