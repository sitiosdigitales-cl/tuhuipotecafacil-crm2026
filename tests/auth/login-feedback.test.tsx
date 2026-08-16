import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

import AuthLayout from "@/app/(auth)/layout";
import LoginPage from "@/app/(auth)/login/page";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function renderLogin() {
  render(
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}

async function submitLogin() {
  fireEvent.change(screen.getByLabelText("Correo Electrónico"), {
    target: { value: "persona@example.invalid" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "credencial-de-prueba" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
}

describe("respuesta visible del login", () => {
  beforeEach(() => routerPush.mockReset());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("muestra el bloqueo temporal comunicado por la API", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/auth/me") {
        return jsonResponse({ success: false, error: "No autenticado" }, 401);
      }
      return jsonResponse(
        {
          success: false,
          error: "Cuenta bloqueada temporalmente por intentos fallidos",
        },
        429
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    renderLogin();

    await submitLogin();

    expect(
      await screen.findByText("Cuenta bloqueada temporalmente por intentos fallidos")
    ).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("lleva una sesión CLIENTE directamente a su portal", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/auth/me") {
        return jsonResponse({ success: false, error: "No autenticado" }, 401);
      }
      return jsonResponse({
        success: true,
        data: {
          usuario: {
            id: "cliente-uno",
            nombre: "Cliente",
            apellido: "Prueba",
            email: "persona@example.invalid",
            rol: "CLIENTE",
          },
        },
      }, 200);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderLogin();

    await submitLogin();

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/portal-cliente"));
  });

  it.each(["MFA_ENROLL_REQUIRED", "MFA_CHALLENGE_REQUIRED"])(
    "lleva %s a la verificación en dos pasos",
    async (code) => {
      const fetchMock = vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "/api/auth/me") {
          return jsonResponse({ success: false, error: "No autenticado" }, 401);
        }
        return jsonResponse(
          {
            success: false,
            code,
            error: "Completa la verificación en dos pasos para continuar.",
          },
          202,
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      renderLogin();

      await submitLogin();

      await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/mfa"));
    },
  );
});
