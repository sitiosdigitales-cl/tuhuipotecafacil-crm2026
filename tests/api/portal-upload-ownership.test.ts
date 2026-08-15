import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, getPublicUrl, storageFrom, upload } = vi.hoisted(() => ({
  from: vi.fn(),
  getPublicUrl: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from,
    storage: { from: storageFrom },
  },
  toSupabaseColumns: (row: unknown) => row,
}));

import { POST } from "@/app/api/portal/upload/route";

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

describe("POST /api/portal/upload", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockImplementation((table: string) =>
      queryResult(
        table === "leads"
          ? {
              data: { id: "lead-ajeno", nombre: "Cliente", apellido: "Ajeno" },
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

  it("rechaza un archivo sin prueba de pertenencia al lead", async () => {
    const formData = new FormData();
    formData.set(
      "archivo",
      new File(["%PDF-1.4"], "documento.pdf", { type: "application/pdf" })
    );
    formData.set("leadId", "lead-ajeno");
    formData.set("tipo", "LIQUIDACION_SUELDO");

    const response = await POST(
      new NextRequest("http://localhost/api/portal/upload", {
        body: formData,
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(storageFrom).not.toHaveBeenCalled();
  });
});
