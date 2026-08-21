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

import { LeadProvider, useLeads } from "@/lib/contexts/LeadContext";
import type { Lead } from "@/tipos";

const leadInput: Omit<Lead, "id" | "creadoEn"> = {
  nombre: "Caso",
  apellido: "Sintético",
  rut: "11.111.111-1",
  situacionLaboral: "DEPENDIENTE",
  enDicom: false,
  origen: "WEB",
  etapa: "NUEVO_LEAD",
  prioridad: "MEDIA",
  diasEnEtapa: 0,
};

function respuestaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Harness() {
  const {
    leads,
    agregarLead,
    actualizarLead,
    eliminarLead,
    cargando,
  } = useLeads();
  const crear = () => {
    void agregarLead(leadInput).catch(() => undefined);
  };
  const renombrar = () => {
    const lead = leads[0];
    if (lead) {
      void actualizarLead(lead.id, { nombre: "Editado" }).catch(() => undefined);
    }
  };
  const eliminar = () => {
    const lead = leads[0];
    if (lead) {
      void eliminarLead(lead.id).catch(() => undefined);
    }
  };

  return (
    <div>
      <span data-testid="estado">{cargando ? "cargando" : "listo"}</span>
      <span data-testid="ids">{leads.map((lead) => lead.id).join(",")}</span>
      <span data-testid="nombres">{leads.map((lead) => lead.nombre).join(",")}</span>
      <button type="button" onClick={crear}>
        Crear
      </button>
      <button type="button" onClick={renombrar}>
        Renombrar
      </button>
      <button type="button" onClick={eliminar}>
        Eliminar
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

describe("persistencia de mutaciones de leads", () => {
  const leadPersistido: Lead = {
    ...leadInput,
    id: "lead-existente",
    nombre: "Original",
    creadoEn: new Date("2026-08-16T00:00:00.000Z"),
  };

  it("no incorpora un lead local cuando la API rechaza la creación", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        return respuestaJson(
          { success: false, error: "No se pudo crear el lead" },
          500
        );
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(
      <LeadProvider>
        <Harness />
      </LeadProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("estado").textContent).toBe("listo")
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads",
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
            ...leadInput,
            id: "lead-persistido",
            creadoEn: "2026-08-16T00:00:00.000Z",
          },
        }, 201);
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(
      <LeadProvider>
        <Harness />
      </LeadProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("estado").textContent).toBe("listo")
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("lead-persistido")
    );
  });

  it("mantiene los datos confirmados cuando la API rechaza una edición", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        return respuestaJson(
          { success: false, error: "No se pudo actualizar el lead" },
          500
        );
      }
      return respuestaJson({ success: true, data: [leadPersistido] });
    });

    render(
      <LeadProvider>
        <Harness />
      </LeadProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("nombres").textContent).toBe("Original")
    );
    fireEvent.click(screen.getByRole("button", { name: "Renombrar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads/lead-existente",
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(screen.getByTestId("nombres").textContent).toBe("Original");
  });

  it("aplica en una edición los datos devueltos por el servidor", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        return respuestaJson({
          success: true,
          data: { ...leadPersistido, nombre: "Confirmado" },
        });
      }
      return respuestaJson({ success: true, data: [leadPersistido] });
    });

    render(
      <LeadProvider>
        <Harness />
      </LeadProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("nombres").textContent).toBe("Original")
    );
    fireEvent.click(screen.getByRole("button", { name: "Renombrar" }));

    await waitFor(() =>
      expect(screen.getByTestId("nombres").textContent).toBe("Confirmado")
    );
  });

  it("conserva el lead cuando la API rechaza su eliminación", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "DELETE") {
        return respuestaJson(
          { success: false, error: "No se pudo eliminar el lead" },
          500
        );
      }
      return respuestaJson({ success: true, data: [leadPersistido] });
    });

    render(
      <LeadProvider>
        <Harness />
      </LeadProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("lead-existente")
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads/lead-existente",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    expect(screen.getByTestId("ids").textContent).toBe("lead-existente");
  });

  it("mantiene el formulario abierto y usa el contrato camelCase", () => {
    const formSource = readFileSync(
      join(process.cwd(), "src/componentes/leads/FormularioLead.tsx"),
      "utf8"
    );
    const apiSource = readFileSync(
      join(process.cwd(), "src/app/api/leads/route.ts"),
      "utf8"
    );
    const leadsPageSource = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/leads/page.tsx"),
      "utf8"
    );
    const pipelineSource = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/pipeline/page.tsx"),
      "utf8"
    );
    const selectorSource = readFileSync(
      join(process.cwd(), "src/componentes/pipeline/AsignarEjecutivo.tsx"),
      "utf8"
    );

    expect(formSource).toContain("const resultado = await onSubmit");
    expect(formSource).toContain("if (resultado !== false) onOpenChange(false)");
    expect(apiSource).toContain("data: fromSupabaseColumns(data)");
    expect(apiSource).toContain("asignadoA: body.asignadoA || null");
    expect(leadsPageSource).toContain("const leadPersistido = await agregarLead");
    expect(leadsPageSource).toContain("leadId: leadPersistido.id");
    expect(pipelineSource).toContain("asignadoA: data.asignadoA");
    expect(pipelineSource).toContain('lead.asignadoA === usuarioActual.id');
    expect(pipelineSource).not.toContain("ejec-view-");
    expect(selectorSource).toContain('u.rol === "EJECUTIVO"');
    expect(selectorSource).toContain("id: user.id, nombre: nombreCompleto");
  });
});
