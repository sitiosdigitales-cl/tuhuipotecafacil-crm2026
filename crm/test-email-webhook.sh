#!/bin/bash
# Script de prueba para el webhook de email
# Uso: ./test-email-webhook.sh

echo "=== Probando Webhook de Email ==="
echo ""

# Email de prueba
TEST_EMAIL='{
  "from": "Juan Pérez <juan.perez@ejemplo.com>",
  "to": "contacto@tuhipotecafacil.cl",
  "subject": "Consulta crédito hipotecario primera vivienda",
  "text": "Hola, me gustaría información sobre crédito hipotecario para mi primera vivienda. Mi teléfono es +56912345678. Estoy buscando un departamento de 3 dormitorios en Providencia.",
  "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

echo "1. Enviando email de prueba..."
echo "$TEST_EMAIL" | python3 -m json.tool 2>/dev/null || echo "$TEST_EMAIL"
echo ""

curl -s -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/email" \
  -H "Content-Type: application/json" \
  -d "$TEST_EMAIL" | python3 -m json.tool 2>/dev/null

echo ""
echo "2. Verificando respuesta..."
echo ""
echo "=== Prueba completada ==="
echo ""
echo "Si el lead se creó correctamente, deberías ver:"
echo '  "success": true'
echo '  "leadId": "uuid"'
echo '  "nombre": "Juan Pérez"'
echo '  "email": "juan.perez@ejemplo.com"'
