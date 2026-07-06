export interface PWAConfig {
  // Apariencia
  nombreApp: string;
  shortName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  colorFondoSplash: string;
  darkMode: boolean;
  colorPrimarioDark: string;
  colorSecundarioDark: string;
  colorFondoDark: string;

  // Iconos
  icon192: string | null;
  icon512: string | null;
  maskableIcon: string | null;
  appleTouchIcon: string | null;
  favicon16: string | null;
  favicon32: string | null;
  screenshotWide: string | null;
  screenshotNarrow: string | null;

  // Splash
  splashLogo: string | null;
  splashDuracion: number;
  splashAnimacion: "fade" | "slide" | "none";

  // Tecnica
  displayMode: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  orientation: "portrait" | "landscape" | "any";
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  scope: string;
  descripcion: string;
  categorias: string[];

  // Service Worker
  cacheStrategy: "cache-first" | "network-first" | "stale-while-revalidate";
  offlineActivo: boolean;
  precacheUrls: string[];
  cacheVersion: string;
  pushNotifications: boolean;
  vapidKey: string;

  // Capacitor
  appId: string;
  appNameNativo: string;
  version: string;
  statusBarStyle: "light" | "dark" | "default";
  splashNativoDuracion: number;
  splashNativoColor: string;

  // Distribucion
  installBanner: boolean;
  shortcuts: Array<{
    name: string;
    shortName: string;
    url: string;
    icon: string | null;
  }>;
}

export const PWA_CONFIG_DEFAULT: PWAConfig = {
  nombreApp: "TuHipotecaFacil CRM",
  shortName: "THF CRM",
  logoUrl: null,
  faviconUrl: null,
  colorPrimario: "#3B82F6",
  colorSecundario: "#6366F1",
  colorFondoSplash: "#FFFFFF",
  darkMode: false,
  colorPrimarioDark: "#60A5FA",
  colorSecundarioDark: "#818CF8",
  colorFondoDark: "#0F172A",

  icon192: null,
  icon512: null,
  maskableIcon: null,
  appleTouchIcon: null,
  favicon16: null,
  favicon32: null,
  screenshotWide: null,
  screenshotNarrow: null,

  splashLogo: null,
  splashDuracion: 1500,
  splashAnimacion: "fade",

  displayMode: "standalone",
  orientation: "portrait",
  themeColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  startUrl: "/",
  scope: "/",
  descripcion: "CRM Hipotecario Inteligente - Gestion de creditos y clientes",
  categorias: ["finance", "business"],

  cacheStrategy: "cache-first",
  offlineActivo: true,
  precacheUrls: ["/", "/dashboard", "/pipeline", "/leads", "/clientes", "/documentos", "/tareas", "/offline.html"],
  cacheVersion: "v1",
  pushNotifications: false,
  vapidKey: "",

  appId: "cl.tuhuipotecafacil.crm",
  appNameNativo: "TuHipotecaFacil",
  version: "1.0.0",
  statusBarStyle: "dark",
  splashNativoDuracion: 2000,
  splashNativoColor: "#FFFFFF",

  installBanner: true,
  shortcuts: [
    { name: "Dashboard", shortName: "Dashboard", url: "/dashboard", icon: null },
    { name: "Pipeline", shortName: "Pipeline", url: "/pipeline", icon: null },
    { name: "Leads", shortName: "Leads", url: "/leads", icon: null },
    { name: "Clientes", shortName: "Clientes", url: "/clientes", icon: null },
  ],
};
