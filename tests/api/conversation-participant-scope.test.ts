import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const {
  contains,
  deleteRow,
  from,
  insert,
  requireAuth,
  update,
} = vi.hoisted(() => ({
  contains: vi.fn(),
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
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import {
  GET as getConversaciones,
  POST as postConversacion,
} from "@/app/api/conversaciones/route";
import {
  DELETE as deleteConversacion,
  GET as getConversacion,
  PUT as putConversacion,
} from "@/app/api/conversaciones/[id]/route";

function queryResult(data: unknown) {
  const query = {
    contains,
    delete: deleteRow,
    eq: vi.fn(() => query),
    insert,
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: Array.isArray(data) ? data : [data], error: null }),
    update,
  };
  contains.mockReturnValue(query);
  deleteRow.mockReturnValue(query);
  insert.mockReturnValue(query);
  update.mockReturnValue(query);
  return query;
}

function setRole(rol: Rol, userId = "usuario-actual") {
  requireAuth.mockReturnValue({
    email: `${userId}@example.invalid`,
    rol,
    userId,
  });
}

function request(path: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    method,
  });
}

const params = { params: Promise.resolve({ id: "conversacion-uno" }) };

describe("alcance de conversaciones por participante", () => {
  beforeEach(() => {
    contains.mockReset();
    deleteRow.mockReset();
    from.mockReset();
    insert.mockReset();
    requireAuth.mockReset();
    update.mockReset();
  });

  it("limita el listado al usuario de la sesión", async () => {
    setRole("EJECUTIVO");
    from.mockReturnValue(
      queryResult({
        id: "conversacion-propia",
        participantes: ["usuario-actual", "usuario-dos"],
      })
    );

    const response = await getConversaciones(
      request("/api/conversaciones?participante=usuario-ajeno")
    );

    expect(response.status).toBe(200);
    expect(contains).toHaveBeenCalledWith("participantes", ["usuario-actual"]);
    expect(contains).not.toHaveBeenCalledWith("participantes", ["usuario-ajeno"]);
  });

  it("rechaza el detalle cuando el usuario no participa", async () => {
    setRole("EJECUTIVO");
    from.mockReturnValue(
      queryResult({
        creadopor: "usuario-dos",
        id: "conversacion-uno",
        participantes: ["usuario-dos", "usuario-tres"],
      })
    );

    const response = await getConversacion(
      request("/api/conversaciones/conversacion-uno"),
      params
    );

    expect(response.status).toBe(403);
  });

  it("rechaza la edición cuando el usuario no participa", async () => {
    setRole("EJECUTIVO");
    from.mockReturnValue(
      queryResult({
        creadopor: "usuario-dos",
        id: "conversacion-uno",
        participantes: ["usuario-dos", "usuario-tres"],
      })
    );

    const response = await putConversacion(
      request("/api/conversaciones/conversacion-uno", "PUT", {
        nombre: "Nombre reemplazado",
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("deriva creador y participante actual desde la sesión", async () => {
    setRole("EJECUTIVO");
    from.mockReturnValue(
      queryResult({
        creadopor: "usuario-actual",
        id: "conversacion-uno",
        participantes: ["usuario-actual", "usuario-dos"],
      })
    );

    const response = await postConversacion(
      request("/api/conversaciones", "POST", {
        creadoPor: "usuario-ajeno",
        nombre: "Revisión hipotecaria",
        participantes: ["usuario-dos"],
        tipo: "DIRECTO",
      })
    );
    const payload = insert.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(payload.creadoPor).toBe("usuario-actual");
    expect(payload.participantes).toEqual(["usuario-actual", "usuario-dos"]);
  });

  it("aplica el catálogo de roles a consulta y eliminación", async () => {
    setRole("CLIENTE");

    const getResponse = await getConversaciones(request("/api/conversaciones"));
    const deleteResponse = await deleteConversacion(
      request("/api/conversaciones/conversacion-uno", "DELETE"),
      params
    );

    expect(getResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
