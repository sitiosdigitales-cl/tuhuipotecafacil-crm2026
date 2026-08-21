-- Semilla de las etapas iniciales del pipeline (PIPE-01).
--
-- `pipeline_stages` existia desde el esquema base pero nunca se poblaba, asi
-- que tras un `db reset` quedaba vacia y la API completaba los huecos con un
-- arreglo en memoria del proceso. Eso hacia que editar una etapa predeterminada
-- ejecutara un UPDATE sobre una fila inexistente, que eliminarla la resucitara
-- en el siguiente GET, y que dos instancias serverless vieran cosas distintas.
--
-- Aditiva e idempotente: solo inserta las etapas que faltan por `id` y nunca
-- pisa el nombre, el color ni el estado de una etapa ya personalizada.

DO $$
DECLARE
  semilla RECORD;
  orden_libre INTEGER;
BEGIN
  FOR semilla IN
    SELECT *
    FROM (VALUES
      ('NUEVO_LEAD',             'Nuevo Lead',             '#3B82F6',  1),
      ('CONTACTO_INICIAL',       'Contacto Inicial',       '#6366F1',  2),
      ('CONTACTADO',             'Contactado',             '#8B5CF6',  3),
      ('INTERESADO',             'Interesado',             '#A855F7',  4),
      ('CALIFICACION_COMERCIAL', 'Calificación Comercial', '#D946EF',  5),
      ('DOCS_PENDIENTES',        'Docs. Pendientes',       '#F97316',  6),
      ('DOCS_PARCIALES',         'Docs. Parciales',        '#FB923C',  7),
      ('DOCS_COMPLETAS',         'Docs. Completas',        '#22C55E',  8),
      ('EVALUACION_BANCARIA',    'Evaluación Bancaria',    '#06B6D4',  9),
      ('PREAPROBADO',            'Preaprobado',            '#14B8A6', 10),
      ('APROBADO',               'Aprobado',               '#10B981', 11),
      ('FIRMA_DIGITAL',          'Firma Digital',          '#6366F1', 12),
      ('NOTARIA',                'Notaría',                '#8B5CF6', 13),
      ('CREDITO_PAGADO',         'Crédito Pagado',         '#22C55E', 14),
      ('CLIENTE_FINALIZADO',     'Finalizado',             '#64748B', 15)
    ) AS t(id, nombre, color, orden)
  LOOP
    -- Ya existe: se respeta tal cual, incluidas sus personalizaciones.
    IF EXISTS (SELECT 1 FROM public.pipeline_stages WHERE id = semilla.id) THEN
      CONTINUE;
    END IF;

    -- `pipeline_stages` tiene UNIQUE (orden). Si una etapa personalizada ya
    -- ocupa el orden canonico, la semilla se coloca al final en vez de fallar.
    orden_libre := semilla.orden;
    IF EXISTS (SELECT 1 FROM public.pipeline_stages WHERE orden = orden_libre) THEN
      SELECT COALESCE(MAX(orden), 0) + 1
      INTO orden_libre
      FROM public.pipeline_stages;
    END IF;

    INSERT INTO public.pipeline_stages (id, nombre, color, orden, activa)
    VALUES (semilla.id, semilla.nombre, semilla.color, orden_libre, true);
  END LOOP;
END
$$;
