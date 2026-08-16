ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id UUID,
  ADD COLUMN IF NOT EXISTS auth_migrated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_migration_token UUID,
  ADD COLUMN IF NOT EXISTS auth_migration_started_at TIMESTAMPTZ;

ALTER TABLE public.usuarios
  ALTER COLUMN password DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_user_id_unique
  ON public.usuarios (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_user_id_fkey
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users (id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_password_or_auth_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_password_or_auth_check
      CHECK (password IS NOT NULL OR auth_user_id IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_migration_claim_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_migration_claim_check
      CHECK (
        (auth_migration_token IS NULL) =
        (auth_migration_started_at IS NULL)
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.reclamar_migracion_auth(
  p_usuario_id TEXT,
  p_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reclamada BOOLEAN := false;
BEGIN
  UPDATE public.usuarios
  SET
    auth_migration_token = p_token,
    auth_migration_started_at = clock_timestamp()
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND (
      auth_migration_token IS NULL
      OR auth_migration_started_at < clock_timestamp() - INTERVAL '10 minutes'
    )
  RETURNING true INTO reclamada;

  RETURN COALESCE(reclamada, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.completar_migracion_auth(
  p_usuario_id TEXT,
  p_token UUID,
  p_auth_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  UPDATE public.usuarios
  SET
    auth_user_id = p_auth_user_id,
    auth_migrated_at = clock_timestamp(),
    password = NULL,
    auth_migration_token = NULL,
    auth_migration_started_at = NULL
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND auth_migration_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La migración de identidad no conserva el claim'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.liberar_migracion_auth(
  p_usuario_id TEXT,
  p_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  liberada BOOLEAN := false;
BEGIN
  UPDATE public.usuarios
  SET
    auth_migration_token = NULL,
    auth_migration_started_at = NULL
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND auth_migration_token = p_token
  RETURNING true INTO liberada;

  RETURN COALESCE(liberada, false);
END;
$$;

REVOKE ALL ON FUNCTION public.reclamar_migracion_auth(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.completar_migracion_auth(TEXT, UUID, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_migracion_auth(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reclamar_migracion_auth(TEXT, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.completar_migracion_auth(TEXT, UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_migracion_auth(TEXT, UUID)
  TO service_role;
