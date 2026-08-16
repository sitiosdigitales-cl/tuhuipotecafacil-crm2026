import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PreviewPlantilla } from "@/app/(dashboard)/plantillas/page";

describe("aislamiento de la vista previa de plantillas", () => {
  afterEach(cleanup);

  it("encierra el HTML almacenado en un iframe sin capacidades", () => {
    render(
      <PreviewPlantilla
        plantilla={{
          nombre: "Plantilla de prueba",
          tipo: "EMAIL",
          asunto: "Asunto",
          contenido: '<img src="https://example.invalid/pixel.png" onerror="window.parent.alert(1)"><form action="https://example.invalid"><button>Enviar</button></form>',
        }}
      />
    );

    const preview = screen.getByTitle("Vista previa de Plantilla de prueba");
    const source = preview.getAttribute("srcdoc") || "";

    expect(preview.getAttribute("sandbox")).toBe("");
    expect(preview.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(source).toContain("default-src 'none'");
    expect(source).toContain("<form");
    expect(document.querySelector("form")).toBeNull();
  });
});
