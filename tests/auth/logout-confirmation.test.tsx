import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function Probe() {
  const { isAuthenticated, logout } = useAuth();
  const cerrar = async () => {
    const success = await logout();
    document.body.dataset.logoutResult = success ? "ok" : "fallo";
  };

  return (
    <div>
      <span>{isAuthenticated ? "autenticada" : "sin sesión"}</span>
      <button type="button" onClick={() => void cerrar()}>Cerrar</button>
    </div>
  );
}

const sessionResponse = {
  success: true,
  data: {
    id: "usuario-1",
    nombre: "Persona",
    apellido: "Prueba",
    email: "persona@example.invalid",
    rol: "ADMIN",
  },
};

describe("confirmación del cierre de sesión", () => {
  afterEach(() => {
    cleanup();
    delete document.body.dataset.logoutResult;
    vi.unstubAllGlobals();
  });

  it("conserva el estado si el servidor no elimina la cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(sessionResponse))
        .mockResolvedValueOnce(jsonResponse({ success: false }, 500))
    );

    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText("autenticada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    await waitFor(() => expect(document.body.dataset.logoutResult).toBe("fallo"));
    expect(screen.getByText("autenticada")).toBeTruthy();
  });

  it("limpia el estado después de una respuesta correcta", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(sessionResponse))
        .mockResolvedValueOnce(jsonResponse({ success: true }))
    );

    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText("autenticada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(await screen.findByText("sin sesión")).toBeTruthy();
    expect(document.body.dataset.logoutResult).toBe("ok");
  });
});
