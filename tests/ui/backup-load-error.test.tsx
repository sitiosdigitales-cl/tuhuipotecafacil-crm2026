import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import BackupsPage from "@/app/(dashboard)/backups/page";

describe("carga de respaldos", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "No se pudieron cargar los respaldos",
            success: false,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 500,
          }
        )
      )
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("distingue un fallo del servidor de una lista vacía", async () => {
    render(<BackupsPage />);

    expect(
      await screen.findByText("No se pudieron cargar los respaldos")
    ).toBeTruthy();
    expect(screen.queryByText("No hay respaldos disponibles")).toBeNull();
  });
});
