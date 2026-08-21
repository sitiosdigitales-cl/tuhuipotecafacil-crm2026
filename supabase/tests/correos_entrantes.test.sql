BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(18);

SELECT has_table('public', 'correos_entrantes', 'existe la tabla de idempotencia');
SELECT has_column('public', 'correos_entrantes', 'mensaje_hash', 'conserva el hash');
SELECT has_column('public', 'correos_entrantes', 'estado', 'conserva el estado');
SELECT has_column('public', 'correos_entrantes', 'lead_id', 'referencia el lead');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.correos_entrantes'::regclass),
  'RLS está habilitado'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.correos_entrantes', 'SELECT'),
  'anon no puede leer hashes'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.correos_entrantes', 'SELECT'),
  'authenticated no puede leer hashes'
);

SELECT function_privs_are(
  'public', 'reclamar_correo_entrante', ARRAY['text', 'integer'],
  'service_role', ARRAY['EXECUTE'], 'service_role puede reclamar'
);
SELECT function_privs_are(
  'public', 'completar_correo_entrante', ARRAY['text', 'text'],
  'service_role', ARRAY['EXECUTE'], 'service_role puede completar'
);
SELECT function_privs_are(
  'public', 'liberar_correo_entrante', ARRAY['text'],
  'service_role', ARRAY['EXECUTE'], 'service_role puede liberar'
);
SELECT function_privs_are(
  'public', 'reclamar_correo_entrante', ARRAY['text', 'integer'],
  'anon', ARRAY[]::text[], 'anon no puede reclamar'
);

SELECT throws_ok(
  $$SELECT public.reclamar_correo_entrante('invalido', 900)$$,
  'P0001', 'El hash del correo no es válido',
  'rechaza hashes que no sean SHA-256 hexadecimal'
);
SELECT throws_ok(
  $$SELECT public.reclamar_correo_entrante(repeat('a', 64), -1)$$,
  'P0001', 'La ventana del correo no puede ser negativa',
  'rechaza ventanas negativas'
);

SELECT is(
  public.reclamar_correo_entrante(repeat('a', 64), 900), true,
  'la primera entrega obtiene la reserva'
);
SELECT is(
  public.reclamar_correo_entrante(repeat('a', 64), 900), false,
  'una entrega repetida no obtiene otra reserva'
);

INSERT INTO public.leads (id, nombre, apellido, rut)
VALUES ('lead-correo-pgtap', 'Caso', 'Sintetico', 'email-pgtap');

SELECT is(
  public.completar_correo_entrante(repeat('a', 64), 'lead-correo-pgtap'), true,
  'la reserva se completa con el lead'
);
SELECT is(
  public.reclamar_correo_entrante(repeat('a', 64), 0), false,
  'un correo completado nunca vuelve a reclamarse'
);

SELECT is(
  public.reclamar_correo_entrante(repeat('b', 64), 900)
  AND public.liberar_correo_entrante(repeat('b', 64)),
  true,
  'un fallo libera una reserva sin lead'
);

SELECT * FROM finish();

ROLLBACK;

