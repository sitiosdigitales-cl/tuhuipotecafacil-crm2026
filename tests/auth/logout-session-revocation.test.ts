import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revocarSesionSupabase } = vi.hoisted(() => ({
  revocarSesionSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase-auth", () => ({ revocarSesionSupabase }));

import { POST } from "@/app/api/auth/logout/route";

describe("cierre de sesión Supabase", () => {
  beforeEach(() => {
    revocarSesionSupabase.mockReset();
    revocarSesionSupabase.mockResolvedValue(undefined);
  });

  it("revoca la sesión remota y elimina todas las cookies", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: "crm_token=crm; crm_sb_access=synthetic-access; crm_sb_refresh=synthetic-refresh",
        },
      }),
    );
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(revocarSesionSupabase).toHaveBeenCalledWith("synthetic-access");
    // crm_token, auth_token, crm_sb_access, crm_sb_refresh y crm_rec_access.
    expect(cookies).toContain("crm_rec_access=;");
    expect(cookies.match(/Max-Age=0/g)).toHaveLength(5);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("limpia el navegador aunque el proveedor no responda", async () => {
    revocarSesionSupabase.mockRejectedValue(new Error("synthetic outage"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie: "crm_sb_access=synthetic-access" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(consoleError).toHaveBeenCalledWith(
      "No se pudo revocar la sesión remota durante el cierre",
    );
  });
});
