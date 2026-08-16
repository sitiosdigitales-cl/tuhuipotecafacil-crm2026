-- Reintento seguro cuando la entrega del correo falla.
--
-- Hasta acá, reclamar el turno consumía la ventana de espera aunque Resend
-- rechazara el envío: quien no recibía nada quedaba quince minutos sin poder
-- reintentar, y como la respuesta es neutra tampoco se enteraba de por qué.
--
-- Liberar el turno con un simple UPDATE a NULL no sirve: si la petición que
-- falló tarda más que la ventana, para cuando libere ya puede haber otra
-- solicitud con su propio turno vigente, y le borraría el suyo. Por eso el
-- turno lleva identificador y solo lo libera quien lo tomó.

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS recuperacion_turno UUID;

-- La firma cambia, así que la anterior se retira en vez de quedar como
-- sobrecarga: dos funciones con el mismo nombre y distinta aridad son dos
-- caminos vivos, y uno de ellos no marcaría el turno.
DROP FUNCTION IF EXISTS public.reclamar_recuperacion_password(TEXT, INTEGER);

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
    AND auth_user_id IS NOT NULL
    AND (
      recuperacion_enviada_en IS NULL
      OR recuperacion_enviada_en
         < clock_timestamp() - make_interval(secs => p_espera_segundos)
    )
  RETURNING true INTO reclamada;

  RETURN COALESCE(reclamada, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.liberar_recuperacion_password(
  p_usuario_id TEXT,
  p_turno UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  liberada BOOLEAN := false;
BEGIN
  -- La comparación del turno es la garantía: si otra solicitud ya reclamó, el
  -- identificador no coincide y esta liberación no toca nada.
  UPDATE public.usuarios
  SET
    recuperacion_enviada_en = NULL,
    recuperacion_turno = NULL
  WHERE id = p_usuario_id
    AND p_turno IS NOT NULL
    AND recuperacion_turno = p_turno
  RETURNING true INTO liberada;

  RETURN COALESCE(liberada, false);
END;
$$;

REVOKE ALL ON FUNCTION public.reclamar_recuperacion_password(TEXT, INTEGER, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_recuperacion_password(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reclamar_recuperacion_password(TEXT, INTEGER, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_recuperacion_password(TEXT, UUID)
  TO service_role;
