import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, getPublicUrl, requireAuth, storageFrom, upload } = vi.hoisted(
  () => ({
    from: vi.fn(),
    getPublicUrl: vi.fn(),
    requireAuth: vi.fn(),
    storageFrom: vi.fn(),
    upload: vi.fn(),
  })
);

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from,
    storage: { from: storageFrom },
  },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/upload/route";

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    from.mockReset();
    from.mockImplementation((table: string) =>
      queryResult(
        table === "leads"
          ? {
              data: { asignadoa: "agente-dos", id: "lead-ajeno" },
              error: null,
            }
          : { data: null, error: null }
      )
    );
    upload.mockReset();
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReset();
    getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://storage.example/documento-ajeno.pdf" },
    });
    storageFrom.mockReset();
    storageFrom.mockReturnValue({ getPublicUrl, upload });
  });

  it("impide que un agente suba archivos al lead de otro", async () => {
    const formData = new FormData();
    formData.set(
      "archivo",
      new File(["%PDF-1.4"], "documento.pdf", { type: "application/pdf" })
    );
    formData.set("leadId", "lead-ajeno");
    formData.set("tipo", "LIQUIDACION_SUELDO");

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(from).toHaveBeenCalledWith("leads");
    expect(storageFrom).not.toHaveBeenCalled();
  });
});
