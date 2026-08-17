import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { buscarCuentaRecuperable } from "@/lib/recuperacion-password";

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => Promise.resolve(result).then(onFulfilled, onRejected);
        }
        return vi.fn(() => query);
      },
    },
  );
  return query;
}

describe("consulta de cuenta recuperable", () => {
  it("decide por indicadores derivados sin traer el hash legado", async () => {
    const select = vi.fn((columns: string) => {
      void columns;
      return queryResult({
        data: {
          id: "usuario-sintetico",
          nombre: "Cuenta",
          email: "recuperacion@example.invalid",
          estado: "ACTIVO",
          auth_user_id: null,
          auth_pending_user_id: null,
          tiene_password: true,
        },
        error: null,
      });
    });
    const adminClient = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient;

    await buscarCuentaRecuperable(
      "recuperacion@example.invalid",
      adminClient,
    );

    const selectedColumns = String(select.mock.calls[0]?.[0])
      .split(",")
      .map((column) => column.trim());
    expect(selectedColumns).toContain("auth_pending_user_id");
    expect(selectedColumns).toContain("tiene_password");
    expect(selectedColumns).not.toContain("password");
  });
});
