import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestAuthClient, verifyOtp } = vi.hoisted(() => ({
  createRequestAuthClient: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase-auth", () => ({ createRequestAuthClient }));

import { GET } from "@/app/api/auth/recuperacion/callback/route";

function callback(query = "?token=token-sintetico") {
  return new NextRequest(
    `http://localhost/api/auth/recuperacion/callback${query}`,
  );
}

beforeEach(() => {
  verifyOtp.mockReset();
  createRequestAuthClient.mockReset();
  createRequestAuthClient.mockReturnValue({ auth: { verifyOtp } });
});

describe("callback de recuperación", () => {
  it("canjea el token por una cookie acotada al flujo", async () => {
    verifyOtp.mockResolvedValue({
      data: { session: { access_token: "access-de-recuperacion" } },
      error: null,
    });

    const response = await GET(callback());
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/recuperar-contrasena/nueva",
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "token-sintetico",
    });
    expect(cookies).toContain("crm_rec_access=access-de-recuperacion");
    expect(cookies).toContain("HttpOnly");
  });

  it("no abre sesión del CRM: cierra la que hubiera", async () => {
    verifyOtp.mockResolvedValue({
      data: { session: { access_token: "access-de-recuperacion" } },
      error: null,
    });

    const response = await GET(callback());
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(cookies).not.toContain("crm_sb_access=access-de-recuperacion");
    expect(cookies).toContain("crm_sb_access=;");
    expect(cookies).toContain("crm_token=;");
  });

  it("el destino no arrastra el token", async () => {
    verifyOtp.mockResolvedValue({
      data: { session: { access_token: "access-de-recuperacion" } },
      error: null,
    });

    const response = await GET(callback());

    expect(response.headers.get("location")).not.toContain("token-sintetico");
  });

  it.each([
    ["vencido o ya usado", { data: { session: null }, error: { code: "otp_expired" } }],
    ["desconocido", { data: { session: null }, error: null }],
  ])("manda a solicitar uno nuevo cuando el token está %s", async (_caso, resultado) => {
    verifyOtp.mockResolvedValue(resultado);

    const response = await GET(callback());
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/recuperar-contrasena?estado=invalido",
    );
    expect(cookies).toContain("crm_rec_access=;");
  });

  it("no llama a Supabase Auth sin token en la URL", async () => {
    const response = await GET(callback(""));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/recuperar-contrasena?estado=invalido",
    );
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("no acepta un token más largo que el límite", async () => {
    const response = await GET(callback(`?token=${"a".repeat(513)}`));

    expect(verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("estado=invalido");
  });
});
