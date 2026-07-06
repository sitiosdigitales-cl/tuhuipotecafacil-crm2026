import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tuhipotecafacil-secret-key-2026";
const JWT_EXPIRES_IN = "24h";

export interface TokenPayload {
  userId: string;
  email: string;
  rol: string;
}

export function generarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function obtenerTokenDeRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // También buscar en cookies
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
