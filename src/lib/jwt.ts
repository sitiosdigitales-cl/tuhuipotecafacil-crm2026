import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "24h";

// Se resuelve en cada llamada, no en el ambito de modulo: lanzar al importar
// romperia `next build`, que corre sin variables de entorno.
function obtenerSecreto(): string {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error(
      "JWT_SECRET no esta configurada. La autenticacion no puede operar sin ella."
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
  return jwt.sign(payload, obtenerSecreto(), { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): TokenPayload | null {
  // Fuera del try a proposito: un secreto ausente es un error de configuracion
  // del servidor y debe propagarse como 500, no confundirse con un token
  // invalido, que es 401.
  const secreto = obtenerSecreto();
  try {
    return jwt.verify(token, secreto) as TokenPayload;
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
