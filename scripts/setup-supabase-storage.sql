-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- 1. Crear bucket de documentos (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir INSERT (subir archivos)
CREATE POLICY "Permitir subir documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

-- 3. Política para permitir SELECT (descargar archivos)
CREATE POLICY "Permitir descargar documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

-- 4. Política para permitir DELETE (eliminar archivos)
CREATE POLICY "Permitir eliminar documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentos');

-- 5. Política para permitir UPDATE (actualizar archivos)
CREATE POLICY "Permitir actualizar documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos');

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE name = 'documentos';

-- Verificar las políticas creadas
SELECT * FROM storage.policies WHERE bucket_id = 'documentos';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script crea un bucket PÚBLICO (las URLs son accesibles sin autenticación)
-- 2. Las políticas usan "authenticated" que significa usuarios logueados
-- 3. Si necesitas acceso público total, cambia "authenticated" por "public"
-- 4. El límite de tamaño es 10MB por archivo
-- 5. Solo se permiten: PDF, JPEG, PNG, JPG, DOC, DOCX
