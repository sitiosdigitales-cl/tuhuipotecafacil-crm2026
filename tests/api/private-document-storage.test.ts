import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSignedUrl,
  from,
  getPublicUrl,
  insert,
  remove,
  requireAuth,
  storageFrom,
  upload,
} = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  from: vi.fn(),
  getPublicUrl: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: {
    from,
    storage: { from: storageFrom },
  },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { GET as getDocuments } from "@/app/api/documentos/route";
import { GET as getDocumentFile } from "@/app/api/documentos/[id]/archivo/route";
import { POST as portalUpload } from "@/app/api/portal/upload/route";
import { POST as staffUpload } from "@/app/api/upload/route";

function leadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: {
        asignadoa: "agente-uno",
        email: "cliente@example.invalid",
        id: "lead-uno",
      },
      error: null,
    }),
  };
  return query;
}

function insertQuery(error: unknown = null) {
  const result = { data: null, error };
  const query = {
    insert,
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  insert.mockReturnValue(query);
  return query;
}

function listQuery() {
  const result = {
    data: [
      {
        archivourl:
          "https://project.supabase.co/storage/v1/object/public/documentos/lead-uno/documento-uno.pdf",
        id: "documento-uno",
        leadid: "lead-uno",
        nombre: "Liquidación.pdf",
      },
    ],
    error: null,
  };
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    select: vi.fn(() => query),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return query;
}

function uploadRequest() {
  const formData = new FormData();
  formData.set(
    "archivo",
    new File(["%PDF-1.4 contenido"], "liquidacion.pdf", {
      type: "application/pdf",
    })
  );
  formData.set("leadId", "lead-uno");
  formData.set("tipo", "LIQUIDACION_SUELDO");
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

describe("almacenamiento privado de documentos", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
    createSignedUrl.mockResolvedValue({
      data: {
        signedUrl:
          "https://project.supabase.co/storage/v1/object/sign/documentos/lead-uno/documento-uno.pdf?token=firma-breve",
      },
      error: null,
    });
    from.mockReset();
    getPublicUrl.mockReset();
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          "https://project.supabase.co/storage/v1/object/public/documentos/lead-uno/publico.pdf",
      },
    });
    insert.mockReset();
    remove.mockReset();
    remove.mockResolvedValue({ error: null });
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });
    storageFrom.mockReset();
    storageFrom.mockReturnValue({
      createSignedUrl,
      getPublicUrl,
      remove,
      upload,
    });
    upload.mockReset();
    upload.mockResolvedValue({ error: null });
  });

  it.each([
    ["equipo", staffUpload],
    ["portal", portalUpload],
  ])(
    "la subida de %s guarda ruta interna y devuelve proxy autenticado",
    async (_label, handler) => {
      from.mockImplementation((table: string) =>
        table === "leads" ? leadQuery() : insertQuery()
      );

      const response = await handler(uploadRequest());
      const payload = await response.json();
      const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;

      expect(response.status).toBe(200);
      expect(row.archivoUrl).toMatch(
        /^lead-uno\/[0-9a-f-]+\.pdf$/
      );
      expect(payload.data.archivoUrl).toBe(
        `/api/documentos/${payload.data.id}/archivo`
      );
      expect(getPublicUrl).not.toHaveBeenCalled();
    }
  );

  it("elimina el objeto si no puede guardar su referencia", async () => {
    from.mockImplementation((table: string) =>
      table === "leads"
        ? leadQuery()
        : insertQuery({ message: "fallo de base" })
    );

    const response = await staffUpload(uploadRequest());

    expect(response.status).toBe(500);
    expect(remove).toHaveBeenCalledWith([
      expect.stringMatching(/^lead-uno\/[0-9a-f-]+\.pdf$/),
    ]);
  });

  it("convierte referencias públicas antiguas en rutas del proxy", async () => {
    from.mockReturnValue(listQuery());

    const response = await getDocuments(
      new NextRequest("http://localhost/api/documentos")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data[0].archivoUrl).toBe(
      "/api/documentos/documento-uno/archivo"
    );
    expect(JSON.stringify(payload)).not.toContain("/object/public/");
  });

  it("comprueba la cartera antes de crear un enlace firmado", async () => {
    requireAuth.mockReturnValue({
      email: "agente.uno@example.invalid",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    from.mockImplementation((table: string) => {
      const data =
        table === "documentos"
          ? { archivourl: "lead-uno/documento-uno.pdf", leadid: "lead-uno" }
          : { asignadoa: "agente-dos", email: "cliente@example.invalid" };
      const query = {
        eq: vi.fn(() => query),
        select: vi.fn(() => query),
        single: vi.fn().mockResolvedValue({ data, error: null }),
      };
      return query;
    });

    const response = await getDocumentFile(
      new NextRequest(
        "http://localhost/api/documentos/documento-uno/archivo"
      ),
      { params: Promise.resolve({ id: "documento-uno" }) }
    );

    expect(response.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("redirige una sesión autorizada con firma breve y sin caché", async () => {
    from.mockImplementation((table: string) => {
      const data =
        table === "documentos"
          ? { archivourl: "lead-uno/documento-uno.pdf", leadid: "lead-uno" }
          : { asignadoa: "agente-dos", email: "cliente@example.invalid" };
      const query = {
        eq: vi.fn(() => query),
        select: vi.fn(() => query),
        single: vi.fn().mockResolvedValue({ data, error: null }),
      };
      return query;
    });

    const response = await getDocumentFile(
      new NextRequest(
        "http://localhost/api/documentos/documento-uno/archivo"
      ),
      { params: Promise.resolve({ id: "documento-uno" }) }
    );

    expect(response.status).toBe(307);
    expect(createSignedUrl).toHaveBeenCalledWith(
      "lead-uno/documento-uno.pdf",
      60
    );
    expect(response.headers.get("location")).toContain("token=firma-breve");
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0"
    );
  });
});
