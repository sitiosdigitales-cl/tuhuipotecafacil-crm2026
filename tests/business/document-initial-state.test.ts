import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, insert, requireAuth, single } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/documentos/route";

describe("alta de documentos", () => {
  beforeEach(() => {
    requireAuth.mockReturnValue({
      email: "ejecutivo@example.invalid",
      rol: "EJECUTIVO",
      userId: "ejecutivo-uno",
    });
    single.mockResolvedValue({ data: { id: "documento-nuevo" }, error: null });

    const query = {
      insert,
      select: vi.fn(() => query),
      single,
    };
    insert.mockReturnValue(query);
    from.mockReturnValue(query);
  });

  it("siempre inicia el documento pendiente de revisión", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/documentos", {
        body: JSON.stringify({
          estado: "APROBADO",
          leadId: "lead-uno",
          nombre: "Liquidación de sueldo",
          tipo: "LIQUIDACION_SUELDO",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "PENDIENTE" })
    );
  });
});
