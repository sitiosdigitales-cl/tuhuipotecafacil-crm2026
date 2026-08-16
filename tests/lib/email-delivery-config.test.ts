import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

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
  beforeEach(() => send.mockReset());

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

  it("informa fallo cuando el proveedor rechaza la entrega sin lanzar", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_clave_de_prueba");
    send.mockResolvedValue({
      data: null,
      error: { message: "entrega rechazada" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { enviarEmail } = await cargarEmail();

    await expect(enviarEmail(EMAIL)).resolves.toBe(false);
  });

  it("no copia el destinatario a los logs de una entrega aceptada", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_clave_de_prueba");
    send.mockResolvedValue({ data: { id: "email-uno" }, error: null });
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { enviarEmail } = await cargarEmail();

    await expect(enviarEmail(EMAIL)).resolves.toBe(true);
    expect(JSON.stringify(info.mock.calls)).not.toContain(EMAIL.to);
  });
});
