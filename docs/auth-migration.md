# Migración gradual a Supabase Auth

La migración `20260816110000_auth_identity_bridge.sql` prepara el enlace entre
el identificador `TEXT` de negocio y `auth.users.id UUID`. No crea cuentas, no
lee contraseñas y no cambia por sí sola el comportamiento del login.

## Contrato preparado

- `usuarios.auth_user_id` es único y referencia una identidad existente.
- `password` puede quedar vacío únicamente después de enlazar Auth.
- un claim con vencimiento de diez minutos serializa la creación just-in-time;
- completar el claim enlaza la identidad, registra la fecha y retira el hash;
- solo `service_role` ejecuta las tres funciones del puente.

## Orden de despliegue

1. Confirmar respaldo restaurable y deriva de esquema resuelta.
2. Aplicar la migración en staging.
3. Ejecutar `npm run db:test` y comprobar los grants directamente.
4. Desplegar el código del puente todavía en modo legado.
5. Activar el modo de convivencia únicamente con variables autorizadas.
6. Medir cuentas migradas, fallos y recuperación durante 30 días.
7. Pasar a modo obligatorio y retirar los hashes restantes mediante un proceso
   humano revisado; nunca con una actualización masiva sin recuperación.

## Modos del login

- Sin `SUPABASE_AUTH_MODE`, el valor efectivo es `legacy`: no se consultan las
  columnas nuevas ni Supabase Auth.
- `bridge` autentica primero el hash existente, reclama la fila, crea o
  reconcilia Auth, valida la sesión y solo entonces retira el hash. Exige
  `SUPABASE_AUTH_BRIDGE_DEADLINE` como fecha ISO futura.
- `required` acepta únicamente cuentas ya enlazadas. Una cuenta pendiente recibe
  un código de recuperación y nunca vuelve automáticamente al hash.

Los modos `bridge` y `required` requieren `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el
servidor. Los access y refresh tokens quedan exclusivamente en cookies HttpOnly;
la respuesta JSON conserva solo el perfil permitido. El refresh token vence en
el navegador a los siete días y la sesión propia del CRM mantiene su máximo de
treinta minutos durante la convivencia.

No activar `bridge` todavía en producción: antes deben quedar listos el ciclo
de altas/cambios de contraseña, MFA administrativo y la validación vigente de
sesión. El valor por defecto permite desplegar el código sin consultar una
migración aún no aplicada.

La aplicación de la migración, la creación de identidades reales y cualquier
cambio de modo quedan pendientes de staging autorizado.
