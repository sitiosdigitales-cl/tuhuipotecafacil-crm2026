function normalizedConfiguredUrl(value: string, production: boolean): string {
  const url = new URL(value);
  const localHttp =
    !production &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) {
    throw new Error("La URL de la aplicación no es válida");
  }

  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function applicationBaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string {
  const production = env.NODE_ENV === "production";
  const configured = env.APP_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return normalizedConfiguredUrl(configured, production);

  const vercelProductionHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionHost) {
    return normalizedConfiguredUrl(`https://${vercelProductionHost}`, production);
  }

  if (!production) return "http://localhost:3000/";
  throw new Error("No existe una URL productiva configurada para la aplicación");
}

export function portalClientUrl(env: NodeJS.ProcessEnv = process.env): string {
  return new URL("/portal-cliente", applicationBaseUrl(env)).toString();
}

export function applicationUrl(
  pathname: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) {
    throw new Error("La ruta interna de la aplicación no es válida");
  }

  return new URL(pathname, applicationBaseUrl(env)).toString();
}
