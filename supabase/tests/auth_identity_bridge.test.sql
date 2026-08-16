BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(18);

SELECT has_column(
  'public',
  'usuarios',
  'auth_user_id',
  'usuarios enlaza una identidad de Auth'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'auth_user_id',
  'uuid',
  'la identidad enlazada usa UUID'
);

SELECT has_column(
  'public',
  'usuarios',
  'auth_migrated_at',
  'usuarios registra cuándo migró'
);

SELECT has_column(
  'public',
  'usuarios',
  'auth_migration_token',
  'usuarios conserva un claim temporal'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.reclamar_migracion_auth(text,uuid)',
    'EXECUTE'
  ),
  'anon no reclama migraciones'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.reclamar_migracion_auth(text,uuid)',
    'EXECUTE'
  ),
  'authenticated no reclama migraciones'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.reclamar_migracion_auth(text,uuid)',
    'EXECUTE'
  ),
  'service_role puede reclamar migraciones'
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
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'auth-bridge@example.invalid',
  '',
  now(),
  now(),
  now()
);

INSERT INTO public.usuarios (
  id,
  nombre,
  apellido,
  email,
  password,
  rol,
  estado
)
VALUES (
  'usuario-auth-bridge',
  'Cuenta',
  'Sintetica',
  'auth-bridge@example.invalid',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'EJECUTIVO',
  'ACTIVO'
);

SELECT is(
  public.reclamar_migracion_auth(
    'usuario-auth-bridge',
    '20000000-0000-4000-8000-000000000001'
  ),
  true,
  'el primer proceso obtiene el claim'
);

SELECT is(
  public.reclamar_migracion_auth(
    'usuario-auth-bridge',
    '20000000-0000-4000-8000-000000000002'
  ),
  false,
  'un proceso paralelo no obtiene el mismo usuario'
);

SELECT is(
  (
    SELECT auth_migration_token
    FROM public.usuarios
    WHERE id = 'usuario-auth-bridge'
  ),
  '20000000-0000-4000-8000-000000000001'::UUID,
  'la fila conserva el token ganador'
);

SELECT is(
  public.liberar_migracion_auth(
    'usuario-auth-bridge',
    '20000000-0000-4000-8000-000000000002'
  ),
  false,
  'otro token no libera el claim'
);

SELECT is(
  public.liberar_migracion_auth(
    'usuario-auth-bridge',
    '20000000-0000-4000-8000-000000000001'
  ),
  true,
  'el dueño puede liberar el claim'
);

SELECT is(
  public.reclamar_migracion_auth(
    'usuario-auth-bridge',
    '20000000-0000-4000-8000-000000000003'
  ),
  true,
  'la fila liberada puede volver a reclamarse'
);

SELECT lives_ok(
  $$
    SELECT public.completar_migracion_auth(
      'usuario-auth-bridge',
      '20000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001'
    )
  $$,
  'el claim enlaza una identidad existente'
);

SELECT is(
  (
    SELECT auth_user_id
    FROM public.usuarios
    WHERE id = 'usuario-auth-bridge'
  ),
  '10000000-0000-4000-8000-000000000001'::UUID,
  'la cuenta queda enlazada a Auth'
);

SELECT is(
  (
    SELECT password
    FROM public.usuarios
    WHERE id = 'usuario-auth-bridge'
  ),
  NULL::TEXT,
  'la finalización retira el hash legado'
);

SELECT ok(
  (
    SELECT
      auth_migrated_at IS NOT NULL
      AND auth_migration_token IS NULL
      AND auth_migration_started_at IS NULL
    FROM public.usuarios
    WHERE id = 'usuario-auth-bridge'
  ),
  'la finalización registra fecha y limpia el claim'
);

SELECT throws_ok(
  $$
    UPDATE public.usuarios
    SET auth_user_id = NULL, password = NULL
    WHERE id = 'usuario-auth-bridge'
  $$,
  '23514',
  NULL,
  'una cuenta no puede quedar sin ambas credenciales'
);

SELECT * FROM finish();

ROLLBACK;
