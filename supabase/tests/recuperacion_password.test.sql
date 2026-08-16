BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(14);

SELECT has_column(
  'public',
  'usuarios',
  'recuperacion_enviada_en',
  'usuarios registra el último correo de recuperación'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'recuperacion_enviada_en',
  'timestamp with time zone',
  'la marca de recuperación conserva zona horaria'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.reclamar_recuperacion_password(text,integer)',
    'EXECUTE'
  ),
  'anon no reserva correos de recuperación'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.reclamar_recuperacion_password(text,integer)',
    'EXECUTE'
  ),
  'authenticated no reserva correos de recuperación'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.reclamar_recuperacion_password(text,integer)',
    'EXECUTE'
  ),
  'service_role reserva correos de recuperación'
);

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'recuperacion-rpc@example.invalid',
  '',
  clock_timestamp(),
  clock_timestamp(),
  clock_timestamp()
);

INSERT INTO public.usuarios (
  id,
  nombre,
  apellido,
  email,
  password,
  rol,
  estado,
  auth_user_id
)
VALUES (
  'usuario-recuperacion-rpc',
  'Cuenta',
  'Sintetica',
  'recuperacion-rpc@example.invalid',
  NULL,
  'EJECUTIVO',
  'ACTIVO',
  '30000000-0000-4000-8000-000000000001'
);

SELECT is(
  public.reclamar_recuperacion_password('usuario-recuperacion-rpc', 900),
  true,
  'la primera solicitud reserva el turno'
);

SELECT ok(
  (
    SELECT recuperacion_enviada_en IS NOT NULL
    FROM public.usuarios
    WHERE id = 'usuario-recuperacion-rpc'
  ),
  'la reserva registra el instante de envío'
);

SELECT is(
  public.reclamar_recuperacion_password('usuario-recuperacion-rpc', 900),
  false,
  'otra solicitud dentro de la ventana no obtiene el turno'
);

UPDATE public.usuarios
SET recuperacion_enviada_en = clock_timestamp() - INTERVAL '901 seconds'
WHERE id = 'usuario-recuperacion-rpc';

SELECT is(
  public.reclamar_recuperacion_password('usuario-recuperacion-rpc', 900),
  true,
  'una solicitud posterior a la ventana vuelve a obtener el turno'
);

UPDATE public.usuarios
SET
  estado = 'INACTIVO',
  recuperacion_enviada_en = clock_timestamp() - INTERVAL '901 seconds'
WHERE id = 'usuario-recuperacion-rpc';

SELECT is(
  public.reclamar_recuperacion_password('usuario-recuperacion-rpc', 900),
  false,
  'una cuenta inactiva no obtiene el turno'
);

UPDATE public.usuarios
SET
  estado = 'ACTIVO',
  auth_user_id = NULL,
  password = 'hash-sintetico-no-utilizable',
  recuperacion_enviada_en = clock_timestamp() - INTERVAL '901 seconds'
WHERE id = 'usuario-recuperacion-rpc';

SELECT is(
  public.reclamar_recuperacion_password('usuario-recuperacion-rpc', 900),
  false,
  'una cuenta todavía no enlazada no obtiene el turno'
);

SELECT is(
  public.reclamar_recuperacion_password('usuario-inexistente', 900),
  false,
  'un identificador inexistente no obtiene el turno'
);

SELECT throws_ok(
  $$
    SELECT public.reclamar_recuperacion_password(
      'usuario-recuperacion-rpc',
      -1
    )
  $$,
  'P0001',
  'La espera de recuperación no puede ser negativa',
  'la función rechaza una espera negativa'
);

SELECT throws_ok(
  $$
    SELECT public.reclamar_recuperacion_password(
      'usuario-recuperacion-rpc',
      NULL
    )
  $$,
  'P0001',
  'La espera de recuperación no puede ser negativa',
  'la función rechaza una espera nula'
);

SELECT * FROM finish();

ROLLBACK;
