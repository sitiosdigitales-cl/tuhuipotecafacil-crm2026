import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { list, remove, requireAuth, storageFrom, tableFrom, upload } = vi.hoisted(() => ({
  list: vi.fn(),
  remove: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
  tableFrom: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: tableFrom,
    storage: { from: storageFrom },
  },
}));

import { DELETE, GET, POST } from "@/app/api/backup/route";

const originalApiKey = process.env.BACKUP_API_KEY;
const API_KEY = "backup-test-key-with-more-than-32-chars";

function request(path: string, authorization?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("roles y nombres de respaldo", () => {
  beforeEach(() => {
    process.env.BACKUP_API_KEY = API_KEY;
    list.mockReset();
    remove.mockReset();
    requireAuth.mockReset();
    storageFrom.mockReset();
    tableFrom.mockReset();
    upload.mockReset();
    list.mockResolvedValue({ data: [], error: null });
    remove.mockResolvedValue({ error: null });
    upload.mockResolvedValue({ error: null });
    storageFrom.mockReturnValue({ list, remove, upload });
    tableFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.BACKUP_API_KEY;
    } else {
      process.env.BACKUP_API_KEY = originalApiKey;
    }
  });

  afterEach(() => vi.restoreAllMocks());

  it("CLIENTE no puede listar los respaldos", async () => {
    requireAuth.mockReturnValue({
      email: "cliente@example.invalid",
      rol: "CLIENTE",
      userId: "cliente-uno",
    });

    const response = await GET(request("/api/backup"));

    expect(response.status).toBe(403);
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it("ADMIN conserva el listado", async () => {
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });

    const response = await GET(request("/api/backup"));

    expect(response.status).toBe(200);
    expect(storageFrom).toHaveBeenCalledWith("backups");
  });

  it("ADMIN puede crear un respaldo desde el panel", async () => {
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });

    const response = await POST(request("/api/backup"));

    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^backup-\d{4}-\d{2}-\d{2}\.json$/),
      expect.any(String),
      expect.objectContaining({ upsert: true })
    );
  });

  it("no guarda una exportación parcial si falla una tabla", async () => {
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });
    tableFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue(
        table === "leads"
          ? { data: null, error: { message: "fallo de lectura" } }
          : { data: [], error: null }
      ),
    }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request("/api/backup"));

    expect(response.status).toBe(500);
    expect(upload).not.toHaveBeenCalled();
  });

  it("ADMIN puede eliminar un respaldo desde el panel", async () => {
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });

    const response = await DELETE(
      request("/api/backup?file=backup-2026-08-15.json")
    );

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(["backup-2026-08-15.json"]);
  });

  it("rechaza nombres que no sean la fecha canónica del respaldo", async () => {
    const response = await DELETE(
      request(
        "/api/backup?file=backup-../../otro-objeto.json",
        `Bearer ${API_KEY}`
      )
    );

    expect(response.status).toBe(400);
    expect(remove).not.toHaveBeenCalled();
  });

  it("permite eliminar un nombre canónico con la clave del proceso", async () => {
    const response = await DELETE(
      request(
        "/api/backup?file=backup-2026-08-15.json",
        `Bearer ${API_KEY}`
      )
    );

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(["backup-2026-08-15.json"]);
  });

  it("programa una ruta GET separada que comprueba CRON_SECRET", () => {
    const vercel = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8")
    ) as { crons: Array<{ path: string }> };
    const cronSource = readFileSync(
      join(process.cwd(), "src/app/api/backup/cron/route.ts"),
      "utf8"
    );

    expect(vercel.crons).toContainEqual(expect.objectContaining({
      path: "/api/backup/cron",
    }));
    expect(cronSource).toContain("CRON_SECRET");
  });
});
