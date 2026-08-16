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

La aplicación de la migración, la creación de identidades reales y cualquier
cambio de modo quedan pendientes de staging autorizado.
