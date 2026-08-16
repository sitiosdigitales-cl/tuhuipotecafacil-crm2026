import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmail, from } = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

vi.mock("@/lib/supabase", () => ({
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/email", () => ({
  enviarEmail,
}));

import { POST } from "@/app/api/webhook/email/route";

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

describe("POST /api/webhook/email", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(queryResult({ data: {}, error: null }));
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
  });

  it("rechaza un remitente no autenticado antes de crear el lead", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({
          from: "Atacante <atacante@example.com>",
          subject: "Lead inventado",
          text: "Teléfono: +56 9 1111 1111",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(enviarEmail).not.toHaveBeenCalled();
  });
});
