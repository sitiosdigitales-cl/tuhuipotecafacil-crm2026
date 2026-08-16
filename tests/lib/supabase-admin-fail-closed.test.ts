import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const originalEnv = {
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

describe("cliente Supabase de service role", () => {
  beforeEach(() => {
    vi.resetModules();
    createClient.mockReset();
    createClient.mockImplementation((url: string, key: string) => ({ key, url }));
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", originalEnv.url);
    restoreEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", originalEnv.anonKey);
    restoreEnv("SUPABASE_SERVICE_ROLE_KEY", originalEnv.serviceKey);
  });

  it("no exporta privilegios desde el módulo compartido con el navegador", async () => {
    const publicModule = await import("@/lib/supabase");

    expect(publicModule).not.toHaveProperty("supabaseAdmin");
  });

  it("falla de forma explícita cuando falta service role", async () => {
    const { getSupabaseAdmin } = await import("@/lib/supabase-admin");

    expect(() => getSupabaseAdmin()).toThrow(
      "SUPABASE_SERVICE_ROLE_KEY no configurada"
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("crea un cliente aislado cuando la configuración está completa", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const { getSupabaseAdmin } = await import("@/lib/supabase-admin");

    const client = getSupabaseAdmin();

    expect(client).toEqual({
      key: "service-role-key",
      url: "https://project.supabase.co",
    });
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      }
    );
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
