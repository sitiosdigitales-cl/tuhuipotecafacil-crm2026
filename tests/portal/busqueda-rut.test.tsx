import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useLeads } = vi.hoisted(() => ({
  useLeads: vi.fn(),
}));

vi.mock("@/modulos/leads", () => ({ useLeads }));

vi.mock("@/tipos", () => ({
  ETAPAS_CONFIG: { NUEVO_LEAD: { label: "Nuevo lead" } },
  SITUACION_LABORAL_CONFIG: { DEPENDIENTE: { label: "Dependiente" } },
}));

vi.mock("@/lib/utils", () => ({
  formatoMoneda: (valor: number) => String(valor),
  formatoMonedaAbreviado: (valor: number) => String(valor),
  formatoUF: (valor: number) => String(valor),
}));

vi.mock("@/modulos/documentos/config", () => ({
  buscarDocSubido: () => false,
  obtenerDocumentosCompletos: () => [],
}));

vi.mock("@/componentes/documentos/DocumentoChecklistRow", () => ({
  DocumentoChecklistRow: () => null,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { PortalClienteContent } from "@/componentes/portal/PortalClienteContent";

describe("búsqueda del portal por RUT", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    localStorage.clear();
    localStorage.setItem("portal_welcome_lead-victima", "visto");
    useLeads.mockReturnValue({
      leads: [
        {
          apellido: "Protegida",
          creadoEn: new Date("2026-01-01T00:00:00.000Z"),
          email: "persona@example.invalid",
          enDicom: false,
          estadoCivil: "SOLTERO",
          etapa: "NUEVO_LEAD",
          id: "lead-victima",
          nombre: "Persona",
          profesion: "Ingeniera",
          rut: "12.345.678-5",
          situacionLaboral: "DEPENDIENTE",
          telefono: "+56900000000",
        },
      ],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          error: "No autenticado",
          success: false,
        }),
        ok: false,
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("rechaza seis dígitos contenidos en el RUT de otra persona", async () => {
    render(<PortalClienteContent />);

    await waitFor(() => {
      expect(screen.queryByText("Cargando tu solicitud…")).toBeNull();
    });

    const inputRut = screen.queryByPlaceholderText("12.345.678-9");
    if (inputRut) {
      fireEvent.change(inputRut, { target: { value: "345678" } });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
      });
    }

    expect(screen.queryByText(/Hola, Persona/)).toBeNull();
  });
});
