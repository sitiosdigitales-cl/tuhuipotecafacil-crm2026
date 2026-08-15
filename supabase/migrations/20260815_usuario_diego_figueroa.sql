-- Crear usuario administrador: diego.figueroa@tuta.com
--
-- Ejecutar en Supabase Dashboard > SQL Editor del proyecto dcoyjvbhrkarrmetrhiv.
-- Un agente no puede correr esto: no hay service role key disponible
-- (PROTOCOLO sección 11).
--
-- El hash corresponde a la contraseña "diegofigueroa", generado con
-- bcryptjs a 10 rondas y verificado con bcrypt.compareSync antes de escribirlo.
--
-- ADVERTENCIA: "diegofigueroa" es una contraseña débil para una cuenta
-- SUPER_ADMIN de un sistema que guarda RUT, renta líquida, estado en Dicom y
-- cédulas escaneadas. Sirve para entrar hoy y ver el sistema; cámbiala antes
-- de que esta cuenta toque datos reales.

INSERT INTO usuarios (
  id, nombre, apellido, email, password, telefono, rol, estado, creadoen
)
VALUES (
  '18e6e705-883c-40ab-8ae9-90478883cacc',
  'Diego',
  'Figueroa',
  'diego.figueroa@tuta.com',
  '$2b$10$yhnTuacnkTeECAUduLd0GeAmFje/b08udOHEZ7GBakZmL3z15TSWi',
  NULL,
  'SUPER_ADMIN',
  'ACTIVO',
  NOW()
)
ON CONFLICT (email) DO UPDATE
  SET password = EXCLUDED.password,
      rol      = EXCLUDED.rol,
      estado   = EXCLUDED.estado;

-- El id es UUID a propósito. El resto de la tabla usa TEXT ('u1', 'u2'...),
-- pero notificaciones.usuarioid está declarada UUID, así que un id con formato
-- UUID es el único que funciona con las dos. Es el mismo choque de tipos del
-- hallazgo BUG-03 de la auditoría, todavía sin resolver.

-- Comprobación
SELECT id, nombre, apellido, email, rol, estado
FROM usuarios
WHERE email = 'diego.figueroa@tuta.com';
