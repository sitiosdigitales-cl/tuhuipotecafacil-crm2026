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

En `supabase/config.toml`, `auth.enable_signup` permanece en `false` para cerrar
el registro público, mientras `auth.email.enable_signup` permanece en `true`
para permitir el inicio de sesión de identidades creadas mediante Admin API.

## Vigencia por solicitud

Todos los endpoints protegidos esperan una validación central antes de usar el
rol o el identificador. En `required`, y para una cuenta ya enlazada en
`bridge`, el servidor envía el access token a `auth.getUser`, resuelve la fila
por `auth_user_id` y exige que estado, correo, `crm_user_id` y rol sigan
coincidiendo. `SUPER_ADMIN` y `ADMIN` deben conservar `aal2`. Dos guardias del
mismo request comparten el resultado, pero nunca se reutiliza entre requests.

Durante `bridge`, un JWT legado solo mantiene convivencia si la cuenta todavía
no tiene enlace y no es administrativa. En `legacy` se conserva el contrato
anterior para poder desplegar el código antes de aplicar la migración.

`/api/auth/me` rota los tokens mediante el refresh HttpOnly, vuelve a validar la
cuenta y envía `Cache-Control: no-store`. Puede recuperar una sesión cuyo access
token venció mientras el refresh siga vigente. `/api/auth/logout` revoca solo la
sesión actual y limpia las cuatro cookies incluso si el proveedor no responde.

Supabase no invalida retroactivamente un access JWT ya emitido al cerrar una
sesión; puede seguir verificando hasta su `exp`. El entorno versionado limita ese
margen a 900 segundos y CI comprueba la vigencia real. Replicar `jwt_expiry =
900` en un proyecto alojado es una acción humana de configuración, primero en
staging. Referencias: [validación con `getUser`](https://supabase.com/docs/reference/javascript/auth-getuser),
[cierre y vigencia de access tokens](https://supabase.com/docs/guides/auth/signout).

## Ciclo de cuentas

En `bridge` y `required`, las altas administrativas crean primero la identidad
confirmada de Supabase Auth y después la fila de negocio enlazada. La base deja
`password` en `NULL`; no conserva un hash duplicado. Si la inserción de negocio
falla, el servicio intenta retirar la identidad recién creada.

Los cambios de correo, contraseña y estado se sincronizan con la identidad
enlazada. Ante un rechazo conocido se revierte la actualización de la fila de
negocio y la interfaz muestra un mensaje neutro. Una cuenta legado sin enlace
se migra cuando administración fija una contraseña nueva. Desactivar una cuenta
también suspende su identidad; reactivarla retira esa suspensión.

La eliminación definitiva de una cuenta enlazada permanece bloqueada: la clave
foránea usa `ON DELETE RESTRICT` y borrar dos sistemas no puede hacerse de forma
atómica. Por ahora el procedimiento operativo es desactivar. Un proceso de baja
definitiva necesitará una cola durable y verificación humana antes de habilitar
esa acción en la interfaz.

`scripts/bootstrap-admin.mjs` sigue el modo configurado. En `legacy` renueva el
hash bcrypt; en `bridge` o `required` crea, reconcilia o actualiza la identidad
de Auth, la enlaza con `crm_user_id`, limpia el bloqueo y deja el hash local en
`NULL`. Nunca toma una identidad cuyo `crm_user_id` pertenezca a otra cuenta.

## MFA administrativo

En los modos `bridge` y `required`, `SUPER_ADMIN` y `ADMIN` reciben primero una
sesión temporal de Supabase. El CRM no emite `crm_token` hasta que esa sesión
alcanza `aal2` con un factor TOTP. Las cuentas sin factor pasan por `/mfa` para
escanear el QR; las cuentas enroladas solo ingresan el código de seis dígitos.
Los factores, desafíos y códigos se validan en Supabase Auth; el navegador no
recibe la `service_role` ni los tokens en JSON.

El ensayo de CI crea una identidad sintética, enlaza la cuenta, enrola un TOTP,
genera un código temporal y exige `aal2` antes de limpiar todo. Esto verifica la
configuración local real, además de las pruebas unitarias.

Antes de activar `bridge` en producción, una persona autorizada debe probar en
staging el enrolamiento y documentar la recuperación de un administrador que
perdió su autenticador. El código no realiza cambios en el panel ni desactiva
factores reales automáticamente.

No activar `bridge` todavía en producción: ciclo de cuentas, MFA administrativo
y validación vigente por solicitud ya están preparados, pero aún faltan RLS por
dominio y un ensayo autorizado en staging. El valor por defecto permite
desplegar el código sin consultar una migración aún no aplicada.

La aplicación de la migración, la creación de identidades reales y cualquier
cambio de modo quedan pendientes de staging autorizado.
