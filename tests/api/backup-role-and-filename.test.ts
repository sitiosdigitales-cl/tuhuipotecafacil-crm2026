import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { list, remove, requireAuth, storageFrom } = vi.hoisted(() => ({
  list: vi.fn(),
  remove: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: storageFrom },
  },
}));

import { DELETE, GET } from "@/app/api/backup/route";

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
    list.mockResolvedValue({ data: [], error: null });
    remove.mockResolvedValue({ error: null });
    storageFrom.mockReturnValue({ list, remove });
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.BACKUP_API_KEY;
    } else {
      process.env.BACKUP_API_KEY = originalApiKey;
    }
  });

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
});
