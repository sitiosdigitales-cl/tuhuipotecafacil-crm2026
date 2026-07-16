-- ============================================
-- TABLA DE PREFERENCIAS DE NOTIFICACION POR USUARIO
-- ============================================

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

-- SEED: Preferencias por defecto para todos los usuarios existentes
INSERT INTO preferencias_notificacion (id, usuario_id, canal, evento, habilitado)
SELECT
  gen_random_uuid()::text,
  u.id,
  v.evento,
  c.canal,
  TRUE
FROM usuarios u
CROSS JOIN (VALUES
  ('documento_subido'), ('documento_estado'), ('documento_version'),
  ('lead_nuevo'), ('lead_etapa'), ('lead_asignado'),
  ('tarea_asignada'), ('tarea_vencida'), ('tarea_completada'),
  ('mensaje'), ('sistema')
) AS v(evento)
CROSS JOIN (VALUES ('in_app'), ('email'), ('whatsapp')) AS c(canal)
ON CONFLICT (usuario_id, canal, evento) DO NOTHING;
