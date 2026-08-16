import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { validarSesionSolicitud } = vi.hoisted(() => ({
  validarSesionSolicitud: vi.fn(),
}));

vi.mock("@/lib/request-session", () => ({ validarSesionSolicitud }));

import { requireAuth, requireRole } from "@/lib/api-auth";

const SESSION = {
  userId: "usuario-uno",
  email: "persona@example.invalid",
  rol: "ADMIN",
};

describe("cache de validación por solicitud", () => {
  beforeEach(() => {
    validarSesionSolicitud.mockReset();
    validarSesionSolicitud.mockResolvedValue(SESSION);
  });

  it("comparte una validación entre requireAuth y requireRole", async () => {
    const request = new NextRequest("http://localhost/api/bancos");

    await expect(requireAuth(request)).resolves.toBe(SESSION);
    await expect(requireRole(request, ["ADMIN"])).resolves.toBe(SESSION);

    expect(validarSesionSolicitud).toHaveBeenCalledOnce();
  });

  it("no comparte resultados entre solicitudes distintas", async () => {
    await requireAuth(new NextRequest("http://localhost/api/bancos"));
    await requireAuth(new NextRequest("http://localhost/api/bancos"));

    expect(validarSesionSolicitud).toHaveBeenCalledTimes(2);
  });
});
