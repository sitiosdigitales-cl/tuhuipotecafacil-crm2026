-- Crear bucket para backups (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Politica para que solo service_role pueda acceder
CREATE POLICY "Service role can manage backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups');