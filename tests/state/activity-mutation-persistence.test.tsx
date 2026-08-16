import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ActivityProvider,
  useActivities,
} from "@/lib/contexts/ActivityContext";

function respuestaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Harness() {
  const { actividades, agregarActividad } = useActivities();
  const registrar = () => {
    void agregarActividad({
      leadId: "lead-sintetico",
      tipo: "nota",
      titulo: "Seguimiento",
      descripcion: "Caso de prueba",
      usuario: "QA",
      usuarioId: "usuario-qa",
    }).catch(() => undefined);
  };

  return (
    <div>
      <span data-testid="ids">
        {actividades.map((actividad) => actividad.id).join(",")}
      </span>
      <button type="button" onClick={registrar}>
        Registrar
      </button>
    </div>
  );
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("persistencia de actividades", () => {
  it("no agrega estado local cuando la API rechaza el registro", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        return respuestaJson(
          { success: false, error: "No se pudo registrar la actividad" },
          500
        );
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(
      <ActivityProvider>
        <Harness />
      </ActivityProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/actividades",
        expect.objectContaining({ method: "POST" })
      )
    );
    expect(screen.getByTestId("ids").textContent).toBe("");
  });

  it("incorpora el identificador confirmado por el servidor", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        return respuestaJson({
          success: true,
          data: {
            id: "actividad-persistida",
            leadId: "lead-sintetico",
            tipo: "nota",
            titulo: "Seguimiento",
            descripcion: "Caso de prueba",
            fecha: "2026-08-16T00:00:00.000Z",
            usuario: "QA",
            usuarioId: "usuario-qa",
            metadata: {},
          },
        }, 201);
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(
      <ActivityProvider>
        <Harness />
      </ActivityProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe(
        "actividad-persistida"
      )
    );
  });

  it("conecta la ficha y maneja los registros secundarios fallidos", () => {
    const clienteSource = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/clientes/[id]/page.tsx"),
      "utf8"
    );
    const apiSource = readFileSync(
      join(process.cwd(), "src/app/api/actividades/route.ts"),
      "utf8"
    );
    const leadsSource = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/leads/page.tsx"),
      "utf8"
    );
    const pipelineSource = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/pipeline/page.tsx"),
      "utf8"
    );

    expect(clienteSource).toContain("obtenerActividadesLead(lead.id)");
    expect(clienteSource).not.toContain("const actividades: ActividadCliente[] = []");
    expect(clienteSource).toContain("WhatsApp se abrió, pero no se registró");
    expect(apiSource).toContain("data: serializarActividad(data)");
    expect(apiSource).toContain("metadata: metadata || {}");
    expect(leadsSource).toContain("El lead se guardó, pero no su actividad");
    expect(pipelineSource).toContain("La etapa cambió, pero no se registró");
  });
});
