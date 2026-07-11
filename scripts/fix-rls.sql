-- ============================================
-- FIX RLS FOR PIPELINE_STAGES
-- Ejecuta este SQL en Supabase SQL Editor
-- ============================================

-- Primero, eliminar todas las políticas existentes
DO $$ 
BEGIN
  -- Eliminar políticas una por una
  DROP POLICY IF EXISTS "Allow all for authenticated" ON pipeline_stages;
  DROP POLICY IF EXISTS "Allow read for authenticated users" ON pipeline_stages;
  DROP POLICY IF EXISTS "Allow insert for admins" ON pipeline_stages;
  DROP POLICY IF EXISTS "Allow update for admins" ON pipeline_stages;
  DROP POLICY IF EXISTS "Allow delete for admins" ON pipeline_stages;
  DROP POLICY IF EXISTS "pipeline_stages_select_policy" ON pipeline_stages;
  DROP POLICY IF EXISTS "pipeline_stages_insert_policy" ON pipeline_stages;
  DROP POLICY IF EXISTS "pipeline_stages_update_policy" ON pipeline_stages;
  DROP POLICY IF EXISTS "pipeline_stages_delete_policy" ON pipeline_stages;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Deshabilitar RLS completamente
ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'pipeline_stages';
