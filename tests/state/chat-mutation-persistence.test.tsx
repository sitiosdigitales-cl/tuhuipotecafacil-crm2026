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

import { useChat } from "@/lib/hooks/useChat";

const mensajeExistente = {
  id: "mensaje-existente",
  conversacionId: "conversacion-uno",
  remitenteId: "usuario-uno",
  remitenteNombre: "Usuario Uno",
  contenido: "Original",
  tipo: "TEXTO",
  estado: "ENVIADO",
  creadoEn: "2026-08-16T00:00:00.000Z",
};

function respuestaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Harness() {
  const {
    mensajes,
    enviarMensaje,
    eliminarMensaje,
    reaccionarMensaje,
  } = useChat({
    conversacionId: "conversacion-uno",
    usuarioActualId: "usuario-uno",
    usuarioActualNombre: "Usuario Uno",
  });

  return (
    <div>
      <span data-testid="ids">
        {mensajes.map((mensaje) => mensaje.id).join(",")}
      </span>
      <span data-testid="contenidos">
        {mensajes.map((mensaje) => mensaje.contenido).join(",")}
      </span>
      <button
        type="button"
        onClick={() => void enviarMensaje("Nuevo").catch(() => undefined)}
      >
        Enviar
      </button>
      <button
        type="button"
        onClick={() =>
          void eliminarMensaje("mensaje-existente").catch(() => undefined)
        }
      >
        Eliminar
      </button>
      <button
        type="button"
        onClick={() =>
          void reaccionarMensaje("mensaje-existente", "👍").catch(
            () => undefined
          )
        }
      >
        Reaccionar
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

describe("persistencia de mensajes", () => {
  it("no muestra un mensaje cuando la API rechaza el envío", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        return respuestaJson({ success: false, error: "No enviado" }, 500);
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/mensajes",
        expect.objectContaining({ method: "POST" })
      )
    );
    expect(screen.getByTestId("ids").textContent).toBe("");
  });

  it("muestra el identificador confirmado por el servidor", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        return respuestaJson({
          success: true,
          data: { ...mensajeExistente, id: "mensaje-persistido", contenido: "Nuevo" },
        }, 201);
      }
      return respuestaJson({ success: true, data: [] });
    });

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("mensaje-persistido")
    );
  });

  it("mantiene el mensaje si eliminar o reaccionar falla", async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "DELETE" || init?.method === "PUT") {
        return respuestaJson({ success: false, error: "No guardado" }, 500);
      }
      return respuestaJson({ success: true, data: [mensajeExistente] });
    });

    render(<Harness />);
    await waitFor(() =>
      expect(screen.getByTestId("contenidos").textContent).toBe("Original")
    );

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Reaccionar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/mensajes/mensaje-existente",
        expect.objectContaining({ method: "DELETE" })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/mensajes/mensaje-existente",
        expect.objectContaining({ method: "PUT" })
      );
    });
    expect(screen.getByTestId("contenidos").textContent).toBe("Original");
  });

  it("conserva el texto del input cuando el envío no se confirma", () => {
    const inputSource = readFileSync(
      join(process.cwd(), "src/componentes/conversaciones/InputMensaje.tsx"),
      "utf8"
    );
    const areaSource = readFileSync(
      join(process.cwd(), "src/componentes/conversaciones/AreaChat.tsx"),
      "utf8"
    );

    expect(inputSource).toContain("const enviado = await onEnviar");
    expect(inputSource).toContain("if (enviado !== false)");
    expect(areaSource).toContain("No se pudo enviar el mensaje");
  });
});
