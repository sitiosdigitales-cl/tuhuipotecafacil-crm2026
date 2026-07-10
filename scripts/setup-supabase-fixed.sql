-- =============================================
-- SETUP SUPABASE - CRM TuHipotecaFacil
-- Adaptado al esquema real del CRM
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- TABLA USUARIOS (con password para login custom)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'EJECUTIVO',
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  avatar TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

INSERT INTO public.usuarios (id, nombre, apellido, email, password, rol) VALUES
('u1', 'Admin', 'Sistema', 'admin@tuhipotecafacil.cl', 'demo1234', 'SUPER_ADMIN'),
('u2', 'Andres', 'Perez', 'andres.perez@tuhipotecafacil.cl', 'demo1234', 'ADMIN'),
('u3', 'Carolina', 'Munoz', 'carolina.munoz@tuhipotecafacil.cl', 'demo1234', 'GERENTE'),
('u4', 'Diego', 'Silva', 'diego.silva@tuhipotecafacil.cl', 'demo1234', 'EJECUTIVO'),
('u5', 'Valentina', 'Torres', 'valentina.torres@tuhipotecafacil.cl', 'demo1234', 'EJECUTIVO')
ON CONFLICT (id) DO NOTHING;

-- TABLA TAREAS
CREATE TABLE IF NOT EXISTS public.tareas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  tipo TEXT NOT NULL DEFAULT 'SEGUIMIENTO',
  prioridad TEXT NOT NULL DEFAULT 'MEDIA',
  asignadoa TEXT,
  nombreejecutivo TEXT,
  leadid TEXT,
  leadnombre TEXT,
  fechavencimiento TIMESTAMPTZ,
  recordatorio TIMESTAMPTZ,
  duracionestimada INTEGER,
  etiquetas TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tareas DISABLE ROW LEVEL SECURITY;

-- TABLA DOCUMENTOS (vinculada a leads, como espera el CRM)
CREATE TABLE IF NOT EXISTS public.documentos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  leadid TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  archivoUrl TEXT,
  tamano INTEGER,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos DISABLE ROW LEVEL SECURITY;

-- TABLA ACTIVIDADES (feed de actividad del CRM)
CREATE TABLE IF NOT EXISTS public.actividades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  leadid TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  usuario TEXT,
  usuarioid TEXT,
  metadata JSONB,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.actividades DISABLE ROW LEVEL SECURITY;

-- VERIFICACION
SELECT 'usuarios' as tabla, count(*) as registros FROM public.usuarios
UNION ALL
SELECT 'tareas', count(*) FROM public.tareas
UNION ALL
SELECT 'documentos', count(*) FROM public.documentos
UNION ALL
SELECT 'actividades', count(*) FROM public.actividades
UNION ALL
SELECT 'leads', count(*) FROM public.leads;
