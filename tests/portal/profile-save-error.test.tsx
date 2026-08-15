import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/tipos", () => ({
  ETAPAS_CONFIG: { NUEVO_LEAD: { label: "Nuevo lead" } },
  SITUACION_LABORAL_CONFIG: { DEPENDIENTE: { label: "Dependiente" } },
}));

vi.mock("@/lib/utils", () => ({
  formatoMoneda: (value: number) => String(value),
  formatoMonedaAbreviado: (value: number) => String(value),
  formatoUF: (value: number) => String(value),
}));

vi.mock("@/modulos/documentos/config", () => ({
  buscarDocSubido: () => false,
  obtenerDocumentosCompletos: () => [],
}));

vi.mock("@/componentes/documentos/DocumentoChecklistRow", () => ({
  DocumentoChecklistRow: () => null,
}));

vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

import { PortalClienteContent } from "@/componentes/portal/PortalClienteContent";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("guardado del perfil en el portal", () => {
  beforeEach(() => {
    toastError.mockReset();
    toastSuccess.mockReset();

    const storage = new Map<string, string>();
    storage.set("portal_welcome_lead-propio", "visto");
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url === "/api/portal/mi-solicitud") {
          return jsonResponse({
            success: true,
            data: {
              apellido: "Prueba",
              creadoEn: "2026-08-15T00:00:00.000Z",
              email: "cliente@example.invalid",
              enDicom: false,
              etapa: "NUEVO_LEAD",
              id: "lead-propio",
              nombre: "Persona",
              rut: "11.111.111-1",
              situacionLaboral: "DEPENDIENTE",
            },
          });
        }

        if (url === "/api/documentos?leadId=lead-propio") {
          return jsonResponse({ data: [], success: true });
        }

        if (url === "/api/leads/lead-propio" && init?.method === "PUT") {
          return jsonResponse(
            { error: "No se pudieron guardar los cambios", success: false },
            500
          );
        }

        throw new Error(`Petición inesperada: ${url}`);
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("mantiene la edición abierta y muestra error cuando la API responde 500", async () => {
    render(<PortalClienteContent />);

    await screen.findByText(/Hola, Persona/);
    fireEvent.click(screen.getByRole("button", { name: /Mi Perfil/ }));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());

    expect(toastSuccess).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Guardar Cambios/ })
    ).toBeTruthy();
  });
});
