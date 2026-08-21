import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/supabase", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase")>(
    "@/lib/supabase"
  );
  return { ...actual, supabase: { from } };
});

import { POST } from "@/app/api/leads/route";

function request(body: string, contentType = "application/json") {
  return new NextRequest("http://localhost/api/leads", {
    body,
    headers: { "content-type": contentType },
    method: "POST",
  });
}

describe("entrada de creación de leads", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    requireAuth.mockResolvedValue({ rol: "ADMIN", userId: "user-1" });
  });

  it("rechaza tipos y campos que no pertenecen al contrato", async () => {
    const response = await POST(
      request(JSON.stringify({ nombre: "Ana", apellido: 123, pagado: true }))
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos que superan 64 KiB", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          nombre: "Ana",
          apellido: "Pérez",
          notas: "x".repeat(70 * 1024),
        })
      )
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });

  it("exige JSON declarado como application/json", async () => {
    const response = await POST(
      request(JSON.stringify({ nombre: "Ana", apellido: "Pérez" }), "text/plain")
    );

    expect(response.status).toBe(415);
    expect(from).not.toHaveBeenCalled();
  });

  it("reserva la creación de leads para administración", async () => {
    requireAuth.mockResolvedValue({ rol: "EJECUTIVO", userId: "ejecutivo-1" });

    const response = await POST(
      request(JSON.stringify({ nombre: "Ana", apellido: "Pérez" }))
    );

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
