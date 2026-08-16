import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { router, routerReplace } = vi.hoisted(() => {
  const replace = vi.fn();
  return { router: { replace }, routerReplace: replace };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

import MfaPage from "@/app/(auth)/mfa/page";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

describe("pantalla MFA", () => {
  beforeEach(() => routerReplace.mockReset());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("enrola el autenticador y continúa solo después de verificar", async () => {
    const fetchMock = vi.fn(async (
      input: string | URL | Request,
      _init?: RequestInit,
    ) => {
      void _init;
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/auth/mfa/status") {
        return jsonResponse({ success: true, data: { mode: "enroll" } });
      }
      if (url === "/api/auth/mfa/enroll") {
        return jsonResponse({
          success: true,
          data: {
            factorId: "20000000-0000-4000-8000-000000000001",
            qrCode: "data:image/svg+xml;utf-8,synthetic-qr",
            secret: "SYNTHETICBASE32",
          },
        });
      }
      if (url === "/api/auth/mfa/verify") {
        return jsonResponse({
          success: true,
          data: { usuario: { rol: "ADMIN" } },
        });
      }
      throw new Error(`Ruta inesperada: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MfaPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Configurar autenticador" }),
    );

    expect(await screen.findByText("SYNTHETICBASE32")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Código de seis dígitos"), {
      target: { value: "123456" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Verificar y continuar" }),
    );

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/dashboard"));
    const verificationCall = fetchMock.mock.calls.find(
      ([input]) => input === "/api/auth/mfa/verify",
    );
    expect(verificationCall?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        factorId: "20000000-0000-4000-8000-000000000001",
        code: "123456",
      }),
    });
  });

  it("pide el código sin crear otro factor cuando ya existe", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        data: {
          mode: "challenge",
          factorId: "20000000-0000-4000-8000-000000000001",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<MfaPage />);

    expect(await screen.findByLabelText("Código de seis dígitos")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("vuelve al login cuando la sesión temporal expiró", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({ success: false, error: "Sesión expirada" }, 401)
    ));
    render(<MfaPage />);

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/login"));
  });
});
