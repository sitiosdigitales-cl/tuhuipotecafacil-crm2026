import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { crearRespaldo } = vi.hoisted(() => ({ crearRespaldo: vi.fn() }));

vi.mock("@/lib/backup", () => ({ crearRespaldo }));

import { GET } from "@/app/api/backup/cron/route";

const originalSecret = process.env.CRON_SECRET;
const SECRET = "cron-secret-de-pruebas-2026";

function request(secret?: string) {
  return new NextRequest("http://localhost/api/backup/cron", {
    headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
  });
}

describe("tarea automática de respaldo", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    crearRespaldo.mockReset();
    crearRespaldo.mockResolvedValue({
      success: true,
      fecha: "2026-08-15",
      archivo: "backup-2026-08-15.json",
      estadisticas: { totalLeads: 1, totalDocumentos: 2 },
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("rechaza una firma distinta de CRON_SECRET", async () => {
    const response = await GET(request("otro-secreto-suficientemente-largo"));

    expect(response.status).toBe(401);
    expect(crearRespaldo).not.toHaveBeenCalled();
  });

  it("crea la exportación cuando Vercel entrega CRON_SECRET", async () => {
    const response = await GET(request(SECRET));

    expect(response.status).toBe(200);
    expect(crearRespaldo).toHaveBeenCalledOnce();
  });
});
