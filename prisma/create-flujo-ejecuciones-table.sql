-- ============================================
-- TABLA: HISTORIAL DE EJECUCIONES DE FLUJOS
-- ============================================

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

-- Indices
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_flujo_id ON flujo_ejecuciones(flujo_id);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_lead_id ON flujo_ejecuciones(lead_id);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_estado ON flujo_ejecuciones(estado);
CREATE INDEX IF NOT EXISTS idx_flujo_ejecuciones_ejecutado_en ON flujo_ejecuciones(ejecutado_en DESC);

-- RLS
ALTER TABLE flujo_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view flujo_ejecuciones" 
  ON flujo_ejecuciones FOR SELECT USING (true);
CREATE POLICY "System can insert flujo_ejecuciones" 
  ON flujo_ejecuciones FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update flujo_ejecuciones" 
  ON flujo_ejecuciones FOR UPDATE USING (true);