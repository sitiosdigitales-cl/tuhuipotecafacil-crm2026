import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { crearEmailDesdeTemplate } from "@/lib/email";
import { escapeHtml, safeHttpUrl, sanitizeEmailHeader } from "@/lib/html-output";

describe("salida dinámica en HTML y correo", () => {
  it("convierte caracteres de marcado antes de insertarlos en HTML", () => {
    expect(escapeHtml(`<img src="x" onerror='alert(1)'>&`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;"
    );
  });

  it("limpia saltos de línea de asuntos de correo", () => {
    expect(sanitizeEmailHeader("Solicitud\r\nBcc: copia@example.invalid")).toBe(
      "Solicitud Bcc: copia@example.invalid"
    );
  });

  it("solo permite enlaces HTTP o HTTPS en atributos", () => {
    expect(safeHttpUrl("https://crm.example/leads/uno?a=1&b=2")).toBe(
      "https://crm.example/leads/uno?a=1&amp;b=2"
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBe("#");
  });

  it("mantiene el marcado de la plantilla y codifica sus datos", () => {
    const email = crearEmailDesdeTemplate("recordatorio", {
      asunto: "Seguimiento\r\nBcc: copia@example.invalid",
      fecha: "Mañana <script>",
      mensaje: "Revisar <img src=x>",
      nombre: "Cliente <b>Uno</b>",
    });

    expect(email).not.toBeNull();
    expect(email?.contenido).toContain("<div");
    expect(email?.contenido).toContain("Cliente &lt;b&gt;Uno&lt;/b&gt;");
    expect(email?.contenido).toContain("Revisar &lt;img src=x&gt;");
    expect(email?.contenido).not.toContain("<img src=x>");
    expect(email?.asunto).not.toMatch(/[\r\n]/);
  });

  it("crea la lista de documentos sin confiar en HTML recibido", () => {
    const email = crearEmailDesdeTemplate("documentosPendientes", {
      documentos: ["Liquidación <script>", "Cédula"],
      nombre: "Cliente",
      urlPortal: "https://crm.example/portal?lead=uno&vista=documentos",
    });

    expect(email?.contenido).toContain("<li>Liquidación &lt;script&gt;</li>");
    expect(email?.contenido).not.toContain("<li>Liquidación <script></li>");
    expect(email?.contenido).toContain(
      'href="https://crm.example/portal?lead=uno&amp;vista=documentos"'
    );
  });

  it("el resumen público usa nodos de texto y no HTML dinámico", () => {
    const source = readFileSync(
      join(process.cwd(), "public/formulario-leads.html"),
      "utf8"
    );
    const summary = source.slice(
      source.indexOf("function generateSummary"),
      source.indexOf("function showError")
    );

    expect(summary).toContain("textContent");
    expect(summary).not.toContain("innerHTML");
  });
});
