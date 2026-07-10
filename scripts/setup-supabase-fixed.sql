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
  ultimoacceso TIMESTAMPTZ,
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

-- TABLA LEADS (principal del CRM)
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rut TEXT,
  email TEXT,
  telefono TEXT,
  origen TEXT NOT NULL DEFAULT 'WEB',
  etapa TEXT NOT NULL DEFAULT 'NUEVO_LEAD',
  prioridad TEXT NOT NULL DEFAULT 'MEDIA',
  nombreejecutivo TEXT,
  banco TEXT,
  tipocredito TEXT,
  montosolicitado NUMERIC,
  valorpropiedad NUMERIC,
  piedisponible NUMERIC,
  notas TEXT,
  situacionlaboral TEXT DEFAULT 'DEPENDIENTE',
  endicom BOOLEAN DEFAULT FALSE,
  dicomdetalle TEXT,
  rentamensual TEXT,
  complementarrenta BOOLEAN DEFAULT FALSE,
  cuentapie BOOLEAN DEFAULT FALSE,
  comentarios TEXT,
  etiquetas TEXT,
  referidopor TEXT,
  referidopornombre TEXT,
  codigoreferido TEXT,
  asignadoa TEXT,
  diasenetapa INTEGER DEFAULT 0,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

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
  comentarios JSONB DEFAULT '[]'::jsonb,
  historial JSONB DEFAULT '[]'::jsonb,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tareas DISABLE ROW LEVEL SECURITY;

-- TABLA DOCUMENTOS (vinculada a leads)
CREATE TABLE IF NOT EXISTS public.documentos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  leadid TEXT NOT NULL,
  leadnombre TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  archivourl TEXT,
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

-- TABLA NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'seguimiento',
  leida BOOLEAN DEFAULT FALSE,
  usuarioid TEXT,
  leadid TEXT,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notificaciones DISABLE ROW LEVEL SECURITY;

-- TABLA AUDITORIA
CREATE TABLE IF NOT EXISTS public.auditoria (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usuarioid TEXT NOT NULL,
  usuarionombre TEXT,
  accion TEXT NOT NULL,
  modulo TEXT,
  registroid TEXT,
  registronombre TEXT,
  valoranterior TEXT,
  valornuevo TEXT,
  motivo TEXT,
  ip TEXT,
  navegador TEXT,
  dispositivo TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria DISABLE ROW LEVEL SECURITY;

-- VERIFICACION
SELECT 'usuarios' as tabla, count(*) as registros FROM public.usuarios
UNION ALL
SELECT 'leads', count(*) FROM public.leads
UNION ALL
SELECT 'tareas', count(*) FROM public.tareas
UNION ALL
SELECT 'documentos', count(*) FROM public.documentos
UNION ALL
SELECT 'actividades', count(*) FROM public.actividades
UNION ALL
SELECT 'notificaciones', count(*) FROM public.notificaciones
UNION ALL
SELECT 'auditoria', count(*) FROM public.auditoria;
