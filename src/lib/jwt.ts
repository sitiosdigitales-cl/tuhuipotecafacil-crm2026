import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "24h";

if (!JWT_SECRET) {
  console.warn("Variable JWT_SECRET no configurada");
}

export interface TokenPayload {
  userId: string;
  email: string;
  rol: string;
}

export function generarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET || "fallback-secret", { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET || "fallback-secret") as TokenPayload;
    return decoded;
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
    const tokenCookie = cookies.split(";").find((c) => c.trim().startsWith("auth_token="));
    if (tokenCookie) {
      return tokenCookie.split("=")[1]?.trim() || null;
    }
  }

  return null;
}

export function authenticateRequest(request: Request): TokenPayload | null {
  const token = obtenerTokenDeRequest(request);
  if (!token) return null;
  return verificarToken(token);
}
