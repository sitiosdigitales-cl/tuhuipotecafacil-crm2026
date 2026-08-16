import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import {
  eliminarCookiesSesion,
  establecerCookiesSupabase,
} from "@/lib/session-cookie";

const SESSION = {
  access_token: "synthetic-access-token",
  refresh_token: "synthetic-refresh-token",
  expires_in: 3_600,
  expires_at: 1_800_000_000,
  token_type: "bearer",
  user: { id: "10000000-0000-4000-8000-000000000001" },
} as Session;

describe("cookies del puente Supabase Auth", () => {
  it("guarda ambos tokens como HttpOnly con vigencias acotadas", () => {
    const response = NextResponse.json({ success: true });
    establecerCookiesSupabase(response, SESSION);
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(cookies).toContain("crm_sb_access=synthetic-access-token");
    expect(cookies).toContain("crm_sb_refresh=synthetic-refresh-token");
    expect(cookies).toContain("Max-Age=3600");
    expect(cookies).toContain("Max-Age=604800");
    expect(cookies.match(/HttpOnly/g)).toHaveLength(2);
    expect(cookies.match(/Priority=high/g)).toHaveLength(2);
  });

  it("el cierre elimina también las cookies de Supabase", () => {
    const response = NextResponse.json({ success: true });
    eliminarCookiesSesion(response);
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(cookies).toContain("crm_sb_access=");
    expect(cookies).toContain("crm_sb_refresh=");
    expect(cookies.match(/Max-Age=0/g)).toHaveLength(4);
  });
});
