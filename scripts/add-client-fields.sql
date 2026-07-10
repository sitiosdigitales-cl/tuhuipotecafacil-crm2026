-- ============================================
-- AGREGAR CAMPOS DE CLIENTE A LA TABLA LEADS
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- Datos personales extendidos
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cargaslegales TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estadocivil TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS regimenmatrimonial TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechanacimiento TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estudios TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profesion TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS domicilioparticular TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS comunaciudad TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valorarriendo NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS afp TEXT;

-- Datos del empleador
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nombreempleador TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rutfactura TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechaingreso TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rentaliquida NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bancoabonorenta TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechapago TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS direccionlaboral TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS comunaciudadlaboral TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefonolaboralfijo TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS emaillaboral TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS otrosingresos TEXT;

-- Verificar que las columnas se crearon
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN (
  'cargaslegales', 'estadocivil', 'regimenmatrimonial', 'fechanacimiento',
  'estudios', 'profesion', 'domicilioparticular', 'comunaciudad',
  'valorarriendo', 'afp', 'nombreempleador', 'rutfactura',
  'fechaingreso', 'cargo', 'rentaliquida', 'bancoabonorenta',
  'fechapago', 'direccionlaboral', 'comunaciudadlaboral',
  'telefonolaboralfijo', 'emaillaboral', 'otrosingresos'
);
