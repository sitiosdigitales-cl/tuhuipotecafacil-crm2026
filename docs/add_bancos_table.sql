-- Create bancos table
CREATE TABLE IF NOT EXISTS bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  estado TEXT DEFAULT 'ACTIVO',
  convenio TEXT DEFAULT 'Estandar',
  tasa_base DECIMAL(5,2) DEFAULT 0,
  tasa_preferencial DECIMAL(5,2) DEFAULT 0,
  cae DECIMAL(5,2) DEFAULT 0,
  financiamiento_maximo INTEGER DEFAULT 90,
  plazo_maximo INTEGER DEFAULT 30,
  pie_minimo INTEGER DEFAULT 10,
  pie_maximo INTEGER DEFAULT 20,
  prepago BOOLEAN DEFAULT true,
  complemento_renta BOOLEAN DEFAULT true,
  independientes BOOLEAN DEFAULT true,
  empresas BOOLEAN DEFAULT true,
  productos JSONB DEFAULT '[]',
  requisitos JSONB DEFAULT '[]',
  contacto_nombre TEXT DEFAULT '',
  contacto_email TEXT DEFAULT '',
  contacto_telefono TEXT DEFAULT '',
  contacto_whatsapp TEXT DEFAULT '',
  sucursal TEXT DEFAULT '',
  region TEXT DEFAULT '',
  horario_atencion TEXT DEFAULT '',
  tiempo_aprobacion TEXT DEFAULT '',
  tiempo_escrituracion TEXT DEFAULT '',
  tiempo_pago TEXT DEFAULT '',
  comision_convenio TEXT DEFAULT '',
  requisitos_minimos JSONB DEFAULT '[]',
  tasas_por_tipo JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bancos_estado ON bancos(estado);
CREATE INDEX IF NOT EXISTS idx_bancos_nombre ON bancos(nombre);