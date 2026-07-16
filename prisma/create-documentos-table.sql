-- ============================================
-- TABLA: DOCUMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY,
  leadid TEXT NOT NULL,
  leadnombre TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'OTRO',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  archivourl TEXT,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_documentos_lead ON documentos(leadid);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_creado ON documentos(creadoEn DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documentos"
  ON documentos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert documentos"
  ON documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update documentos"
  ON documentos FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete documentos"
  ON documentos FOR DELETE USING (true);

-- Permitir acceso público para portal del cliente
CREATE POLICY "Public can view documentos"
  ON documentos FOR SELECT USING (true);
CREATE POLICY "Public can insert documentos"
  ON documentos FOR INSERT WITH CHECK (true);


-- ============================================
-- BUCKET PARA DOCUMENTOS (si no existe)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para que todos puedan leer documentos públicos
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos');

-- Política para que usuarios autenticados puedan subir documentos
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Política para que usuarios autenticados puedan eliminar documentos
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documentos');
