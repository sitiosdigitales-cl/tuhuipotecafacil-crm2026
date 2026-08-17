import { isUtf8 } from "node:buffer";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface HandlerExecution {
  exitCode: number | null;
  stderr: string;
  stdout: string;
}

function executeHandler(
  rawMessage: Buffer,
  webhookUrl: string,
  logFile: string,
): Promise<HandlerExecution> {
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
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolve({ exitCode, stderr, stdout });
    });
    child.stdin.end(rawMessage);
  });
}

function latin1Message(): Buffer {
  const headers = Buffer.from(
    [
      "From: Caso Latin1 <latin1@example.invalid>",
      "To: ventas@example.invalid",
      "Subject: Consulta hipotecaria",
      "Date: Mon, 17 Aug 2026 12:00:00 -0400",
      "Message-ID: <latin1-bug-140@example.invalid>",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=ISO-8859-1",
      "Content-Transfer-Encoding: 8bit",
      "",
      "",
    ].join("\r\n"),
    "ascii",
  );
  const body = Buffer.from(
    "Crédito para José Peña en Ñuñoa.\r\n",
    "latin1",
  );

  return Buffer.concat([headers, body]);
}

describe("codificación del correo recibido por piping", () => {
  it("envía JSON UTF-8 y conserva los acentos de un cuerpo Latin-1", async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "crm-email-handler-"),
    );
    let contentType = "";
    let requestBody: Buffer | undefined;
    const server = createServer((request, response) => {
      const chunks: Buffer[] = [];

      contentType = request.headers["content-type"] ?? "";
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
      const execution = await executeHandler(
        latin1Message(),
        `http://127.0.0.1:${port}/api/webhook/email`,
        join(temporaryDirectory, "handler.log"),
      );

      expect(execution.stderr).toBe("");
      expect(execution.exitCode).toBe(0);
      expect(execution.stdout).toBe("OK");
      expect(contentType).toContain("application/json");
      expect(requestBody).toBeDefined();
      expect(requestBody?.length).toBeGreaterThan(0);
      expect(isUtf8(requestBody as Buffer)).toBe(true);

      const payload = JSON.parse((requestBody as Buffer).toString("utf8")) as {
        text?: string;
      };
      expect(payload.text?.trim()).toBe("Crédito para José Peña en Ñuñoa.");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
