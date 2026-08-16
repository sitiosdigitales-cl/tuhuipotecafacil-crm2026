CREATE OR REPLACE FUNCTION public.registrar_intento_login_fallido(
  p_usuario_id TEXT
)
RETURNS TABLE (
  intentosfallidos INTEGER,
  suspendidohasta TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  ahora TIMESTAMPTZ := statement_timestamp();
BEGIN
  RETURN QUERY
  WITH estado_actual AS MATERIALIZED (
    SELECT
      usuario.id,
      CASE
        WHEN usuario.suspendidohasta IS NOT NULL
          AND usuario.suspendidohasta <= ahora
          THEN 1
        ELSE COALESCE(usuario.intentosfallidos, 0) + 1
      END AS siguiente_intento
    FROM public.usuarios AS usuario
    WHERE usuario.id = p_usuario_id
    FOR UPDATE
  ), actualizado AS (
    UPDATE public.usuarios AS usuario
    SET
      intentosfallidos = estado_actual.siguiente_intento,
      suspendidohasta = CASE
        WHEN estado_actual.siguiente_intento >= 5
          THEN ahora + INTERVAL '15 minutes'
        ELSE NULL
      END
    FROM estado_actual
    WHERE usuario.id = estado_actual.id
    RETURNING
      usuario.intentosfallidos AS intentos_actualizados,
      usuario.suspendidohasta AS bloqueo_actualizado
  )
  SELECT
    actualizado.intentos_actualizados,
    actualizado.bloqueo_actualizado
  FROM actualizado;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_intento_login_fallido(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_intento_login_fallido(TEXT)
  TO service_role;
