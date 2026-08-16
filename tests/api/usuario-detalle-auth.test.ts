import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET } from "@/app/api/usuarios/[id]/route";

describe("GET /api/usuarios/[id]", () => {
  beforeEach(() => {
    const single = vi.fn().mockResolvedValue({
      data: {
        apellido: "Privado",
        creadoen: "2026-08-14T12:00:00.000Z",
        email: "ejecutivo@empresa.cl",
        estado: "ACTIVO",
        id: "usuario-ajeno",
        nombre: "Ejecutivo",
        rol: "AGENTE",
        telefono: "+56911111111",
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });
  });

  it("rechaza la consulta sin sesión antes de leer el perfil", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/usuarios/usuario-ajeno"),
      { params: Promise.resolve({ id: "usuario-ajeno" }) }
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
