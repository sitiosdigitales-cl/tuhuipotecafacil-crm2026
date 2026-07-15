# Configurar DNS en Nic.cl - Paso a Paso

## Paso 1: Crear cuenta en Resend

1. Ve a https://resend.com
2. Haz clic en **Sign Up**
3. Crea tu cuenta (puedes usar GitHub o email)
4. Una vez dentro, ve a **Domains** en el menú lateral
5. Haz clic en **Add Domain**
6. Escribe: `tuhipotecafacil.cl`
7. Haz clic en **Add**

**IMPORTANTE**: Resend te mostrará los registros DNS que necesitas. **NO cierres esa página**.

---

## Paso 2: Acceder a Nic.cl

1. Ve a https://www.nic.cl
2. Haz clic en **Iniciar Sesión** (arriba a la derecha)
3. Ingresa con tu usuario y contraseña
4. Una vez dentro, ve a **Mis Dominios**
5. Haz clic en `tuhipotecafacil.cl`
6. Haz clic en **Administrar DNS** o **DNS Zone**

---

## Paso 3: Crear registros DNS

En la página de DNS de Nic.cl, verás un formulario para agregar registros. Ve creando uno por uno:

### Registro 1: SPF

Haz clic en **Agregar Registro** y completa:

```
Tipo: TXT
Nombre: @ (o déjalo vacío si no hay campo de nombre)
Valor: v=spf1 include:send.resend.com ~all
TTL: 3600 (o el valor por defecto)
```

Haz clic en **Guardar** o **Agregar**.

### Registro 2: DKIM

Haz clic en **Agregar Registro** y completa:

```
Tipo: CNAME
Nombre: resend._domainkey
Valor: [COPA EL VALOR QUE TE DIO RESEND - empieza con resend._domainkey.]
TTL: 3600
```

**NOTA**: El valor del DKIM lo copias directamente de la página de Resend. Normalmente se ve algo como:
```
resend._domainkey.dcoyjvbhrkarrmetrhiv._domainkey.resend.com
```

### Registro 3: Verificación

Haz clic en **Agregar Registro** y completa:

```
Tipo: TXT
Nombre: [COPA EL NOMBRE QUE TE DIO RESEND - normalmente es algo como "resend-verification"]
Valor: [COPA EL VALOR QUE TE DIO RESEND]
TTL: 3600
```

### Registro 4: DMARC

Haz clic en **Agregar Registro** y completa:

```
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@tuhipotecafacil.cl
TTL: 3600
```

---

## Paso 4: Verificar en Resend

1. Vuelve a la página de Resend (la que no cerraste)
2. Haz clic en **Verify DNS** o **Check DNS**
3. Espera 5-30 minutos
4. Los registros deberían aparecer en verde

**Si aparece en amarillo o rojo**:
- Verifica que copiaste bien los valores
- Espera más tiempo (hasta 24 horas en casos raros)
- Asegúrate de que no haya errores de tipeo

---

## Paso 5: Crear API Key en Resend

1. En Resend, ve a **API Keys** (menú lateral)
2. Haz clic en **Create API Key**
3. Nombre: `CRM TuHipotecaFacil`
4. Haz clic en **Add**
5. **Copia la clave** (empieza con `re_`) - **Solo se muestra una vez**

---

## Paso 6: Configurar en Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto `tuhuipotecafacil-crm`
3. Ve a **Settings** → **Environment Variables**
4. Agrega:

| Nombre | Valor |
|--------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxx` (la que copiaste) |
| `FROM_EMAIL` | `CRM <notificaciones@tuhipotecafacil.cl>` |

5. Haz clic en **Save**
6. Ve a **Deployments** y haz clic en **Redeploy** para aplicar los cambios

---

## Paso 7: Probar

1. Ve a Resend → **Emails**
2. Haz clic en **Test** o envía un email de prueba
3. Verifica que se envíe correctamente

---

## Troubleshooting

### "DNS not verified"
- Espera más tiempo (puede tardar hasta 24 horas)
- Verifica que los registros estén correctos
- Usa https://www.dnschecker.org para verificar

### "Emails going to spam"
- Verifica que SPF y DKIM estén en verde en Resend
- Asegúrate de que FROM_EMAIL sea `notificaciones@tuhipotecafacil.cl`

### No encuentro dónde agregar DNS en Nic.cl
- Ve a https://www.nic.cl → Iniciar Sesión → Mis Dominios → tuhipotecafacil.cl → Administrar Zone
- Si no ves la opción, contacta a soporte de Nic.cl

---

## Registros que deberías tener al final

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | @ | `v=spf1 include:send.resend.com ~all` |
| CNAME | resend._domainkey | `[valor de Resend]` |
| TXT | [verificación] | `[valor de Resend]` |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:dmarc@tuhipotecafacil.cl` |
| MX | @ | `[si ya tienes correo configurado]` |

Si ya tienes un registro MX para tu correo, **no lo borres** - solo agrega los nuevos registros.
