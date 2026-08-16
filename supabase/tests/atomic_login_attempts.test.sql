BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(8);

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
  'usuario-login-atomico',
  'Cuenta',
  'Sintetica',
  'login-atomico@example.invalid',
  'hash-sintetico-no-utilizable',
  'EJECUTIVO',
  'ACTIVO'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.registrar_intento_login_fallido(text)',
    'EXECUTE'
  ),
  'anon no ejecuta el contador'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.registrar_intento_login_fallido(text)',
    'EXECUTE'
  ),
  'authenticated no ejecuta el contador'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.registrar_intento_login_fallido(text)',
    'EXECUTE'
  ),
  'service_role ejecuta el contador'
);

SELECT is(
  (
    SELECT intentosfallidos
    FROM public.registrar_intento_login_fallido('usuario-login-atomico')
  ),
  1,
  'el primer intento queda registrado'
);

DO $$
BEGIN
  PERFORM public.registrar_intento_login_fallido('usuario-login-atomico');
  PERFORM public.registrar_intento_login_fallido('usuario-login-atomico');
  PERFORM public.registrar_intento_login_fallido('usuario-login-atomico');
END;
$$;

SELECT is(
  (
    SELECT intentosfallidos
    FROM public.registrar_intento_login_fallido('usuario-login-atomico')
  ),
  5,
  'el quinto intento alcanza el límite'
);

SELECT ok(
  (SELECT suspendidohasta > now() FROM public.usuarios WHERE id = 'usuario-login-atomico'),
  'el límite establece un bloqueo futuro'
);

UPDATE public.usuarios
SET suspendidohasta = now() - INTERVAL '1 second'
WHERE id = 'usuario-login-atomico';

SELECT is(
  (
    SELECT intentosfallidos
    FROM public.registrar_intento_login_fallido('usuario-login-atomico')
  ),
  1,
  'un bloqueo vencido reinicia el contador'
);

SELECT is(
  (SELECT suspendidohasta FROM public.usuarios WHERE id = 'usuario-login-atomico'),
  NULL::TIMESTAMPTZ,
  'el reinicio limpia el bloqueo vencido'
);

SELECT * FROM finish();

ROLLBACK;
