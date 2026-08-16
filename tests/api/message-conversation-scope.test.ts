import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { from, insert, requireAuth, update } = vi.hoisted(() => ({
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
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET, POST } from "@/app/api/mensajes/route";
import {
  DELETE,
  PUT,
} from "@/app/api/mensajes/[id]/route";

const CONVERSACION_PROPIA = {
  id: "conversacion-uno",
  participantes: ["usuario-actual", "usuario-dos"],
};

const CONVERSACION_AJENA = {
  id: "conversacion-uno",
  participantes: ["usuario-dos", "usuario-tres"],
};

function singleQuery(data: unknown) {
  const query = {
    eq: vi.fn(() => query),
    insert,
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    update,
  };
  insert.mockReturnValue(query);
  update.mockReturnValue(query);
  return query;
}

function listQuery(data: unknown[]) {
  const limit = vi.fn().mockResolvedValue({ data, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  return { select: vi.fn().mockReturnValue({ eq }) };
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

const params = { params: Promise.resolve({ id: "mensaje-uno" }) };

describe("alcance de mensajes por conversación", () => {
  beforeEach(() => {
    from.mockReset();
    insert.mockReset();
    requireAuth.mockReset();
    update.mockReset();
  });

  it("rechaza leer mensajes de una conversación ajena", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_AJENA)
        : listQuery([])
    );

    const response = await GET(
      request("/api/mensajes?conversacionId=conversacion-uno")
    );

    expect(response.status).toBe(403);
  });

  it("deriva remitente y nombre desde la sesión", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) => {
      if (table === "conversaciones") return singleQuery(CONVERSACION_PROPIA);
      if (table === "usuarios") {
        return singleQuery({ apellido: "Soto", nombre: "Elena" });
      }
      if (table === "notificaciones") return { insert: vi.fn() };
      return singleQuery({ id: "mensaje-uno" });
    });

    const response = await POST(
      request("/api/mensajes", "POST", {
        contenido: "Antecedentes recibidos",
        conversacionId: "conversacion-uno",
        remitenteId: "usuario-ajeno",
        remitenteNombre: "Nombre reemplazado",
      })
    );
    const payload = insert.mock.calls.find(
      ([row]) => (row as Record<string, unknown>).contenido
    )?.[0] as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(payload.remitenteId).toBe("usuario-actual");
    expect(payload.remitenteNombre).toBe("Elena Soto");
  });

  it("rechaza enviar a una conversación ajena", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_AJENA)
        : singleQuery({ id: "mensaje-uno" })
    );

    const response = await POST(
      request("/api/mensajes", "POST", {
        contenido: "Mensaje de prueba",
        conversacionId: "conversacion-uno",
        remitenteId: "usuario-actual",
      })
    );

    expect(response.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rechaza editar un mensaje de otra persona", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_PROPIA)
        : singleQuery({
            conversacionid: "conversacion-uno",
            id: "mensaje-uno",
            remitenteid: "usuario-dos",
          })
    );

    const response = await PUT(
      request("/api/mensajes/mensaje-uno", "PUT", {
        contenido: "Contenido reemplazado",
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("permite al autor editar su propio mensaje", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_PROPIA)
        : singleQuery({
            conversacionid: "conversacion-uno",
            id: "mensaje-uno",
            remitenteid: "usuario-actual",
          })
    );

    const response = await PUT(
      request("/api/mensajes/mensaje-uno", "PUT", {
        contenido: "Contenido corregido",
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: "Contenido corregido" })
    );
  });

  it("registra la reacción exclusivamente para el usuario actual", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_PROPIA)
        : singleQuery({
            conversacionid: "conversacion-uno",
            id: "mensaje-uno",
            reacciones: { "👍": ["usuario-dos"] },
            remitenteid: "usuario-dos",
          })
    );

    const response = await PUT(
      request("/api/mensajes/mensaje-uno", "PUT", { emoji: "👍" }),
      params
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        reacciones: { "👍": ["usuario-dos", "usuario-actual"] },
      })
    );
  });

  it("rechaza eliminar un mensaje de otra persona", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_PROPIA)
        : singleQuery({
            conversacionid: "conversacion-uno",
            id: "mensaje-uno",
            remitenteid: "usuario-dos",
          })
    );

    const response = await DELETE(
      request("/api/mensajes/mensaje-uno", "DELETE"),
      params
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("permite al autor retirar su propio mensaje", async () => {
    setRole("EJECUTIVO");
    from.mockImplementation((table: string) =>
      table === "conversaciones"
        ? singleQuery(CONVERSACION_PROPIA)
        : singleQuery({
            conversacionid: "conversacion-uno",
            id: "mensaje-uno",
            remitenteid: "usuario-actual",
          })
    );

    const response = await DELETE(
      request("/api/mensajes/mensaje-uno", "DELETE"),
      params
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: "[Mensaje eliminado]" })
    );
  });

  it("aplica el catálogo de roles antes de consultar datos", async () => {
    setRole("CLIENTE");

    const response = await GET(
      request("/api/mensajes?conversacionId=conversacion-uno")
    );

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
