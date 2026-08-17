import { cleanup, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

import CanjeRecuperacionPage from "@/app/(auth)/recuperar-contrasena/canje/page";

describe("página de canje de recuperación", () => {
  beforeEach(() => {
    routerReplace.mockReset();
    window.history.replaceState(
      null,
      "",
      "/recuperar-contrasena/canje#token=token-sintetico",
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("borra el fragmento antes de canjearlo y lo usa una sola vez", async () => {
    const orden: string[] = [];
    const replaceStateReal = window.history.replaceState.bind(window.history);
    vi.spyOn(window.history, "replaceState").mockImplementation((data, unused, url) => {
      orden.push("fragmento-borrado");
      replaceStateReal(data, unused, url);
    });

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      orden.push("canje-posteado");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ token: "token-sintetico" }));
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StrictMode>
        <CanjeRecuperacionPage />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(routerReplace).toHaveBeenCalledWith("/recuperar-contrasena/nueva"),
    );

    expect(window.location.hash).toBe("");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(orden).toEqual(["fragmento-borrado", "canje-posteado"]);
  });

  it("limpia también un enlace sin token y no llama al callback", async () => {
    window.history.replaceState(null, "", "/recuperar-contrasena/canje#otro=valor");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CanjeRecuperacionPage />);

    await waitFor(() =>
      expect(routerReplace).toHaveBeenCalledWith(
        "/recuperar-contrasena?estado=invalido",
      ),
    );

    expect(window.location.hash).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
