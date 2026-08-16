import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const inputSource = readFileSync(
  join(process.cwd(), "src/componentes/conversaciones/InputMensaje.tsx"),
  "utf8"
);
const areaSource = readFileSync(
  join(process.cwd(), "src/componentes/conversaciones/AreaChat.tsx"),
  "utf8"
);

describe("acciones disponibles en conversaciones", () => {
  it("muestra solo adjuntos que tengan persistencia implementada", () => {
    expect(inputSource).not.toContain('type="file"');
    expect(inputSource).not.toContain("handleFileSelect");
    expect(inputSource).not.toContain("Adjuntar archivo");
    expect(inputSource).not.toContain("Enviar imagen");
  });

  it("no ofrece acciones anunciadas solo como futuras", () => {
    expect(inputSource).not.toContain("Grabación de voz próximamente");
    expect(inputSource).not.toContain('title="Mensaje de voz"');
    expect(areaSource).not.toContain("Videollamada próximamente");
    expect(areaSource).not.toContain("Opciones de conversación próximamente");
    expect(areaSource).not.toContain('title="Videollamada"');
    expect(areaSource).not.toContain('title="Más opciones"');
  });
});
