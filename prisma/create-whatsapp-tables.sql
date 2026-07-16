-- ============================================
-- TABLA: MENSAJES DE WHATSAPP
-- ============================================

CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
  id TEXT PRIMARY KEY,
  leadid TEXT NOT NULL,
  leadnombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL DEFAULT 'ENVIADO', -- ENVIADO o RECIBIDO
  contenido TEXT NOT NULL,
  tipomensaje TEXT DEFAULT 'text', -- text, template, image, document, etc.
  templateid TEXT,
  whatsappmessageid TEXT,
  estado TEXT DEFAULT 'ENVIADO', -- ENVIADO, ENTREGADO, LEIDO, FALLIDO
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  procesado BOOLEAN DEFAULT FALSE,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_lead ON mensajes_whatsapp(leadid);
CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_telefono ON mensajes_whatsapp(telefono);
CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_estado ON mensajes_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_direccion ON mensajes_whatsapp(direccion);
CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_timestamp ON mensajes_whatsapp(timestamp DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mensajes_whatsapp"
  ON mensajes_whatsapp FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert mensajes_whatsapp"
  ON mensajes_whatsapp FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update mensajes_whatsapp"
  ON mensajes_whatsapp FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete mensajes_whatsapp"
  ON mensajes_whatsapp FOR DELETE USING (true);


-- ============================================
-- TABLA: HISTORIAL DE WHATSAPP (opcional, para métricas)
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_estadisticas (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  enviados INTEGER DEFAULT 0,
  recibidos INTEGER DEFAULT 0,
  entregados INTEGER DEFAULT 0,
  leidos INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,
  plantillasenviadas INTEGER DEFAULT 0,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_estadisticas_fecha
  ON whatsapp_estadisticas(fecha);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE whatsapp_estadisticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view whatsapp_estadisticas"
  ON whatsapp_estadisticas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_estadisticas"
  ON whatsapp_estadisticas FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_estadisticas"
  ON whatsapp_estadisticas FOR UPDATE USING (true);


-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener estadísticas de WhatsApp de un lead
CREATE OR REPLACE FUNCTION obtener_estadisticas_whatsapp(p_lead_id TEXT)
RETURNS TABLE(
  total_enviados BIGINT,
  total_recibidos BIGINT,
  ultimo_mensaje TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE direccion = 'ENVIADO') as total_enviados,
    COUNT(*) FILTER (WHERE direccion = 'RECIBIDO') as total_recibidos,
    MAX(timestamp) as ultimo_mensaje
  FROM mensajes_whatsapp
  WHERE leadid = p_lead_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- TRIGGER: Actualizar estadísticas diarias
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_estadisticas_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO whatsapp_estadisticas (id, fecha, enviados, recibidos, entregados, leidos, fallidos)
  VALUES (
    gen_random_uuid()::text,
    CURRENT_DATE,
    CASE WHEN NEW.direccion = 'ENVIADO' THEN 1 ELSE 0 END,
    CASE WHEN NEW.direccion = 'RECIBIDO' THEN 1 ELSE 0 END,
    CASE WHEN NEW.estado = 'ENTREGADO' THEN 1 ELSE 0 END,
    CASE WHEN NEW.estado = 'LEIDO' THEN 1 ELSE 0 END,
    CASE WHEN NEW.estado = 'FALLIDO' THEN 1 ELSE 0 END
  )
  ON CONFLICT (fecha) DO UPDATE SET
    enviados = whatsapp_estadisticas.enviados + EXCLUDED.enviados,
    recibidos = whatsapp_estadisticas.recibidos + EXCLUDED.recibidos,
    entregados = whatsapp_estadisticas.entregados + EXCLUDED.entregados,
    leidos = whatsapp_estadisticas.leidos + EXCLUDED.leidos,
    fallidos = whatsapp_estadisticas.fallidos + EXCLUDED.fallidos,
    actualizadoEn = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estadisticas_whatsapp
  AFTER INSERT ON mensajes_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_whatsapp();
