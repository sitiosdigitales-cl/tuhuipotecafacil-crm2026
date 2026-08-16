import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { despacharNotificacion, enviarEmail, from } = vi.hoisted(() => ({
  despacharNotificacion: vi.fn(),
  enviarEmail: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

vi.mock("@/lib/email", () => ({ enviarEmail }));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion,
}));

import { POST } from "@/app/api/webhook/leads/route";

const originalSecret = process.env.ELEMENTOR_WEBHOOK_SECRET;
const WEBHOOK_SECRET = "webhook-test-secret-with-enough-entropy";
const validBody = {
  Apellido: "Prueba",
  "Correo Electrónico": "lead@example.invalid",
  Nombre: "Caso",
};

function request(url = "http://localhost/api/webhook/leads", secret?: string) {
  return new NextRequest(url, {
    body: JSON.stringify(validBody),
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    method: "POST",
  });
}

describe("secreto del webhook de leads", () => {
  beforeEach(() => {
    delete process.env.ELEMENTOR_WEBHOOK_SECRET;
    despacharNotificacion.mockReset();
    despacharNotificacion.mockResolvedValue(undefined);
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
    from.mockReset();
    from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.ELEMENTOR_WEBHOOK_SECRET;
    } else {
      process.env.ELEMENTOR_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("no procesa datos si el servidor no tiene secreto configurado", async () => {
    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });

  it("solo acepta el secreto en una cabecera", async () => {
    process.env.ELEMENTOR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const queryResponse = await POST(
      request(`http://localhost/api/webhook/leads?secret=${WEBHOOK_SECRET}`)
    );
    const headerResponse = await POST(request(undefined, WEBHOOK_SECRET));

    expect(queryResponse.status).toBe(401);
    expect(headerResponse.status).toBe(200);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("mantiene el secreto fuera del navegador y exige configuración en WordPress", () => {
    const plugin = readFileSync(join(process.cwd(), "crm-webhook-plugin.php"), "utf8");
    const publicForm = readFileSync(
      join(process.cwd(), "public/formulario-leads.html"),
      "utf8"
    );

    expect(plugin).toMatch(/if\s*\(empty\(\$secret\)\)\s*\{/);
    expect(plugin).toContain("X-Webhook-Secret");
    expect(publicForm).toContain("const WEBHOOK_URL = '/api/pre-evaluacion'");
    expect(publicForm).not.toContain("X-Webhook-Secret");
  });
});
