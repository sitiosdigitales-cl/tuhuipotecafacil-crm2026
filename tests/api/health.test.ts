import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

import { GET } from "@/app/api/health/route";

function healthQuery(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    limit: vi.fn().mockResolvedValue(result),
  };
  return query;
}

describe("GET /api/health", () => {
  beforeEach(() => from.mockReset());

  it("confirma la dependencia de datos sin exponer detalles", async () => {
    from.mockReturnValue(healthQuery({ data: [], error: null }));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(from).toHaveBeenCalledWith("usuarios");
  });

  it("responde indisponible sin publicar el error interno", async () => {
    from.mockReturnValue(
      healthQuery({ data: null, error: { message: "dato interno" } })
    );

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toBe('{"status":"unavailable"}');
    expect(body).not.toContain("dato interno");
  });
});

