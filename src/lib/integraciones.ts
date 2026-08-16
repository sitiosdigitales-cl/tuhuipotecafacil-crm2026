export const SECRETO_OCULTO = "••••••••";

const NOMBRE_SECRETO =
  /(access.?token|refresh.?token|token|api.?key|secret|password|credential|authorization|private.?key)/i;

const CAMPOS_EDITABLES = [
  "nombre",
  "tipo",
  "proveedor",
  "estado",
  "configuracion",
] as const;

export function ocultarSecretos(value: unknown, key = ""): unknown {
  if (key && NOMBRE_SECRETO.test(key)) {
    return value === null || value === undefined || value === ""
      ? value
      : SECRETO_OCULTO;
  }

  if (Array.isArray(value)) {
    return value.map((item) => ocultarSecretos(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        ocultarSecretos(entryValue, entryKey),
      ])
    );
  }

  return value;
}

export function camposEditablesIntegracion(
  body: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    CAMPOS_EDITABLES.flatMap((campo) => {
      const value = body[campo];
      if (value === undefined) return [];
      if (
        campo === "configuracion" &&
        (!value || typeof value !== "object" || Array.isArray(value))
      ) {
        return [];
      }
      return [[campo, value]];
    })
  );
}
