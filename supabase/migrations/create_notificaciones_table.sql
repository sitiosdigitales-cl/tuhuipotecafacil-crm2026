-- Crear tabla notificaciones
-- Ejecutar en Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'info',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  leida BOOLEAN DEFAULT false,
  usuarioid UUID,
  leadid UUID,
  accionurl TEXT,
  creadoen TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuarioid ON notificaciones(usuarioid);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creadoen ON notificaciones(creadoen DESC);

-- RLS (Row Level Security)
ALTER TABLE notificaciones ENABLE ROW LEVEL POLITICS;

-- Policy: authenticated users can read all notifications
CREATE POLICY "notificaciones_select" ON notificaciones
  FOR SELECT USING (true);

-- Policy: authenticated users can insert notifications
CREATE POLICY "notificaciones_insert" ON notificaciones
  FOR INSERT WITH CHECK (true);

-- Policy: authenticated users can update notifications
CREATE POLICY "notificaciones_update" ON notificaciones
  FOR UPDATE USING (true);

-- Policy: authenticated users can delete notifications
CREATE POLICY "notificaciones_delete" ON notificaciones
  FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
