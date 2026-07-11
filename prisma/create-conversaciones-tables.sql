-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'DIRECTO',
  descripcion TEXT,
  participantes JSONB DEFAULT '[]',
  mensajesnoleidos INTEGER DEFAULT 0,
  esfijo BOOLEAN DEFAULT false,
  creadopor TEXT,
  creadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id TEXT PRIMARY KEY,
  conversacionid TEXT NOT NULL,
  remitenteid TEXT NOT NULL,
  remitentenombre TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'TEXTO',
  estado TEXT DEFAULT 'ENVIADO',
  archivourl TEXT,
  creadoen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacionid);
CREATE INDEX IF NOT EXISTS idx_conversaciones_participantes ON conversaciones USING GIN(participantes);

-- Habilitar RLS (Row Level Security)
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo por ahora)
CREATE POLICY "Allow all on conversaciones" ON conversaciones FOR ALL USING (true);
CREATE POLICY "Allow all on mensajes" ON mensajes FOR ALL USING (true);
