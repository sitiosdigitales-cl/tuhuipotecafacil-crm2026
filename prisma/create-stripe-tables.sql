-- ============================================
-- TABLA: TRANSACCIONES DE STRIPE
-- ============================================

CREATE TABLE IF NOT EXISTS transacciones (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'PAGO', -- PAGO, REEMBOLSO, SUSCRIPCION
  monto NUMERIC NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  estadado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
  stripeessionid TEXT,
  stripeaymentintent TEXT,
  stripeustomerid TEXT,
  leadid TEXT,
  ejecutivoid TEXT,
  comisionid TEXT,
  descripcion TEXT,
  metadatos JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estadado);
CREATE INDEX IF NOT EXISTS idx_transacciones_stripe_session ON transacciones(stripeessionid);
CREATE INDEX IF NOT EXISTS idx_transacciones_stripe_payment ON transacciones(stripeaymentintent);
CREATE INDEX IF NOT EXISTS idx_transacciones_lead ON transacciones(leadid);
CREATE INDEX IF NOT EXISTS idx_transacciones_ejecutivo ON transacciones(ejecutivoid);
CREATE INDEX IF NOT EXISTS idx_transacciones_comision ON transacciones(comisionid);
CREATE INDEX IF NOT EXISTS idx_transacciones_creado ON transacciones(creadoEn DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transacciones"
  ON transacciones FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert transacciones"
  ON transacciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update transacciones"
  ON transacciones FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete transacciones"
  ON transacciones FOR DELETE USING (true);


-- ============================================
-- FUNCIÓN: Calcular comisiones pendientes
-- ============================================

CREATE OR REPLACE FUNCTION calcular_comisiones_pendientes(p_ejecutivo_id TEXT)
RETURNS TABLE(
  total_pendiente NUMERIC,
  total_pagado NUMERIC,
  cantidad_pendientes INTEGER,
  cantidad_pagadas INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(comisiontotal) FILTER (WHERE pagado = FALSE), 0) as total_pendiente,
    COALESCE(SUM(comisiontotal) FILTER (WHERE pagado = TRUE), 0) as total_pagado,
    COUNT(*)::INTEGER FILTER (WHERE pagado = FALSE) as cantidad_pendientes,
    COUNT(*)::INTEGER FILTER (WHERE pagado = TRUE) as cantidad_pagadas
  FROM comisiones
  WHERE ejecutivid = p_ejecutivo_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- TRIGGER: Actualizar timestamp de actualización
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_transacciones()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizadoEn = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_transacciones
  BEFORE UPDATE ON transacciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_transacciones();


-- ============================================
-- COLUMNAS ADICIONALES EN COMISIONES
-- ============================================

-- Agregar columnas para tracking de Stripe
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS stripeessionid TEXT;
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS stripeaymentlink TEXT;
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS fechapago TIMESTAMP WITH TIME ZONE;
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS metodo TEXT DEFAULT 'STRIPE';
