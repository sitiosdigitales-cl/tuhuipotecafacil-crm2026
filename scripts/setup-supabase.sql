-- =============================================
-- SETUP COMPLETO SUPABASE - CRM TuHipotecaFacil
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- TABLA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  rol TEXT DEFAULT 'EJECUTIVO',
  estado TEXT DEFAULT 'ACTIVO',
  avatar TEXT,
  creadoen TIMESTAMPTZ DEFAULT now(),
  actualizadoen TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

INSERT INTO usuarios (id, nombre, apellido, email, password, rol) VALUES
('u1', 'Admin', 'Sistema', 'admin@tuhipotecafacil.cl', 'demo1234', 'SUPER_ADMIN'),
('u2', 'Andres', 'Perez', 'andres.perez@tuhipotecafacil.cl', 'demo1234', 'ADMIN'),
('u3', 'Carolina', 'Munoz', 'carolina.munoz@tuhipotecafacil.cl', 'demo1234', 'GERENTE'),
('u4', 'Diego', 'Silva', 'diego.silva@tuhipotecafacil.cl', 'demo1234', 'EJECUTIVO'),
('u5', 'Valentina', 'Torres', 'valentina.torres@tuhipotecafacil.cl', 'demo1234', 'EJECUTIVO')
ON CONFLICT (id) DO NOTHING;

-- TABLA TAREAS
CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'PENDIENTE',
  tipo TEXT DEFAULT 'SEGUIMIENTO',
  prioridad TEXT DEFAULT 'MEDIA',
  asignadoa TEXT,
  nombreejecutivo TEXT,
  leadid TEXT,
  leadnombre TEXT,
  fechavencimiento TIMESTAMPTZ,
  recordatorio TIMESTAMPTZ,
  duracionestimada INTEGER,
  etiquetas TEXT,
  creadoen TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tareas DISABLE ROW LEVEL SECURITY;

-- TABLA DOCUMENTOS
CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  leadid TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT,
  estado TEXT DEFAULT 'PENDIENTE',
  archivoUrl TEXT,
  tamano INTEGER,
  creadoen TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;

-- TABLA ACTIVIDADES
CREATE TABLE IF NOT EXISTS actividades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  leadid TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  usuario TEXT,
  usuarioid TEXT,
  metadata JSONB,
  creadoen TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE actividades DISABLE ROW LEVEL SECURITY;
