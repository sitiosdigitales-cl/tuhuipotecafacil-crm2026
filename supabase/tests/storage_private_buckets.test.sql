BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(5);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'crm_private_buckets_server_only'
  ),
  'existe la política de buckets privados del CRM'
);

SELECT ok(
  (
    SELECT NOT polpermissive
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'crm_private_buckets_server_only'
  ),
  'la política es restrictiva'
);

SELECT ok(
  (
    SELECT
      (SELECT oid FROM pg_roles WHERE rolname = 'anon') = ANY (polroles)
      AND (SELECT oid FROM pg_roles WHERE rolname = 'authenticated') = ANY (polroles)
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'crm_private_buckets_server_only'
  ),
  'la política alcanza ambos roles públicos'
);

SELECT matches(
  (
    SELECT pg_get_expr(polqual, polrelid)
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'crm_private_buckets_server_only'
  ),
  'documentos.*backups',
  'la lectura excluye ambos buckets privados'
);

SELECT matches(
  (
    SELECT pg_get_expr(polwithcheck, polrelid)
    FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'crm_private_buckets_server_only'
  ),
  'documentos.*backups',
  'la escritura excluye ambos buckets privados'
);

SELECT * FROM finish();

ROLLBACK;
