import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestAuthClient, verifyOtp } = vi.hoisted(() => ({
  createRequestAuthClient: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase-auth", () => ({ createRequestAuthClient }));

import * as rutaCallback from "@/app/api/auth/recuperacion/callback/route";

const { POST } = rutaCallback;

function canje(cuerpo: unknown = { token: "token-sintetico" }) {
  return new NextRequest("http://localhost/api/auth/recuperacion/callback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

function canjeAceptado() {
  verifyOtp.mockResolvedValue({
    data: { session: { access_token: "access-de-recuperacion" } },
    error: null,
  });
}

beforeEach(() => {
  verifyOtp.mockReset();
  createRequestAuthClient.mockReset();
  createRequestAuthClient.mockReturnValue({ auth: { verifyOtp } });
});

describe("canje del enlace de recuperación", () => {
  it("no expone GET: el token no puede llegar por query", () => {
    expect("GET" in rutaCallback).toBe(false);
  });

  it("cambia el token del cuerpo por una cookie acotada al flujo", async () => {
    canjeAceptado();

    const response = await POST(canje());
    const cuerpo = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(cuerpo.success).toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "token-sintetico",
    });
    expect(cookies).toContain("crm_rec_access=access-de-recuperacion");
    expect(cookies).toContain("HttpOnly");
  });

  it("no devuelve el token ni el access token en el cuerpo", async () => {
    canjeAceptado();

    const response = await POST(canje());
    const cuerpo = JSON.stringify(await response.json());

    expect(cuerpo).not.toContain("token-sintetico");
    expect(cuerpo).not.toContain("access-de-recuperacion");
  });

  it("responde sin caché y sin referer", async () => {
    canjeAceptado();

    const response = await POST(canje());

    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("no abre sesión del CRM: cierra la que hubiera", async () => {
    canjeAceptado();

    const response = await POST(canje());
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(cookies).not.toContain("crm_sb_access=access-de-recuperacion");
    expect(cookies).toContain("crm_sb_access=;");
    expect(cookies).toContain("crm_token=;");
  });

  it.each([
    ["vencido o ya usado", { data: { session: null }, error: { code: "otp_expired" } }],
    ["desconocido", { data: { session: null }, error: null }],
  ])("rechaza el canje cuando el token está %s", async (_caso, resultado) => {
    verifyOtp.mockResolvedValue(resultado);

    const response = await POST(canje());
    const cuerpo = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(400);
    expect(cuerpo.success).toBe(false);
    expect(cookies).toContain("crm_rec_access=;");
  });

  it.each([
    ["sin token", {}],
    ["con token vacío", { token: "" }],
    ["con token sobredimensionado", { token: "a".repeat(513) }],
    ["con campos de más", { token: "token-sintetico", extra: "x" }],
  ])("no llama a Supabase Auth %s", async (_caso, cuerpo) => {
    const response = await POST(canje(cuerpo));

    expect(response.status).toBe(400);
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
