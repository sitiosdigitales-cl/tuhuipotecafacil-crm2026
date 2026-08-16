import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmail, from, resolveReferralCode } = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  from: vi.fn(),
  resolveReferralCode: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ enviarEmail }));
vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));
vi.mock("@/lib/referral-code", () => ({
  ReferralCodeConfigurationError: class extends Error {},
  resolveReferralCode,
}));

import { POST as createPreEvaluation } from "@/app/api/pre-evaluacion/route";
import { POST as registerReferral } from "@/app/api/referidos/registrar/route";

function request(path: string, body: unknown, contentType = "application/json") {
  return new NextRequest(`http://localhost${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": contentType },
    method: "POST",
  });
}

describe("payloads de captación pública", () => {
  beforeEach(() => {
    enviarEmail.mockReset();
    from.mockReset();
    resolveReferralCode.mockReset();
    resolveReferralCode.mockResolvedValue({
      id: "usuario-uno",
      nombre: "Ana",
      apellido: "Pérez",
    });
  });

  it("rechaza un email inválido antes de escribir la pre evaluación", async () => {
    const response = await createPreEvaluation(
      request("/api/pre-evaluacion", {
        apellido: "Prueba",
        email: "sin-arroba",
        nombre: "Caso",
      })
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos que superan 32 KiB aunque el JSON sea válido", async () => {
    const response = await createPreEvaluation(
      request("/api/pre-evaluacion", {
        apellido: "Prueba",
        comentarios: "x".repeat(33 * 1024),
        email: "cliente@example.invalid",
        nombre: "Caso",
      })
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });

  it("exige content-type JSON en la entrada pública", async () => {
    const response = await createPreEvaluation(
      request(
        "/api/pre-evaluacion",
        {
          apellido: "Prueba",
          email: "cliente@example.invalid",
          nombre: "Caso",
        },
        "text/plain"
      )
    );

    expect(response.status).toBe(415);
    expect(from).not.toHaveBeenCalled();
  });

  it("valida los datos del referido antes de resolver el código", async () => {
    const response = await registerReferral(
      request("/api/referidos/registrar", {
        codigo: "codigo-firmado",
        email: "correo incorrecto",
        nombre: "Caso Referido",
      })
    );

    expect(response.status).toBe(400);
    expect(resolveReferralCode).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
});
