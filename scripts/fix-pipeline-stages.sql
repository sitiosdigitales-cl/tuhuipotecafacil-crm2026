-- ============================================
-- CONFIGURAR PIPELINE STAGES
-- Ejecuta este script en SQL Editor de Supabase
-- ============================================

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#64748B',
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Eliminar políticas RLS existentes (si las hay)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON pipeline_stages;
DROP POLICY IF EXISTS "Allow insert for admins" ON pipeline_stages;
DROP POLICY IF EXISTS "Allow update for admins" ON pipeline_stages;
DROP POLICY IF EXISTS "Allow delete for admins" ON pipeline_stages;

-- 3. Deshabilitar RLS temporalmente para insertar datos
ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;

-- 4. Insertar etapas por defecto
INSERT INTO pipeline_stages (id, nombre, color, orden, activa) VALUES
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
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar RLS nuevamente
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas simples (permiso total para usuarios autenticados)
CREATE POLICY "Allow all for authenticated" ON pipeline_stages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Verificar
SELECT * FROM pipeline_stages ORDER BY orden;
