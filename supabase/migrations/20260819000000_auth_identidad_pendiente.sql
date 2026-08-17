-- Identidad pendiente para recuperar cuentas legadas (BUG-137).
--
-- Una cuenta activa con hash heredado y sin `auth_user_id` no podia recuperarse
-- en modo `required`: el login la mandaba a recuperacion y recuperacion no podia
-- emitir enlace porque todavia no existia identidad en Supabase Auth.
--
-- El ciclo pasa a ser LEGADA -> RESERVADA -> PENDIENTE -> ENLAZADA. El hash
-- heredado sobrevive intacto hasta el enlace final, que es la unica operacion
-- autorizada a retirarlo, y una identidad pendiente nunca resuelve sesion CRM
-- porque `usuarios.auth_user_id` sigue nulo mientras dure.

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_pending_user_id UUID,
  ADD COLUMN IF NOT EXISTS auth_pending_desde TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_pending_turno UUID;

-- Derivada y almacenada: la solicitud necesita saber SI hay hash, nunca cual.
-- Sin esto habria que traer la columna `password` a memoria para decidir.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS tiene_password BOOLEAN GENERATED ALWAYS AS (password IS NOT NULL) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_pending_user_id_unique
  ON public.usuarios (auth_pending_user_id)
  WHERE auth_pending_user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_pending_user_id_fkey'
  ) THEN
    -- `SET NULL` deja de referenciar una identidad borrada. La limpieza del
    -- resto del estado pendiente la hace el disparador de mas abajo, porque una
    -- clave foranea solo puede tocar su propia columna.
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_pending_user_id_fkey
      FOREIGN KEY (auth_pending_user_id)
      REFERENCES auth.users (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_pending_exclusivo_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_pending_exclusivo_check
      CHECK (auth_pending_user_id IS NULL OR auth_user_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_pending_reserva_check'
  ) THEN
    -- El turno y su fecha aparecen y desaparecen juntos. Deja valido el estado
    -- RESERVADA, que tiene turno y fecha pero todavia no identidad.
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_pending_reserva_check
      CHECK ((auth_pending_turno IS NULL) = (auth_pending_desde IS NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_pending_registro_check'
  ) THEN
    -- Una identidad registrada sin reserva seria un estado sin dueno: nadie
    -- podria liberarla ni saber desde cuando existe.
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_pending_registro_check
      CHECK (auth_pending_user_id IS NULL OR auth_pending_turno IS NOT NULL);
  END IF;
END
$$;

-- Borrar la identidad en Auth debe devolver la cuenta a LEGADA completa. La
-- clave foranea solo anula el UUID y dejaria la fecha y el turno huerfanos, que
-- ademas bloquearian la siguiente reserva.
CREATE OR REPLACE FUNCTION public.limpiar_identidad_pendiente_borrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.usuarios
  SET
    auth_pending_user_id = NULL,
    auth_pending_desde = NULL,
    auth_pending_turno = NULL
  WHERE auth_pending_user_id = OLD.id;

  RETURN OLD;
END;
$$;

-- BEFORE: corre antes de que la clave foranea anule la columna por su cuenta,
-- para que el UPDATE todavia encuentre la fila por `auth_pending_user_id`.
DROP TRIGGER IF EXISTS limpiar_identidad_pendiente ON auth.users;
CREATE TRIGGER limpiar_identidad_pendiente
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.limpiar_identidad_pendiente_borrada();

-- Reserva el derecho a crear la identidad. Comprueba y marca en la misma
-- sentencia: dos solicitudes simultaneas no pueden crear dos identidades.
CREATE OR REPLACE FUNCTION public.reservar_identidad_pendiente(
  p_usuario_id TEXT,
  p_turno UUID,
  p_ventana_segundos INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reservada BOOLEAN := false;
BEGIN
  IF p_turno IS NULL THEN
    RAISE EXCEPTION 'El turno de identidad pendiente es obligatorio'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_ventana_segundos IS NULL OR p_ventana_segundos < 0 THEN
    RAISE EXCEPTION 'La ventana de identidad pendiente no puede ser negativa'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.usuarios
  SET
    auth_pending_turno = p_turno,
    auth_pending_desde = clock_timestamp()
  WHERE id = p_usuario_id
    AND estado = 'ACTIVO'
    AND auth_user_id IS NULL
    AND password IS NOT NULL
    AND (
      auth_pending_turno IS NULL
      OR auth_pending_desde
         < clock_timestamp() - make_interval(secs => p_ventana_segundos)
    )
  RETURNING true INTO reservada;

  RETURN COALESCE(reservada, false);
END;
$$;

-- Registra la identidad creada en Auth. Solo el dueno de la reserva vigente.
CREATE OR REPLACE FUNCTION public.registrar_identidad_pendiente(
  p_usuario_id TEXT,
  p_turno UUID,
  p_auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  registrada BOOLEAN := false;
BEGIN
  UPDATE public.usuarios
  SET auth_pending_user_id = p_auth_user_id
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND auth_pending_turno = p_turno
  RETURNING true INTO registrada;

  RETURN COALESCE(registrada, false);
END;
$$;

-- Suelta la reserva y devuelve el UUID que la aplicacion debe retirar de Auth.
-- Comparar el turno es lo que impide que una liberacion tardia pise la reserva
-- de otra solicitud.
CREATE OR REPLACE FUNCTION public.liberar_identidad_pendiente(
  p_usuario_id TEXT,
  p_turno UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  liberada UUID;
BEGIN
  SELECT auth_pending_user_id
  INTO liberada
  FROM public.usuarios
  WHERE id = p_usuario_id
    AND auth_pending_turno = p_turno
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.usuarios
  SET
    auth_pending_user_id = NULL,
    auth_pending_desde = NULL,
    auth_pending_turno = NULL
  WHERE id = p_usuario_id;

  RETURN liberada;
END;
$$;

-- El enlace atomico. Unico lugar del esquema autorizado a retirar el hash
-- heredado, y lo hace en la misma sentencia que fija la identidad, de modo que
-- `usuarios_password_or_auth_check` nunca ve un estado intermedio.
CREATE OR REPLACE FUNCTION public.enlazar_identidad_recuperada(
  p_usuario_id TEXT,
  p_auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  enlazada BOOLEAN := false;
  ya_enlazada BOOLEAN := false;
BEGIN
  UPDATE public.usuarios
  SET
    auth_user_id = p_auth_user_id,
    auth_migrated_at = clock_timestamp(),
    password = NULL,
    auth_pending_user_id = NULL,
    auth_pending_desde = NULL,
    auth_pending_turno = NULL
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND auth_pending_user_id = p_auth_user_id
  RETURNING true INTO enlazada;

  IF COALESCE(enlazada, false) THEN
    RETURN true;
  END IF;

  -- Idempotencia: un reintento tras un fallo posterior al enlace tiene que
  -- poder terminar en verde en vez de dejar la cuenta a medio camino.
  SELECT true
  INTO ya_enlazada
  FROM public.usuarios
  WHERE id = p_usuario_id
    AND auth_user_id = p_auth_user_id;

  RETURN COALESCE(ya_enlazada, false);
END;
$$;

-- El puente tiene que poder adoptar la identidad pendiente de la misma cuenta.
-- Sin limpiar los tres campos aqui, fijar `auth_user_id` violaria la exclusion.
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
    auth_migration_started_at = NULL,
    auth_pending_user_id = NULL,
    auth_pending_desde = NULL,
    auth_pending_turno = NULL
  WHERE id = p_usuario_id
    AND auth_user_id IS NULL
    AND auth_migration_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La migración de identidad no conserva el claim'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- Abre el turno de envio a las cuentas legadas. Antes exigia identidad ya
-- enlazada, que era la segunda compuerta que dejaba fuera a BUG-137.
CREATE OR REPLACE FUNCTION public.reclamar_recuperacion_password(
  p_usuario_id TEXT,
  p_espera_segundos INTEGER,
  p_turno UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reclamada BOOLEAN := false;
BEGIN
  IF p_espera_segundos IS NULL OR p_espera_segundos < 0 THEN
    RAISE EXCEPTION 'La espera de recuperación no puede ser negativa'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_turno IS NULL THEN
    RAISE EXCEPTION 'El turno de recuperación es obligatorio'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.usuarios
  SET
    recuperacion_enviada_en = clock_timestamp(),
    recuperacion_turno = p_turno
  WHERE id = p_usuario_id
    AND estado = 'ACTIVO'
    AND (auth_user_id IS NOT NULL OR password IS NOT NULL)
    AND (
      recuperacion_enviada_en IS NULL
      OR recuperacion_enviada_en
         < clock_timestamp() - make_interval(secs => p_espera_segundos)
    )
  RETURNING true INTO reclamada;

  RETURN COALESCE(reclamada, false);
END;
$$;

REVOKE ALL ON FUNCTION public.reservar_identidad_pendiente(TEXT, UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registrar_identidad_pendiente(TEXT, UUID, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_identidad_pendiente(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enlazar_identidad_recuperada(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reservar_identidad_pendiente(TEXT, UUID, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_identidad_pendiente(TEXT, UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_identidad_pendiente(TEXT, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.enlazar_identidad_recuperada(TEXT, UUID)
  TO service_role;
