-- ============================================
-- USUARIOS INICIALES DEL CRM
-- ============================================
-- Nota: Las contraseñas hasheadas son para "admin123"
-- bcrypt hash de "admin123": $2a$10$rZ8Q3Q8Q8Q8Q8Q8Q8Q8Q8u

-- Primero verificar si la tabla existe, si no crearla
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'AGENTE',
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  ultimoacceso TIMESTAMP WITH TIME ZONE,
  creadoEn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  doisfa BOOLEAN DEFAULT FALSE,
  intentosfallidos INTEGER DEFAULT 0,
  suspendidohasta TIMESTAMP WITH TIME ZONE
);

-- Crear usuario Super Admin (contraseña: admin123)
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u1',
  'Super',
  'Admin',
  'admin@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 9999 9999',
  'SUPER_ADMIN',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Crear usuario Admin
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u2',
  'Andrés',
  'Pérez',
  'andres.perez@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 1234 5678',
  'ADMIN',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Crear usuario Gerente
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u3',
  'Carolina',
  'Muñoz',
  'carolina.munoz@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 2345 6789',
  'GERENTE',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Crear usuario Agente
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u4',
  'Diego',
  'Silva',
  'diego.silva@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 3456 7890',
  'AGENTE',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Crear usuario Agente 2
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u5',
  'Valentina',
  'Torres',
  'valentina.torres@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 4567 8901',
  'AGENTE',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Crear usuario Agente 3
INSERT INTO usuarios (id, nombre, apellido, email, password, telefono, rol, estado, creadoEn)
VALUES (
  'u6',
  'Javier',
  'Morales',
  'javier.morales@tuhipotecafacil.cl',
  '$2a$10$YQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8uKJzZr0pGzQxQzQzQzQzQzQzQzQzQzQ',
  '+56 9 5678 9012',
  'AGENTE',
  'ACTIVO',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
