import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

import ComisionesPage from "@/app/(dashboard)/comisiones/page";

const comisionReal = {
  id: "comision-real-1",
  ejecutivoId: "usuario-real-1",
  ejecutivoNombre: "Ejecutivo de Prueba",
  mes: "Agosto",
  anio: 2026,
  creditosAprobados: 2,
  montoTotal: 100_000_000,
  tasaComision: 1.5,
  comisionTotal: 1_500_000,
  pagado: false,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("datos reales en la pantalla de comisiones", () => {
  beforeEach(() => {
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("muestra únicamente los registros entregados por la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [comisionReal] }))
    );

    render(<ComisionesPage />);

    expect(await screen.findByText("Ejecutivo de Prueba")).toBeTruthy();
    expect(screen.getByText("Agosto 2026")).toBeTruthy();
    expect(screen.getAllByText("$ 1.500.000").length).toBeGreaterThan(0);
    expect(screen.queryByText("María González")).toBeNull();
    expect(screen.queryByText("Andrés Pérez")).toBeNull();
    expect(screen.queryByText("12.345.678-5")).toBeNull();
  });

  it("persiste el cambio de estado antes de actualizar la interfaz", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [comisionReal] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ...comisionReal, pagado: true } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ComisionesPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Marcar pagada" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/comisiones/comision-real-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ pagado: true }),
        })
      );
    });
    expect(await screen.findByRole("button", { name: "Marcar pendiente" })).toBeTruthy();
    expect(toastSuccess).toHaveBeenCalledWith("Comisión marcada como pagada");
  });
});
