import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { deleteRow, from, insert, requireAuth, update } = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET, POST } from "@/app/api/integraciones/route";
import {
  DELETE,
  PUT,
} from "@/app/api/integraciones/[id]/route";

const FILA_INTEGRACION = {
  configuracion: {
    apiKey: "api-key-real",
    oauth: {
      accessToken: "access-token-real",
      region: "southamerica-west1",
    },
    webhookUrl: "https://example.invalid/webhook",
  },
  estado: "CONECTADA",
  id: "integracion-uno",
  nombre: "Proveedor externo",
};

function query() {
  const chain = {
    delete: deleteRow,
    eq: vi.fn(() => chain),
    insert,
    order: vi.fn().mockResolvedValue({ data: [FILA_INTEGRACION], error: null }),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data: FILA_INTEGRACION, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: FILA_INTEGRACION, error: null }),
    update,
  };
  deleteRow.mockReturnValue(chain);
  insert.mockReturnValue(chain);
  update.mockReturnValue(chain);
  return chain;
}

function setRole(rol: Rol) {
  requireAuth.mockReturnValue({
    email: `${rol.toLowerCase()}@example.invalid`,
    rol,
    userId: `usuario-${rol.toLowerCase()}`,
  });
}

function request(path: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    method,
  });
}

const params = { params: Promise.resolve({ id: "integracion-uno" }) };

describe("roles y secretos de integraciones", () => {
  beforeEach(() => {
    deleteRow.mockReset();
    from.mockReset();
    insert.mockReset();
    requireAuth.mockReset();
    update.mockReset();
    from.mockImplementation(() => query());
  });

  it.each([
    ["listar", () => GET(request("/api/integraciones"))],
    [
      "crear",
      () =>
        POST(
          request("/api/integraciones", "POST", {
            nombre: "Proveedor externo",
          })
        ),
    ],
    [
      "editar",
      () =>
        PUT(
          request("/api/integraciones/integracion-uno", "PUT", {
            estado: "CONECTADA",
          }),
          params
        ),
    ],
    [
      "eliminar",
      () =>
        DELETE(
          request("/api/integraciones/integracion-uno", "DELETE"),
          params
        ),
    ],
  ])("CLIENTE no puede %s integraciones", async (_label, operation) => {
    setRole("CLIENTE");

    const response = await operation();

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("oculta secretos anidados en el listado administrativo", async () => {
    setRole("ADMIN");

    const response = await GET(request("/api/integraciones"));
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(serialized).not.toContain("api-key-real");
    expect(serialized).not.toContain("access-token-real");
    expect(payload.data[0].configuracion).toMatchObject({
      apiKey: "••••••••",
      oauth: {
        accessToken: "••••••••",
        region: "southamerica-west1",
      },
      webhookUrl: "https://example.invalid/webhook",
    });
  });

  it("genera ID y fecha al crear e ignora campos desconocidos", async () => {
    setRole("ADMIN");

    const response = await POST(
      request("/api/integraciones", "POST", {
        campoInesperado: "no guardar",
        creadoEn: "2000-01-01T00:00:00.000Z",
        estado: "CONECTADA",
        id: "id-enviado",
        nombre: "Proveedor externo",
        tipo: "API",
      })
    );
    const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(row.id).not.toBe("id-enviado");
    expect(row.creadoEn).not.toBe("2000-01-01T00:00:00.000Z");
    expect(row).not.toHaveProperty("campoInesperado");
  });

  it("usa una lista cerrada al editar", async () => {
    setRole("ADMIN");

    const response = await PUT(
      request("/api/integraciones/integracion-uno", "PUT", {
        campoInesperado: "no guardar",
        creadoEn: "2000-01-01T00:00:00.000Z",
        estado: "DESCONECTADA",
        id: "id-reemplazado",
        nombre: "Nombre vigente",
      }),
      params
    );
    const row = update.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(row).toEqual({ estado: "DESCONECTADA", nombre: "Nombre vigente" });
  });
});
