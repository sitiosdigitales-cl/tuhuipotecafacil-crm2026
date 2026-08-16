import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "30m";
const JWT_ALGORITHM = "HS256";
const JWT_AUDIENCE = "tuhuipotecafacil-crm";
const JWT_ISSUER = "tuhuipotecafacil";
const JWT_SECRET_MIN_LENGTH = 32;

// Se resuelve en cada llamada, no en el ambito de modulo: lanzar al importar
// romperia `next build`, que corre sin variables de entorno.
function obtenerSecreto(): string {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      "JWT_SECRET debe estar configurada con al menos 32 caracteres. La autenticacion no puede operar con una clave debil."
    );
  }
  return secreto;
}

export interface TokenPayload {
  userId: string;
  email: string;
  rol: string;
}

export function generarToken(payload: TokenPayload): string {
  return jwt.sign(payload, obtenerSecreto(), {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });
}

export function verificarToken(token: string): TokenPayload | null {
  // Fuera del try a proposito: un secreto ausente es un error de configuracion
  // del servidor y debe propagarse como 500, no confundirse con un token
  // invalido, que es 401.
  const secreto = obtenerSecreto();
  try {
    const payload = jwt.verify(token, secreto, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });
    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.rol !== "string"
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function obtenerTokenDeRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookies = request.headers.get("cookie");
  if (cookies) {
    // Buscar auth_token o crm_token
    const tokenCookie = cookies.split(";").find((c) => {
      const name = c.trim().split("=")[0];
      return name === "auth_token" || name === "crm_token";
    });
    if (tokenCookie) {
      return tokenCookie.split("=").slice(1).join("=").trim() || null;
    }
  }

  return null;
}

export function authenticateRequest(request: Request): TokenPayload | null {
  const token = obtenerTokenDeRequest(request);
  if (!token) return null;
  return verificarToken(token);
}
