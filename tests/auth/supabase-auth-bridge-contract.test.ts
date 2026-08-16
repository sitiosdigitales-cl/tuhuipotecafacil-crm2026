import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const helperPath = join(process.cwd(), "src/lib/supabase-auth.ts");
const loginPath = join(process.cwd(), "src/app/api/auth/login/route.ts");
const cookiePath = join(process.cwd(), "src/lib/session-cookie.ts");
const ciPath = join(process.cwd(), ".github/workflows/ci.yml");
const supabaseConfigPath = join(process.cwd(), "supabase/config.toml");

describe("contrato del puente de login", () => {
  it("mantiene legacy por defecto y exige fecha al modo bridge", () => {
    expect(existsSync(helperPath)).toBe(true);
    const helper = readFileSync(helperPath, "utf8");

    expect(helper).toContain('return "legacy"');
    expect(helper).toContain("SUPABASE_AUTH_MODE");
    expect(helper).toContain("SUPABASE_AUTH_BRIDGE_DEADLINE");
    expect(helper).toMatch(/legacy[\s\S]+bridge[\s\S]+required/);
  });

  it("crea y enlaza la identidad antes de retirar el hash", () => {
    const helper = readFileSync(helperPath, "utf8");
    const login = readFileSync(loginPath, "utf8");

    expect(helper).toContain("reclamar_migracion_auth");
    expect(helper).toContain("auth.admin.createUser");
    expect(helper).toContain("signInWithPassword");
    expect(helper).toContain("completar_migracion_auth");
    expect(login).toContain("migrarIdentidadSupabase");
  });

  it("mantiene los tokens de Supabase fuera del JSON", () => {
    const cookies = readFileSync(cookiePath, "utf8");
    const login = readFileSync(loginPath, "utf8");

    expect(cookies).toContain("SUPABASE_ACCESS_COOKIE");
    expect(cookies).toContain("SUPABASE_REFRESH_COOKIE");
    expect(cookies).toContain("httpOnly: true");
    expect(login).toContain("establecerCookiesSupabase");
    expect(login).not.toMatch(/access_token\s*:/);
    expect(login).not.toMatch(/refresh_token\s*:/);
  });

  it("ejecuta el puente contra servicios locales sin imprimir sus claves", () => {
    const ci = readFileSync(ciPath, "utf8");

    expect(ci).toContain("scripts/ci/auth-bridge-integration.mjs");
    expect(ci).toMatch(/supabase status -o env > ["']?\$status_file/);
    expect(ci).not.toMatch(/cat\s+["']?\$status_file/);
  });

  it("habilita el login por email sin abrir el registro público", () => {
    const config = readFileSync(supabaseConfigPath, "utf8");
    const authSection = config.match(/\[auth\]([\s\S]*?)\[auth\.rate_limit\]/)?.[1];
    const emailSection = config.match(/\[auth\.email\]([\s\S]*?)\[auth\.sms\]/)?.[1];

    expect(authSection).toMatch(/enable_signup\s*=\s*false/);
    expect(emailSection).toMatch(/enable_signup\s*=\s*true/);
  });

  it("acota a quince minutos los access tokens del entorno versionado", () => {
    const config = readFileSync(supabaseConfigPath, "utf8");
    const authSection = config.match(/\[auth\]([\s\S]*?)\[auth\.rate_limit\]/)?.[1];
    const expiry = Number(authSection?.match(/jwt_expiry\s*=\s*(\d+)/)?.[1]);

    expect(expiry).toBeGreaterThanOrEqual(300);
    expect(expiry).toBeLessThanOrEqual(900);
  });

  it("habilita enrolamiento y verificación TOTP en el entorno local", () => {
    const config = readFileSync(supabaseConfigPath, "utf8");
    const totpSection = config.match(
      /\[auth\.mfa\.totp\]([\s\S]*?)\[auth\.mfa\.phone\]/,
    )?.[1];

    expect(totpSection).toMatch(/enroll_enabled\s*=\s*true/);
    expect(totpSection).toMatch(/verify_enabled\s*=\s*true/);
  });
});
