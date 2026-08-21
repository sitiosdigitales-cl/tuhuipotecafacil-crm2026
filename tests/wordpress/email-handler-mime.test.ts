import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface HandlerResult {
  exitCode: number | null;
  stderr: string;
  stdout: string;
}

function runHandler(
  message: Buffer,
  webhookUrl: string,
  logFile: string,
): Promise<HandlerResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("php", ["wordpress/email-handler.php"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CRM_EMAIL_LOG: logFile,
        CRM_EMAIL_WEBHOOK_SECRET: "secreto-sintetico",
        CRM_EMAIL_WEBHOOK_URL: webhookUrl,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stdin.on("error", () => undefined);
    child.once("error", reject);
    child.once("close", (exitCode) => resolve({ exitCode, stderr, stdout }));
    child.stdin.end(message);
  });
}

async function withWebhook(
  message: Buffer,
): Promise<{ payload: Record<string, string>; result: HandlerResult }> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "crm-email-mime-"));
  let requestBody: Buffer | undefined;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      requestBody = Buffer.concat(chunks);
      response.writeHead(204);
      response.end();
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address() as AddressInfo;
    const result = await runHandler(
      message,
      `http://127.0.0.1:${port}/api/webhook/email`,
      join(temporaryDirectory, "handler.log"),
    );
    expect(requestBody).toBeDefined();
    return {
      payload: JSON.parse(requestBody!.toString("utf8")) as Record<string, string>,
      result,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

function multipartMessage(): Buffer {
  const header = [
    "From: =?ISO-8859-1?Q?Jos=E9_Pe=F1a?= <jose@example.invalid>",
    "To: ventas@example.invalid",
    "Subject: =?ISO-8859-1?Q?Cr=E9dito_en_Nu=F1oa?=",
    "Date: Mon, 17 Aug 2026 12:00:00 -0400",
    "Message-ID: <mime-uno@example.invalid>",
    "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="outer-boundary"',
    "",
    "--outer-boundary",
    "Content-Type: text/plain; charset=ISO-8859-1",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "",
  ].join("\r\n");
  const body = Buffer.from("Cr=E9dito para Jos=E9 Pe=F1a en Nu=F1oa.", "ascii");
  const attachment = Buffer.from(
    [
      "",
      "--outer-boundary",
      'Content-Type: text/plain; name="datos.txt"',
      "Content-Transfer-Encoding: base64",
      'Content-Disposition: attachment; filename="datos.txt"',
      "",
      Buffer.from("ESTE ADJUNTO NO DEBE ENTRAR").toString("base64"),
      "--outer-boundary--",
      "",
    ].join("\r\n"),
    "ascii",
  );
  return Buffer.concat([Buffer.from(header, "ascii"), body, attachment]);
}

function htmlAlternativeMessage(): Buffer {
  const html = Buffer.from(
    "<p>Consulta <strong>hipotecaria</strong></p><p>Teléfono +56 9 1234 5678</p>",
    "utf8",
  ).toString("base64");
  return Buffer.from(
    [
      "From: Caso HTML <html@example.invalid>",
      "To: ventas@example.invalid",
      "Subject: Consulta",
      "Message-ID: <mime-dos@example.invalid>",
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="alt-boundary"',
      "",
      "--alt-boundary",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      html,
      "--alt-boundary--",
      "",
    ].join("\r\n"),
    "ascii",
  );
}

describe("correo MIME recibido por piping", () => {
  it("decodifica cabeceras y texto y excluye adjuntos", async () => {
    const { payload, result } = await withWebhook(multipartMessage());

    expect(result).toMatchObject({ exitCode: 0, stderr: "", stdout: "OK" });
    expect(payload.from).toBe("José Peña <jose@example.invalid>");
    expect(payload.subject).toBe("Crédito en Nuñoa");
    expect(payload.text).toBe("Crédito para José Peña en Nuñoa.");
    expect(payload.text).not.toContain("ADJUNTO");
    expect(payload.messageId).toBe("<mime-uno@example.invalid>");
  });

  it("usa texto limpio desde HTML cuando no existe text/plain", async () => {
    const { payload, result } = await withWebhook(htmlAlternativeMessage());

    expect(result.exitCode).toBe(0);
    expect(payload.text).toContain("Consulta hipotecaria");
    expect(payload.text).toContain("Teléfono +56 9 1234 5678");
    expect(payload.text).not.toContain("<strong>");
  });

  it("rechaza STDIN mayor a 1 MiB sin llamar al webhook", async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "crm-email-limit-"));
    let requests = 0;
    const server = createServer((_request, response) => {
      requests++;
      response.writeHead(204);
      response.end();
    });

    try {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const { port } = server.address() as AddressInfo;
      const logFile = join(temporaryDirectory, "handler.log");
      const message = Buffer.from(
        `From: limite@example.invalid\r\n\r\n${"x".repeat(1024 * 1024)}`,
        "ascii",
      );
      const result = await runHandler(
        message,
        `http://127.0.0.1:${port}/api/webhook/email`,
        logFile,
      );

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe("");
      expect(requests).toBe(0);
      expect(await readFile(logFile, "utf8")).toContain("supera el limite de 1 MiB");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
