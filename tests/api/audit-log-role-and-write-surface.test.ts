import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

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
}));

import * as auditRoute from "@/app/api/auditoria/route";

function query() {
  const chain = {
    eq: vi.fn(() => chain),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    order: vi.fn(() => chain),
    select: vi.fn(() => chain),
  };
  return chain;
}

function setRole(rol: Rol) {
  requireAuth.mockReturnValue({
    email: `${rol.toLowerCase()}@example.invalid`,
    rol,
    userId: `usuario-${rol.toLowerCase()}`,
  });
}

describe("superficie del registro de auditoría", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    from.mockImplementation(() => query());
  });

  it("CLIENTE no puede leer registros", async () => {
    setRole("CLIENTE");

    const response = await auditRoute.GET(
      new NextRequest("http://localhost/api/auditoria")
    );

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("ADMIN conserva la consulta del registro", async () => {
    setRole("ADMIN");

    const response = await auditRoute.GET(
      new NextRequest("http://localhost/api/auditoria")
    );

    expect(response.status).toBe(200);
  });

  it("no expone una escritura pública de auditoría", () => {
    expect("POST" in auditRoute).toBe(false);
  });
});
