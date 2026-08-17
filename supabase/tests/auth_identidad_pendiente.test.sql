BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(53);

SELECT has_column(
  'public',
  'usuarios',
  'auth_pending_user_id',
  'usuarios registra una identidad pendiente'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'auth_pending_user_id',
  'uuid',
  'la identidad pendiente usa UUID'
);

SELECT has_column(
  'public',
  'usuarios',
  'auth_pending_desde',
  'usuarios registra la antigüedad de la identidad pendiente'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'auth_pending_desde',
  'timestamp with time zone',
  'la antigüedad pendiente conserva zona horaria'
);

SELECT has_column(
  'public',
  'usuarios',
  'auth_pending_turno',
  'usuarios conserva el dueño de la reserva pendiente'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'auth_pending_turno',
  'uuid',
  'la reserva pendiente usa UUID'
);

SELECT has_column(
  'public',
  'usuarios',
  'tiene_password',
  'usuarios expone solo la presencia del hash legado'
);

SELECT col_type_is(
  'public',
  'usuarios',
  'tiene_password',
  'boolean',
  'la presencia del hash es booleana'
);

SELECT is(
  (
    SELECT is_generated
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'tiene_password'
  ),
  'ALWAYS',
  'la presencia del hash se deriva en la base'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.reservar_identidad_pendiente(text,uuid,integer)',
    'EXECUTE'
  ),
  'anon no reserva identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.reservar_identidad_pendiente(text,uuid,integer)',
    'EXECUTE'
  ),
  'authenticated no reserva identidades pendientes'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.reservar_identidad_pendiente(text,uuid,integer)',
    'EXECUTE'
  ),
  'service_role reserva identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.registrar_identidad_pendiente(text,uuid,uuid)',
    'EXECUTE'
  ),
  'anon no registra identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.registrar_identidad_pendiente(text,uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated no registra identidades pendientes'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.registrar_identidad_pendiente(text,uuid,uuid)',
    'EXECUTE'
  ),
  'service_role registra identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.liberar_identidad_pendiente(text,uuid)',
    'EXECUTE'
  ),
  'anon no libera identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.liberar_identidad_pendiente(text,uuid)',
    'EXECUTE'
  ),
  'authenticated no libera identidades pendientes'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.liberar_identidad_pendiente(text,uuid)',
    'EXECUTE'
  ),
  'service_role libera identidades pendientes'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.enlazar_identidad_recuperada(text,uuid)',
    'EXECUTE'
  ),
  'anon no enlaza identidades recuperadas'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.enlazar_identidad_recuperada(text,uuid)',
    'EXECUTE'
  ),
  'authenticated no enlaza identidades recuperadas'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.enlazar_identidad_recuperada(text,uuid)',
    'EXECUTE'
  ),
  'service_role enlaza identidades recuperadas'
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
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pendiente-principal@example.invalid',
    '',
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pendiente-puente@example.invalid',
    '',
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pendiente-limpieza@example.invalid',
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
  estado
)
VALUES
  (
    'usuario-pendiente-principal',
    'Cuenta',
    'Principal',
    'pendiente-principal@example.invalid',
    'hash-legado-principal',
    'EJECUTIVO',
    'ACTIVO'
  ),
  (
    'usuario-pendiente-otra',
    'Cuenta',
    'Otra',
    'pendiente-otra@example.invalid',
    'hash-legado-otra',
    'EJECUTIVO',
    'ACTIVO'
  ),
  (
    'usuario-pendiente-inactiva',
    'Cuenta',
    'Inactiva',
    'pendiente-inactiva@example.invalid',
    'hash-legado-inactivo',
    'EJECUTIVO',
    'INACTIVO'
  ),
  (
    'usuario-pendiente-limpieza',
    'Cuenta',
    'Limpieza',
    'pendiente-limpieza@example.invalid',
    'hash-legado-limpieza',
    'EJECUTIVO',
    'ACTIVO'
  ),
  (
    'usuario-pendiente-puente',
    'Cuenta',
    'Puente',
    'pendiente-puente@example.invalid',
    'hash-legado-puente',
    'EJECUTIVO',
    'ACTIVO'
  );

SELECT is(
  (
    SELECT tiene_password
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  true,
  'la columna generada refleja que el hash existe sin exponerlo'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000001',
    900
  ),
  true,
  'la primera solicitud reserva la creación pendiente'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000002',
    900
  ),
  false,
  'una solicitud simultánea no reemplaza la reserva vigente'
);

SELECT is(
  (
    SELECT auth_pending_turno
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  '60000000-0000-4000-8000-000000000001'::UUID,
  'la reserva conserva el turno ganador antes de crear Auth'
);

SELECT is(
  public.registrar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000009',
    '50000000-0000-4000-8000-000000000001'
  ),
  false,
  'un turno ajeno no registra la identidad creada'
);

SELECT is(
  public.registrar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001'
  ),
  true,
  'el dueño de la reserva registra la identidad pendiente'
);

SELECT ok(
  (
    SELECT
      password IS NOT NULL
      AND auth_user_id IS NULL
      AND auth_pending_user_id =
        '50000000-0000-4000-8000-000000000001'::UUID
      AND auth_pending_desde IS NOT NULL
      AND auth_pending_turno =
        '60000000-0000-4000-8000-000000000001'::UUID
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  'el estado pendiente conserva el hash y no enlaza la sesión CRM'
);

SELECT throws_ok(
  $$
    UPDATE public.usuarios
    SET
      auth_pending_user_id =
        '50000000-0000-4000-8000-000000000001'::UUID,
      auth_pending_desde = clock_timestamp(),
      auth_pending_turno =
        '60000000-0000-4000-8000-000000000003'::UUID
    WHERE id = 'usuario-pendiente-otra'
  $$,
  '23505',
  NULL,
  'una identidad pendiente no se comparte entre cuentas'
);

SELECT is(
  public.liberar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000009'
  ),
  NULL::UUID,
  'un turno ajeno no libera la identidad pendiente'
);

SELECT is(
  (
    SELECT auth_pending_user_id
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  '50000000-0000-4000-8000-000000000001'::UUID,
  'la liberación ajena conserva la identidad pendiente'
);

SELECT is(
  public.liberar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000001'
  ),
  '50000000-0000-4000-8000-000000000001'::UUID,
  'el dueño recupera el UUID que debe retirar de Auth'
);

SELECT ok(
  (
    SELECT
      auth_pending_user_id IS NULL
      AND auth_pending_desde IS NULL
      AND auth_pending_turno IS NULL
      AND password IS NOT NULL
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  'liberar vuelve a LEGADA sin retirar el hash'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000004',
    900
  ),
  true,
  'la cuenta liberada puede reservar de nuevo'
);

SELECT is(
  public.registrar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000001'
  ),
  true,
  'el reintento vuelve a registrar la misma identidad'
);

SELECT is(
  public.enlazar_identidad_recuperada(
    'usuario-pendiente-principal',
    '50000000-0000-4000-8000-000000000009'
  ),
  false,
  'una identidad distinta no retira el hash legado'
);

SELECT is(
  public.enlazar_identidad_recuperada(
    'usuario-pendiente-principal',
    '50000000-0000-4000-8000-000000000001'
  ),
  true,
  'la identidad pendiente correcta completa el enlace'
);

SELECT ok(
  (
    SELECT
      auth_user_id = '50000000-0000-4000-8000-000000000001'::UUID
      AND auth_migrated_at IS NOT NULL
      AND password IS NULL
      AND tiene_password = false
      AND auth_pending_user_id IS NULL
      AND auth_pending_desde IS NULL
      AND auth_pending_turno IS NULL
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-principal'
  ),
  'el enlace y el retiro del hash ocurren en el mismo estado final'
);

SELECT is(
  public.enlazar_identidad_recuperada(
    'usuario-pendiente-principal',
    '50000000-0000-4000-8000-000000000001'
  ),
  true,
  'repetir el enlace ya completado es idempotente'
);

SELECT throws_ok(
  $$
    UPDATE public.usuarios
    SET
      auth_pending_user_id =
        '50000000-0000-4000-8000-000000000001'::UUID,
      auth_pending_desde = clock_timestamp(),
      auth_pending_turno =
        '60000000-0000-4000-8000-000000000005'::UUID
    WHERE id = 'usuario-pendiente-principal'
  $$,
  '23514',
  NULL,
  'una cuenta enlazada no puede quedar también pendiente'
);

SELECT throws_ok(
  $$
    UPDATE public.usuarios
    SET
      auth_pending_user_id =
        '50000000-0000-4000-8000-000000000002'::UUID,
      auth_pending_desde = NULL,
      auth_pending_turno =
        '60000000-0000-4000-8000-000000000006'::UUID
    WHERE id = 'usuario-pendiente-otra'
  $$,
  '23514',
  NULL,
  'una identidad registrada exige fecha de reserva'
);

SELECT throws_ok(
  $$
    UPDATE public.usuarios
    SET
      auth_pending_user_id =
        '50000000-0000-4000-8000-000000000002'::UUID,
      auth_pending_desde = clock_timestamp(),
      auth_pending_turno = NULL
    WHERE id = 'usuario-pendiente-otra'
  $$,
  '23514',
  NULL,
  'una identidad registrada exige conservar el turno'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-inactiva',
    '60000000-0000-4000-8000-000000000007',
    900
  ),
  false,
  'una cuenta inactiva no reserva una identidad'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-principal',
    '60000000-0000-4000-8000-000000000008',
    900
  ),
  false,
  'una cuenta ya enlazada no vuelve al estado pendiente'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-limpieza',
    '60000000-0000-4000-8000-000000000010',
    900
  ),
  true,
  'la cuenta de limpieza reserva su identidad'
);

SELECT is(
  public.registrar_identidad_pendiente(
    'usuario-pendiente-limpieza',
    '60000000-0000-4000-8000-000000000010',
    '50000000-0000-4000-8000-000000000003'
  ),
  true,
  'la cuenta de limpieza registra su identidad'
);

SELECT lives_ok(
  $$
    DELETE FROM auth.users
    WHERE id = '50000000-0000-4000-8000-000000000003'
  $$,
  'la limpieza operativa puede borrar una identidad pendiente'
);

SELECT ok(
  (
    SELECT
      auth_pending_user_id IS NULL
      AND auth_pending_desde IS NULL
      AND auth_pending_turno IS NULL
      AND password IS NOT NULL
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-limpieza'
  ),
  'borrar Auth limpia todo el estado pendiente y conserva el hash'
);

SELECT is(
  public.reservar_identidad_pendiente(
    'usuario-pendiente-puente',
    '60000000-0000-4000-8000-000000000011',
    900
  ),
  true,
  'el caso puente reserva la identidad pendiente'
);

SELECT is(
  public.registrar_identidad_pendiente(
    'usuario-pendiente-puente',
    '60000000-0000-4000-8000-000000000011',
    '50000000-0000-4000-8000-000000000002'
  ),
  true,
  'el caso puente registra la identidad pendiente'
);

SELECT is(
  public.reclamar_migracion_auth(
    'usuario-pendiente-puente',
    '70000000-0000-4000-8000-000000000001'
  ),
  true,
  'el login de puente conserva un claim independiente'
);

SELECT lives_ok(
  $$
    SELECT public.completar_migracion_auth(
      'usuario-pendiente-puente',
      '70000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000002'
    )
  $$,
  'el puente adopta la identidad pendiente de la misma cuenta'
);

SELECT ok(
  (
    SELECT
      auth_user_id = '50000000-0000-4000-8000-000000000002'::UUID
      AND password IS NULL
      AND auth_pending_user_id IS NULL
      AND auth_pending_desde IS NULL
      AND auth_pending_turno IS NULL
      AND auth_migration_token IS NULL
      AND auth_migration_started_at IS NULL
    FROM public.usuarios
    WHERE id = 'usuario-pendiente-puente'
  ),
  'el puente enlaza y limpia ambos claims de forma atómica'
);

SELECT * FROM finish();

ROLLBACK;
