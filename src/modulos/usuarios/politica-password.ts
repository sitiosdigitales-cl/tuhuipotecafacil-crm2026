export const PASSWORD_MIN_CHARACTERS = 15;
export const PASSWORD_MAX_CHARACTERS = 64;
const BCRYPT_MAX_BYTES = 72;

export function obtenerErrorPoliticaPassword(password: string): string | null {
  const characters = Array.from(password).length;
  if (characters < PASSWORD_MIN_CHARACTERS) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_CHARACTERS} caracteres`;
  }
  if (characters > PASSWORD_MAX_CHARACTERS) {
    return `La contraseña no puede superar ${PASSWORD_MAX_CHARACTERS} caracteres`;
  }
  if (new TextEncoder().encode(password).byteLength > BCRYPT_MAX_BYTES) {
    return "La contraseña supera el tamaño seguro permitido";
  }
  return null;
}
