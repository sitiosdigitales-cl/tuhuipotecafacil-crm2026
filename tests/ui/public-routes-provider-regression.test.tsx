import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ codigo: "REF-PRUEBA" }),
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import AuthLayout from "@/app/(auth)/layout";
import LoginPage from "@/app/(auth)/login/page";
import PortalClientePage from "@/app/portal-cliente/page";
import ReferirPage from "@/app/referir/[codigo]/page";
import SimuladorPublicoPage from "@/app/simulador-publico/page";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("rutas fuera del panel después de mover los providers", () => {
  beforeEach(() => {
    routerPush.mockReset();

    const storage = new Map<string, string>();
    storage.set("portal_welcome_lead-propio", "visto");
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("monta /login con el único contexto que consume", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: "Sin sesión", success: false }, 401)
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );

    expect(
      screen.getByRole("heading", { name: "Iniciar Sesión" })
    ).toBeTruthy();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
        credentials: "include",
      })
    );
  });

  it("monta /portal-cliente sin los providers del panel", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url === "/api/portal/mi-solicitud") {
        return jsonResponse({
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
          success: true,
        });
      }

      if (url === "/api/documentos?leadId=lead-propio") {
        return jsonResponse({ data: [], success: true });
      }

      throw new Error(`Petición inesperada: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PortalClientePage />);

    expect(await screen.findByText(/Hola, Persona/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/portal/mi-solicitud", {
      credentials: "include",
    });
  });

  it("monta /referir/[codigo] sin contextos del CRM", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ valido: true }))
    );

    render(<ReferirPage />);

    expect(await screen.findByText("Referido por un amigo")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Registrarme/ })).toBeTruthy();
  });

  it("monta /simulador-publico con los gráficos SVG", () => {
    render(<SimuladorPublicoPage />);

    expect(
      screen.getByRole("heading", {
        name: "Simulador de Crédito Hipotecario",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Calcular mi dividendo" })
    ).toBeTruthy();
  });
});
