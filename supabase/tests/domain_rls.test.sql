BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(30);

SELECT is(
  (
    SELECT count(*)::INTEGER
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'documentos', 'tareas', 'comisiones')
  ),
  4,
  'los cuatro dominios tienen una política explícita'
);

SELECT is(
  (
    SELECT count(*)::INTEGER
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'documentos', 'tareas', 'comisiones')
      AND cmd = 'SELECT'
      AND roles = ARRAY['authenticated']::name[]
  ),
  4,
  'todas las políticas son de lectura autenticada'
);

SELECT is(
  (
    SELECT count(*)::INTEGER
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'documentos', 'tareas', 'comisiones')
      AND (qual = 'true' OR with_check = 'true')
  ),
  0,
  'ninguna política concede todas las filas'
);

SELECT ok(
  NOT has_schema_privilege('anon', 'public', 'USAGE'),
  'anon permanece fuera del esquema público'
);

SELECT ok(
  has_schema_privilege('authenticated', 'public', 'USAGE'),
  'authenticated puede resolver las tablas con RLS'
);

SELECT ok(
  NOT has_schema_privilege('anon', 'private', 'USAGE'),
  'anon no puede resolver helpers privados'
);

SELECT ok(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated puede evaluar helpers desde las políticas'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'private.crm_current_user_id()',
    'EXECUTE'
  ),
  'anon no ejecuta el helper de identidad'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'private.crm_current_user_id()',
    'EXECUTE'
  ),
  'authenticated evalúa el helper de identidad'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'private.crm_current_user_role()',
    'EXECUTE'
  ),
  'anon no ejecuta el helper de rol'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'private.crm_current_user_role()',
    'EXECUTE'
  ),
  'authenticated evalúa el helper de rol'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'private.crm_current_user_email()',
    'EXECUTE'
  ),
  'anon no ejecuta el helper de correo'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'private.crm_current_user_email()',
    'EXECUTE'
  ),
  'authenticated evalúa el helper de correo'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.leads', 'SELECT'),
  'authenticated puede consultar leads bajo RLS'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.documentos', 'SELECT'),
  'authenticated puede consultar documentos bajo RLS'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.tareas', 'SELECT'),
  'authenticated puede consultar tareas bajo RLS'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.comisiones', 'SELECT'),
  'authenticated puede consultar comisiones bajo RLS'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.leads', 'SELECT'),
  'anon no consulta leads'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.documentos', 'SELECT'),
  'anon no consulta documentos'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.tareas', 'SELECT'),
  'anon no consulta tareas'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.comisiones', 'SELECT'),
  'anon no consulta comisiones'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,DELETE'),
  'las escrituras de leads permanecen en el servidor'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.documentos', 'INSERT,UPDATE,DELETE'),
  'las escrituras de documentos permanecen en el servidor'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.tareas', 'INSERT,UPDATE,DELETE'),
  'las escrituras de tareas permanecen en el servidor'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.comisiones', 'INSERT,UPDATE,DELETE'),
  'las escrituras de comisiones permanecen en el servidor'
);

SELECT ok(
  has_table_privilege('service_role', 'public.leads', 'SELECT')
    AND has_table_privilege('service_role', 'public.leads', 'INSERT')
    AND has_table_privilege('service_role', 'public.leads', 'UPDATE')
    AND has_table_privilege('service_role', 'public.leads', 'DELETE'),
  'service_role conserva operaciones sobre leads'
);

SELECT ok(
  has_table_privilege('service_role', 'public.documentos', 'SELECT')
    AND has_table_privilege('service_role', 'public.documentos', 'INSERT')
    AND has_table_privilege('service_role', 'public.documentos', 'UPDATE')
    AND has_table_privilege('service_role', 'public.documentos', 'DELETE'),
  'service_role conserva operaciones sobre documentos'
);

SELECT ok(
  has_table_privilege('service_role', 'public.tareas', 'SELECT')
    AND has_table_privilege('service_role', 'public.tareas', 'INSERT')
    AND has_table_privilege('service_role', 'public.tareas', 'UPDATE')
    AND has_table_privilege('service_role', 'public.tareas', 'DELETE'),
  'service_role conserva operaciones sobre tareas'
);

SELECT ok(
  has_table_privilege('service_role', 'public.comisiones', 'SELECT')
    AND has_table_privilege('service_role', 'public.comisiones', 'INSERT')
    AND has_table_privilege('service_role', 'public.comisiones', 'UPDATE')
    AND has_table_privilege('service_role', 'public.comisiones', 'DELETE'),
  'service_role conserva operaciones sobre comisiones'
);

SELECT is(
  (
    SELECT count(*)::INTEGER
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'documentos', 'tareas', 'comisiones')
      AND rowsecurity
  ),
  4,
  'RLS está activo en los cuatro dominios'
);

SELECT * FROM finish();

ROLLBACK;
