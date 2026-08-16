import type { TokenPayload } from "@/lib/jwt";

export function normalizarParticipantes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value.filter(
          (participante): participante is string =>
            typeof participante === "string" && participante.trim().length > 0
        )
      )
    );
  }

  if (typeof value === "string") {
    try {
      return normalizarParticipantes(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}

export function puedeAccederConversacion(
  auth: TokenPayload,
  conversacion: { participantes?: unknown }
): boolean {
  return (
    auth.rol === "SUPER_ADMIN" ||
    normalizarParticipantes(conversacion.participantes).includes(auth.userId)
  );
}
