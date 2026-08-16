import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmail, from } = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/email", () => ({ enviarEmail }));

import { POST } from "@/app/api/pre-evaluacion/route";

function leadInsertQuery() {
  const query = {
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: { id: "lead-uno" }, error: null }),
  };
  return query;
}

describe("correo de pre evaluación", () => {
  beforeEach(() => {
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
    from.mockReset();
    from.mockImplementation((table: string) =>
      table === "leads"
        ? leadInsertQuery()
        : { insert: vi.fn().mockResolvedValue({ error: null }) }
    );
  });

  it("trata los datos del formulario como texto dentro del correo", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/pre-evaluacion", {
        body: JSON.stringify({
          apellido: "Prueba </td>",
          comentarios: "Consulta <img src=x>",
          email: "cliente@example.invalid",
          nombre: "Caso <b>Uno</b>",
          tipoCredito: "Hipotecario <script>",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(enviarEmail).toHaveBeenCalledTimes(2);
    for (const [options] of enviarEmail.mock.calls) {
      expect(options.html).toContain("&lt;");
      expect(options.html).not.toContain("<b>Uno</b>");
      expect(options.html).not.toContain("<img src=x>");
      expect(options.html).not.toContain("<script>");
    }
  });
});
