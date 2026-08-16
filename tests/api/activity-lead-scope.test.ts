import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  activityIn,
  activityInsert,
  activityLimit,
  activityOrder,
  activitySelect,
  from,
  leadEq,
  leadSelect,
  leadSingle,
  requireAuth,
} = vi.hoisted(() => ({
  activityIn: vi.fn(),
  activityInsert: vi.fn(),
  activityLimit: vi.fn(),
  activityOrder: vi.fn(),
  activitySelect: vi.fn(),
  from: vi.fn(),
  leadEq: vi.fn(),
  leadSelect: vi.fn(),
  leadSingle: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => Response.json({ success: false }, { status: 403 }),
  requireAuth,
  unauthorized: () => Response.json({ success: false }, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (value: unknown) => value,
}));

import { GET, POST } from "@/app/api/actividades/route";

const agente = {
  userId: "agente-uno",
  email: "agente@example.test",
  nombre: "Agente Uno",
  rol: "AGENTE",
};

describe("alcance de actividades por lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue(agente);

    activityLimit.mockResolvedValue({ data: [], error: null });
    activityOrder.mockReturnValue({ limit: activityLimit });
    activityIn.mockReturnValue({ order: activityOrder });
    activitySelect.mockReturnValue({ in: activityIn, order: activityOrder });

    leadSingle.mockResolvedValue({
      data: { id: "lead-ajeno", asignadoa: "agente-dos", email: "cliente@example.test" },
      error: null,
    });
    leadEq.mockReturnValue({ single: leadSingle });
    leadSelect.mockReturnValue({ eq: leadEq });

    from.mockImplementation((table: string) => {
      if (table === "leads") return { select: leadSelect };
      if (table === "actividades") {
        return { select: activitySelect, insert: activityInsert };
      }
      throw new Error(`Tabla inesperada: ${table}`);
    });
  });

  it("limita la colección del agente a los leads asignados", async () => {
    leadEq.mockResolvedValueOnce({
      data: [{ id: "lead-propio" }],
      error: null,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/actividades?limit=9999")
    );

    expect(response.status).toBe(200);
    expect(leadEq).toHaveBeenCalledWith("asignadoa", "agente-uno");
    expect(activityIn).toHaveBeenCalledWith("leadid", ["lead-propio"]);
    expect(activityLimit).toHaveBeenCalledWith(200);
  });

  it("no entrega el historial de un lead que no corresponde al rol", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/actividades?leadId=lead-ajeno")
    );

    expect(response.status).toBe(403);
    expect(activitySelect).not.toHaveBeenCalled();
  });

  it("no registra actividad en un lead que no corresponde al rol", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: "lead-ajeno",
          tipo: "nota",
          titulo: "Seguimiento",
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(activityInsert).not.toHaveBeenCalled();
  });
});
