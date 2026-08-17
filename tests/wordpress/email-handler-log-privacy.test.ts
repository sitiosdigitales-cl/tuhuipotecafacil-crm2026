import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const handler = readFileSync(
  join(process.cwd(), "wordpress/email-handler.php"),
  "utf8",
);

describe("registro operacional del piping de correo", () => {
  it("no persiste datos del mensaje ni la respuesta del CRM", () => {
    expect(handler).not.toContain('logMessage("From:');
    expect(handler).not.toContain('logMessage("Subject:');
    expect(handler).not.toContain('logMessage("To:');
    expect(handler).not.toContain('logMessage("Data:');
    expect(handler).not.toContain('{$response}');
  });

  it("crea el log con permisos privados y escritura serializada", () => {
    expect(handler).toContain("umask(0077)");
    expect(handler).toContain("FILE_APPEND | LOCK_EX");
    expect(handler).toContain("chmod($LOG_FILE, 0600)");
  });

  it("mantiene el flujo CLI sin una llamada obsoleta en PHP 8.5", () => {
    expect(handler).toContain('file_get_contents("php://stdin")');
    expect(handler).not.toContain("curl_close(");
  });
});
