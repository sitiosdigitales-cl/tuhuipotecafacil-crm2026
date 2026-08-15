import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET as getBanco, DELETE, PUT } from "@/app/api/bancos/[id]/route";
import { GET as getBancos, POST } from "@/app/api/bancos/route";

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

describe("API de bancos sin sesión", () => {
  beforeEach(() => {
    from.mockReturnValue(queryResult({ data: [], error: null }));
  });

  it.each([
    ["lista bancos", () => getBancos(new NextRequest("http://localhost/api/bancos"))],
    [
      "lee un banco",
      () =>
        getBanco(new NextRequest("http://localhost/api/bancos/banco-1"), {
          params: Promise.resolve({ id: "banco-1" }),
        }),
    ],
    [
      "crea un banco",
      () =>
        POST(
          new NextRequest("http://localhost/api/bancos", {
            body: JSON.stringify({ nombre: "Banco inyectado" }),
            headers: { "content-type": "application/json" },
            method: "POST",
          })
        ),
    ],
    [
      "modifica un banco",
      () =>
        PUT(
          new NextRequest("http://localhost/api/bancos/banco-1", {
            body: JSON.stringify({ tasaBase: 0 }),
            headers: { "content-type": "application/json" },
            method: "PUT",
          }),
          { params: Promise.resolve({ id: "banco-1" }) }
        ),
    ],
    [
      "elimina un banco",
      () =>
        DELETE(
          new NextRequest("http://localhost/api/bancos/banco-1", {
            method: "DELETE",
          }),
          { params: Promise.resolve({ id: "banco-1" }) }
        ),
    ],
  ])("rechaza cuando se intenta %s", async (_label, request) => {
    const response = await request();

    expect(response.status).toBe(401);
  });
});
