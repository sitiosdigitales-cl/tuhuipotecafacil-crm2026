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
