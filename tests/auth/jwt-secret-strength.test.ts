import { afterEach, describe, expect, it } from "vitest";

import { generarToken, verificarToken } from "@/lib/jwt";

const originalSecret = process.env.JWT_SECRET;
const payload = {
  email: "persona@example.invalid",
  rol: "EJECUTIVO",
  userId: "usuario-prueba",
};

describe("fortaleza mínima de JWT_SECRET", () => {
  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("no emite sesiones con una clave menor a 32 caracteres", () => {
    process.env.JWT_SECRET = "x".repeat(31);

    expect(() => generarToken(payload)).toThrow(/al menos 32 caracteres/i);
  });

  it("no valida sesiones con una clave menor a 32 caracteres", () => {
    process.env.JWT_SECRET = "x".repeat(31);

    expect(() => verificarToken("token-invalido")).toThrow(
      /al menos 32 caracteres/i
    );
  });

  it("emite y valida sesiones con una clave de 32 caracteres", () => {
    process.env.JWT_SECRET = "x".repeat(32);

    const token = generarToken(payload);

    expect(verificarToken(token)).toMatchObject(payload);
  });
});
