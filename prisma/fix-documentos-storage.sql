-- ============================================
-- FIX: Storage policies para uploads públicos
-- ============================================

-- Eliminar política anterior que solo permite usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

-- Crear política que permita uploads públicos (para portal del cliente)
CREATE POLICY "Anyone can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Eliminar política anterior de delete
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Crear política de delete más permisiva
CREATE POLICY "Anyone can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documentos');


-- ============================================
-- FIX: Columna creadoEn (lowercase para Supabase)
-- ============================================

-- Renombrar columna si existe con camelCase
ALTER TABLE documentos RENAME COLUMN "creadoEn" TO "creadoen";

-- Si no existe la columna, crearla
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'creadoen') THEN
    ALTER TABLE documentos ADD COLUMN creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;
