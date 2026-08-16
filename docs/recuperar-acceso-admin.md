# Recuperar acceso administrativo

El CRM usa actualmente una tabla `usuarios` con bcrypt y JWT propios; no usa
Supabase Auth para iniciar sesión. El antiguo `prisma/seed-usuarios.sql` no
creaba credenciales utilizables y ya no inserta cuentas.

Este procedimiento requiere una persona autorizada con la service role. Codex
no lo ejecuta ni comprueba el resultado en producción.

## Preparación

1. Confirma que `.env` apunta al proyecto correcto y contiene
   `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
2. Cierra terminales compartidos y evita grabar la sesión.
3. Lee la URL del proyecto antes de confirmar cualquier cambio.

## Ejecución

Desde la raíz del repositorio:

```bash
read -r -p "Email SUPER_ADMIN: " BOOTSTRAP_ADMIN_EMAIL
read -r -p "Nombre: " BOOTSTRAP_ADMIN_NAME
read -r -p "Apellido: " BOOTSTRAP_ADMIN_LAST_NAME
read -r -s -p "Contraseña nueva: " BOOTSTRAP_ADMIN_PASSWORD; echo
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_LAST_NAME BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_CONFIRM=RESET_SUPER_ADMIN node --env-file=.env scripts/bootstrap-admin.mjs
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_LAST_NAME BOOTSTRAP_ADMIN_PASSWORD
```

La contraseña debe tener entre 16 y 128 caracteres, mayúscula, minúscula,
número y símbolo, y no contener la parte local del email. El script crea la
cuenta si no existe; si ya existe, renueva su hash, la activa, la convierte en
`SUPER_ADMIN` y limpia el bloqueo temporal.

## Verificación

1. Inicia sesión desde `/login` en una ventana privada.
2. Confirma que `/usuarios` abre y que el rol visible es `SUPER_ADMIN`.
3. Cierra sesión y vuelve a entrar una vez.
4. Elimina las variables exportadas y cierra la terminal usada.

No pegues la contraseña, la service role ni el JWT en documentos, tickets o
mensajes. Si la service role se expuso, rótala desde Supabase antes de seguir.
