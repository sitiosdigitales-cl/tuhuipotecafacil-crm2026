-- ============================================
-- TABLA DE ETAPAS DEL PIPELINE
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#64748B',
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar etapas por defecto si la tabla está vacía
INSERT INTO pipeline_stages (id, nombre, color, orden, activa)
SELECT * FROM (VALUES
  ('NUEVO_LEAD', 'Nuevo Lead', '#3B82F6', 1, true),
  ('CONTACTO_INICIAL', 'Contacto Inicial', '#6366F1', 2, true),
  ('CONTACTADO', 'Contactado', '#8B5CF6', 3, true),
  ('INTERESADO', 'Interesado', '#A855F7', 4, true),
  ('CALIFICACION_COMERCIAL', 'Calificación Comercial', '#D946EF', 5, true),
  ('DOCS_PENDIENTES', 'Docs. Pendientes', '#F97316', 6, true),
  ('DOCS_COMPLETAS', 'Docs. Completas', '#22C55E', 7, true),
  ('EVALUACION_BANCARIA', 'Evaluación Bancaria', '#06B6D4', 8, true),
  ('PREAPROBADO', 'Preaprobado', '#14B8A6', 9, true),
  ('APROBADO', 'Aprobado', '#10B981', 10, true),
  ('FIRMA_DIGITAL', 'Firma Digital', '#6366F1', 11, true),
  ('NOTARIA', 'Notaría', '#8B5CF6', 12, true),
  ('CREDITO_PAGADO', 'Crédito Pagado', '#22C55E', 13, true)
) AS v(id, nombre, color, orden, activa)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages LIMIT 1);

-- Habilitar RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos los usuarios autenticados)
CREATE POLICY "Allow read for authenticated users"
ON pipeline_stages FOR SELECT
TO authenticated
USING (true);

-- Política para insertar (solo ADMIN y SUPER_ADMIN)
CREATE POLICY "Allow insert for admins"
ON pipeline_stages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Política para actualizar (solo ADMIN y SUPER_ADMIN)
CREATE POLICY "Allow update for admins"
ON pipeline_stages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Política para eliminar (solo ADMIN y SUPER_ADMIN)
CREATE POLICY "Allow delete for admins"
ON pipeline_stages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Verificar
SELECT * FROM pipeline_stages ORDER BY orden;
