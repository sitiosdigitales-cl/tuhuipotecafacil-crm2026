#!/usr/bin/env bash
# Script de respaldo manual para TuHipotecaFacil CRM
# Uso: BACKUP_API_KEY='<secreto>' ./scripts/backup-manual.sh [URL_BASE]

set -euo pipefail

: "${BACKUP_API_KEY:?Define BACKUP_API_KEY con el secreto vigente antes de ejecutar}"
URL_BASE="${1:-https://tuhuipotecafacil-crm.vercel.app}"

echo "=== Respaldo Manual TuHipotecaFacil ==="
echo "Fecha: $(date)"
echo "URL Base: $URL_BASE"
echo ""

# 1. Crear respaldo
echo "1. Creando respaldo..."
if ! RESPONSE=$(curl --fail-with-body --silent --show-error \
  -X POST "$URL_BASE/api/backup" \
  -H "Authorization: Bearer $BACKUP_API_KEY" \
  -H "Content-Type: application/json"); then
  echo "ERROR: La API de respaldo rechazó la solicitud o no respondió" >&2
  exit 1
fi

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Verificar si fue exitoso
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "Respaldo creado. Verifica el listado desde una sesión ADMIN en el CRM."
else
  echo ""
  echo "ERROR: No se pudo crear el respaldo"
  exit 1
fi

echo ""
echo "=== Respaldo completado ==="
