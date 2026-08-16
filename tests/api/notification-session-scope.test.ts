import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const {
  deleteRow,
  despacharNotificacion,
  from,
  insert,
  limit,
  notificationEq,
  requireAuth,
  update,
} = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  despacharNotificacion: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  limit: vi.fn(),
  notificationEq: vi.fn(),
  requireAuth: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  requireRole: vi.fn(),
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion,
}));

import {
  DELETE,
  GET,
  POST,
  PUT,
} from "@/app/api/notificaciones/route";
import { PUT as updateLead } from "@/app/api/leads/[id]/route";

function notificationQuery() {
  const query = {
    delete: deleteRow,
    eq: notificationEq,
    insert,
    limit,
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: { id: "notificacion-nueva", usuarioId: "usuario-actual" },
      error: null,
    }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: null, error: null }),
    update,
  };
  deleteRow.mockReturnValue(query);
  insert.mockReturnValue(query);
  limit.mockResolvedValue({
    data: [
      {
        descripcion: "Contenido propio",
        id: "notificacion-propia",
        titulo: "Notificación propia",
        usuarioid: "usuario-actual",
      },
    ],
    error: null,
  });
  notificationEq.mockReturnValue(query);
  update.mockReturnValue(query);
  return query;
}

function leadReadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: {
        asignadoa: "asesor-uno",
        email: "cliente@example.invalid",
      },
      error: null,
    }),
  };
  return query;
}

function leadUpdateQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: {
        apellido: "Valdés",
        email: "cliente@example.invalid",
        id: "lead-uno",
        nombre: "Camila",
        telefono: "+56922223333",
      },
      error: null,
    }),
    update: vi.fn(() => query),
  };
  return query;
}

function setRole(rol: Rol, userId = `usuario-${rol.toLowerCase()}`) {
  requireAuth.mockReturnValue({
    email:
      rol === "CLIENTE"
        ? "cliente@example.invalid"
        : `${userId}@example.invalid`,
    rol,
    userId,
  });
}

function jsonRequest(method: "POST" | "PUT", body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/notificaciones", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method,
  });
}

describe("alcance de notificaciones por sesión", () => {
  beforeEach(() => {
    deleteRow.mockReset();
    despacharNotificacion.mockReset();
    despacharNotificacion.mockResolvedValue(undefined);
    from.mockReset();
    from.mockImplementation(() => notificationQuery());
    insert.mockReset();
    limit.mockReset();
    notificationEq.mockReset();
    requireAuth.mockReset();
    update.mockReset();
  });

  it("ignora usuarioId de la URL y limita el listado a la sesión", async () => {
    setRole("EJECUTIVO", "usuario-actual");

    const response = await GET(
      new NextRequest(
        "http://localhost/api/notificaciones?usuarioId=usuario-ajeno&limit=999"
      )
    );

    expect(response.status).toBe(200);
    expect(notificationEq).toHaveBeenCalledWith(
      "usuarioid",
      "usuario-actual"
    );
    expect(notificationEq).not.toHaveBeenCalledWith(
      "usuarioid",
      "usuario-ajeno"
    );
    expect(limit).toHaveBeenCalledWith(100);
  });

  it("deriva el destinatario al crear una notificación local", async () => {
    setRole("EJECUTIVO", "usuario-actual");

    const response = await POST(
      jsonRequest("POST", {
        descripcion: "Tarea guardada",
        tipo: "tarea",
        titulo: "Cambios guardados",
        usuarioId: "usuario-ajeno",
      })
    );
    const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(row.usuarioId).toBe("usuario-actual");
    expect(row.usuarioId).not.toBe("usuario-ajeno");
  });

  it("CLIENTE no puede generar notificaciones genéricas", async () => {
    setRole("CLIENTE", "cliente-uno");

    const response = await POST(
      jsonRequest("POST", {
        tipo: "sistema",
        titulo: "Contenido enviado desde el portal",
        usuarioId: "asesor-uno",
      })
    );

    expect(response.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
  });

  it("limita lectura, marcado y eliminación al usuario de la sesión", async () => {
    setRole("EJECUTIVO", "usuario-actual");

    const putResponse = await PUT(
      jsonRequest("PUT", { id: "notificacion-ajena", leida: true })
    );
    const deleteResponse = await DELETE(
      new NextRequest(
        "http://localhost/api/notificaciones?id=notificacion-ajena",
        { method: "DELETE" }
      )
    );

    expect(putResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(notificationEq).toHaveBeenCalledWith(
      "usuarioid",
      "usuario-actual"
    );
    expect(notificationEq).toHaveBeenCalledWith("id", "notificacion-ajena");
  });

  it("no mantiene una suscripción directa a toda la tabla", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/contexts/NotificationContext.tsx"),
      "utf8"
    );

    expect(source).not.toContain('.channel("notificaciones-realtime")');
  });
});

describe("aviso del perfil del cliente desde el servidor", () => {
  beforeEach(() => {
    despacharNotificacion.mockReset();
    despacharNotificacion.mockResolvedValue(undefined);
    requireAuth.mockReset();
    setRole("CLIENTE", "cliente-uno");
    let leadCalls = 0;
    from.mockReset();
    from.mockImplementation((table: string) => {
      if (table !== "leads") return notificationQuery();
      leadCalls += 1;
      return leadCalls === 1 ? leadReadQuery() : leadUpdateQuery();
    });
  });

  it("despacha el aviso después de guardar el perfil propio", async () => {
    const response = await updateLead(
      new NextRequest("http://localhost/api/leads/lead-uno", {
        body: JSON.stringify({ telefono: "+56922223333" }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }),
      { params: Promise.resolve({ id: "lead-uno" }) }
    );

    expect(response.status).toBe(200);
    expect(despacharNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        evento: "sistema",
        leadId: "lead-uno",
        titulo: "Perfil actualizado por cliente",
      })
    );
  });
});
