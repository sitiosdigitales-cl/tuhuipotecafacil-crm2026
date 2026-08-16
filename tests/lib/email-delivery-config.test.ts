import { afterEach, describe, expect, it, vi } from "vitest";

const EMAIL = {
  to: "cliente@example.invalid",
  subject: "Aviso de prueba",
  html: "<p>Contenido</p>",
};

async function cargarEmail() {
  vi.resetModules();
  return import("@/lib/email");
}

describe("configuración de entrega de correo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("informa fallo en producción cuando no existe RESEND_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_SIMULATION", "");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { enviarEmail } = await cargarEmail();

    await expect(enviarEmail(EMAIL)).resolves.toBe(false);
  });

  it("no simula entregas por omisión durante desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_SIMULATION", "");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { enviarEmail } = await cargarEmail();

    await expect(enviarEmail(EMAIL)).resolves.toBe(false);
  });

  it("permite simulación local solo con habilitación explícita", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_SIMULATION", "true");
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { enviarEmail } = await cargarEmail();

    await expect(enviarEmail(EMAIL)).resolves.toBe(true);
  });
});
