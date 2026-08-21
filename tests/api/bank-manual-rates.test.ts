import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth, requireRole } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  requireRole,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

import { PATCH } from "@/app/api/bancos/[id]/tasas/route";
import { GET } from "@/app/api/bancos/tasas-publicas/route";

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

function ratesRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/bancos/banco-1/tasas", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });
}

describe("catálogo manual de tasas bancarias", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    requireRole.mockReset();
    requireAuth.mockResolvedValue({ userId: "ejecutivo-1" });
    requireRole.mockResolvedValue({
      email: "ejecutivo@example.invalid",
      rol: "EJECUTIVO",
      userId: "ejecutivo-1",
    });
  });

  it("publica solo los campos referenciales del catálogo", async () => {
    from.mockReturnValue(
      queryResult({
        data: [{
          cae: "5.20",
          color: "#123456",
          id: "banco-1",
          nombre: "Banco Sintético",
          tasa_base: "4.50",
          updated_at: "2026-08-21T12:00:00.000Z",
        }],
        error: null,
      })
    );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: [{
        actualizadoEn: "2026-08-21T12:00:00.000Z",
        cae: 5.2,
        color: "#123456",
        id: "banco-1",
        nombre: "Banco Sintético",
        tasa: 4.5,
      }],
    });
  });

  it("permite al ejecutivo actualizar únicamente tasas validadas", async () => {
    from.mockImplementation((table: string) =>
      table === "bancos"
        ? queryResult({
            data: {
              cae: "5.10",
              color: "#123456",
              estado: "ACTIVO",
              id: "banco-1",
              nombre: "Banco Sintético",
              tasa_base: "4.40",
              tasa_preferencial: "4.10",
              updated_at: "2026-08-21T12:00:00.000Z",
            },
            error: null,
          })
        : queryResult({ data: null, error: null })
    );

    const response = await PATCH(
      ratesRequest({ cae: 5.1, tasaBase: 4.4, tasaPreferencial: 4.1 }),
      { params: Promise.resolve({ id: "banco-1" }) }
    );

    expect(response.status).toBe(200);
    expect(requireRole).toHaveBeenCalledWith(
      expect.anything(),
      ["SUPER_ADMIN", "ADMIN", "EJECUTIVO"]
    );
    expect(await response.json()).toMatchObject({
      success: true,
      data: { tasaBase: 4.4, tasaPreferencial: 4.1, cae: 5.1 },
    });
  });

  it("rechaza campos ajenos a las tasas", async () => {
    const response = await PATCH(
      ratesRequest({
        cae: 5.1,
        nombre: "No corresponde",
        tasaBase: 4.4,
        tasaPreferencial: 4.1,
      }),
      { params: Promise.resolve({ id: "banco-1" }) }
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("retira afirmaciones CMF y arreglos fijos de ambos simuladores", () => {
    for (const file of [
      "src/app/(dashboard)/simulador/page.tsx",
      "src/app/simulador-publico/page.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toContain("tasas reales CMF");
      expect(source).not.toContain("const BANCOS = [");
      expect(source).toContain("useTasasBancosPublicas");
    }
  });
});
