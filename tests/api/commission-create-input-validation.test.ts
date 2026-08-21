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

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown[]) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { POST } from "@/app/api/comisiones/route";

function request(body: string, contentType = "application/json") {
  return new NextRequest("http://localhost/api/comisiones", {
    body,
    headers: { "content-type": contentType },
    method: "POST",
  });
}

describe("entrada de creación de comisiones", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    requireAuth.mockResolvedValue({ rol: "ADMIN", userId: "admin-1" });
  });

  it("rechaza campos fuera del contrato financiero", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          montoTotal: 100_000_000,
          tasaComision: 1.25,
          tasaOculta: 99,
        })
      )
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza cantidades y períodos con tipos inválidos", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          anio: 2026.5,
          montoTotal: "100000000",
          tasaComision: 1.25,
        })
      )
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos que superan 8 KiB", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          montoTotal: 100_000_000,
          tasaComision: 1.25,
          relleno: "x".repeat(9 * 1024),
        })
      )
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });
});
