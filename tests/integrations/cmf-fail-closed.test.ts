import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as getHistory } from "@/app/api/cmf/rates/history/route";
import { GET as getRate } from "@/app/api/cmf/rates/route";
import {
  obtenerEstadoCMF,
  obtenerTasaVigente,
} from "@/lib/cmf/service";

describe("integración oficial CMF", () => {
  it("no entrega tasas fijas cuando no existe integración oficial", async () => {
    await expect(obtenerTasaVigente(undefined, "UF")).rejects.toThrow(
      "integración oficial"
    );
    await expect(
      getRate(new Request("http://localhost/api/cmf/rates?moneda=UF"))
    ).resolves.toMatchObject({ status: 503 });
    await expect(
      getHistory(
        new Request("http://localhost/api/cmf/rates/history?meses=12")
      )
    ).resolves.toMatchObject({ status: 503 });
  });

  it("informa el servicio como sin datos", async () => {
    await expect(obtenerEstadoCMF()).resolves.toMatchObject({
      activo: false,
      estadoAPI: "SIN_DATOS",
      totalRegistros: 0,
    });
  });

  it("retira las tablas simuladas del código operativo", () => {
    const serviceSource = readFileSync(
      join(process.cwd(), "src/lib/cmf/service.ts"),
      "utf8"
    );
    const assistantSource = readFileSync(
      join(process.cwd(), "src/lib/ai/estadisticas.ts"),
      "utf8"
    );

    expect(serviceSource).not.toContain("TASAS_MOCK");
    expect(serviceSource).not.toContain("TASAS_POR_BANCO");
    expect(serviceSource).not.toContain("Fuente: CMF");
    expect(assistantSource).toContain("no usar estimaciones como datos oficiales");
  });
});
