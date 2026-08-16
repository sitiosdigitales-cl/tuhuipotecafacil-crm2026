import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const APP_ROOT = join(process.cwd(), "src/app");
const API_ROOT = join(APP_ROOT, "api");
const METODOS_HTTP = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
const GUARDIAS_SESION = new Set([
  "authenticateRequest",
  "requireAuth",
  "requireRole",
  "recuperarContextoMfa",
  "verificarToken",
]);
const GUARDIAS_ASINCRONAS = new Set([
  "requireAuth",
  "requireRole",
  "recuperarContextoMfa",
]);

const EXCEPCIONES_SIN_SESION = new Map<string, string>([
  ["/api/auth/login#POST", "inicia la sesión"],
  ["/api/auth/logout#POST", "elimina las cookies de sesión"],
  ["/api/backup#POST", "usa la clave del proceso automático"],
  ["/api/backup#DELETE", "usa la clave del proceso automático"],
  ["/api/backup/cron#GET", "usa CRON_SECRET de Vercel"],
  ["/api/cmf/rates#GET", "publica tasas de mercado"],
  ["/api/cmf/rates/history#GET", "publica tasas históricas"],
  ["/api/cmf/status#GET", "publica el estado del servicio CMF"],
  ["/api/pre-evaluacion#POST", "recibe el formulario público"],
  ["/api/referidos/registrar#POST", "recibe el formulario público"],
  ["/api/referidos/validar#GET", "valida códigos del formulario público"],
  ["/api/webhook/email#GET", "informa el estado del webhook"],
  ["/api/webhook/email#POST", "verifica la firma del proveedor"],
  ["/api/webhook/leads#GET", "informa el estado del webhook"],
  ["/api/webhook/leads#POST", "usa el secreto del formulario externo"],
  ["/api/webhook/whatsapp#GET", "verifica el token de Meta"],
  ["/api/webhook/whatsapp#POST", "verifica la firma de Meta"],
]);

interface RouteHandler {
  id: string;
  guardias: string[];
  guardiasSinAwait: string[];
}

function listarRoutes(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return listarRoutes(ruta);
    return entrada.name === "route.ts" ? [ruta] : [];
  });
}

function obtenerLlamadas(nodo: ts.Node) {
  const llamadas = new Set<string>();
  const guardiasSinAwait = new Set<string>();

  function visitar(actual: ts.Node) {
    if (ts.isCallExpression(actual) && ts.isIdentifier(actual.expression)) {
      const nombre = actual.expression.text;
      llamadas.add(nombre);
      if (
        GUARDIAS_ASINCRONAS.has(nombre) &&
        !ts.isAwaitExpression(actual.parent)
      ) {
        guardiasSinAwait.add(nombre);
      }
    }
    ts.forEachChild(actual, visitar);
  }

  visitar(nodo);
  return { llamadas, guardiasSinAwait };
}

function obtenerHandlers(archivo: string): RouteHandler[] {
  const fuente = readFileSync(archivo, "utf8");
  const ast = ts.createSourceFile(
    archivo,
    fuente,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const ruta = `/${relative(APP_ROOT, dirname(archivo)).split(sep).join("/")}`;
  const handlers: RouteHandler[] = [];

  for (const nodo of ast.statements) {
    if (!ts.isFunctionDeclaration(nodo) || !nodo.name || !nodo.body) continue;
    if (!METODOS_HTTP.has(nodo.name.text)) continue;
    const exportado = nodo.modifiers?.some(
      (modificador) => modificador.kind === ts.SyntaxKind.ExportKeyword
    );
    if (!exportado) continue;

    const { llamadas, guardiasSinAwait } = obtenerLlamadas(nodo.body);
    handlers.push({
      id: `${ruta}#${nodo.name.text}`,
      guardias: [...GUARDIAS_SESION].filter((guardia) => llamadas.has(guardia)),
      guardiasSinAwait: [...guardiasSinAwait],
    });
  }

  return handlers;
}

const HANDLERS = listarRoutes(API_ROOT).sort().flatMap(obtenerHandlers);

describe("cobertura de sesión de endpoints", () => {
  it("mantiene vigentes las excepciones públicas o externas", () => {
    const ids = new Set(HANDLERS.map((handler) => handler.id));
    const excepcionesInexistentes = [...EXCEPCIONES_SIN_SESION.keys()].filter(
      (id) => !ids.has(id)
    );

    expect(excepcionesInexistentes).toEqual([]);
  });

  it("exige una comprobación de sesión a cada método no exceptuado", () => {
    const sinComprobacion = HANDLERS.filter(
      (handler) =>
        handler.guardias.length === 0 &&
        !EXCEPCIONES_SIN_SESION.has(handler.id)
    ).map((handler) => handler.id);

    expect(sinComprobacion).toEqual([]);
  });

  it("espera todas las comprobaciones asíncronas antes de usar sus claims", () => {
    const sinAwait = HANDLERS.flatMap((handler) =>
      handler.guardiasSinAwait.map((guardia) => `${handler.id}:${guardia}`)
    );

    expect(sinAwait).toEqual([]);
  });
});
