# Tasas bancarias administradas manualmente

El CRM no consulta ni presenta tasas de la CMF. Las tasas específicas de cada
banco se cargan manualmente porque provienen de condiciones comerciales que el
equipo debe confirmar con su contraparte.

## Flujo

1. Un `EJECUTIVO`, `ADMIN` o `SUPER_ADMIN` abre `/bancos`.
2. Selecciona el banco y usa **Actualizar tasas**.
3. Registra tasa base, tasa preferencial y CAE como porcentajes.
4. El servidor valida valores entre 0 y 100, actualiza `updated_at` y escribe un
   evento `ACTUALIZAR_TASAS` en auditoría.
5. Los simuladores interno y público consumen únicamente bancos activos cuya
   tasa base sea mayor que cero.

## Reglas operativas

- Son valores referenciales, no una oferta, aprobación ni cotización vinculante.
- La persona que actualiza debe confirmar fuente, vigencia y condiciones fuera
  del CRM; no copiar documentos con datos de clientes.
- Una tasa vencida se corrige o se deja en cero para retirarla del simulador.
- Comparar al menos una vez por semana `actualizadoEn` con la fuente comercial.
- El catálogo público expone solo banco, color, tasa base, CAE y fecha; nunca
  contactos, convenios, requisitos internos ni datos de clientes.
- `/api/cmf/*` permanece cerrado y responde sin datos oficiales.

## Verificación sintética

1. Crear o usar un banco sintético en staging.
2. Actualizar sus tres tasas con una cuenta `EJECUTIVO`.
3. Confirmar el cambio en `/bancos`, `/simulador` y `/simulador-publico`.
4. Confirmar el evento de auditoría y la fecha de actualización.
5. Poner la tasa base en cero y comprobar que desaparece de ambos simuladores.
