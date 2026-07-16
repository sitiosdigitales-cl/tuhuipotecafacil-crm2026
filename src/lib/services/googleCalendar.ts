// Servicio de integración con Google Calendar y Google Meet
// Para usar en producción, se necesita configurar Google OAuth2

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: { email: string }[];
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  discoveryDocs: string[];
  scope: string;
}

// Configuración de Google Calendar API
export const GOOGLE_CONFIG: GoogleCalendarConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
};

// Estado de autenticación
let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: any = null;
let isAuthenticated = false;
let accessToken: string | null = null;

// Declaraciones de tipos para Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Cargar scripts de Google
export async function loadGoogleScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cargar GAPI
    if (!gapiLoaded && !document.getElementById("gapi-script")) {
      const gapiScript = document.createElement("script");
      gapiScript.id = "gapi-script";
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.onload = () => {
        gapiLoaded = true;
        checkAndResolve();
      };
      gapiScript.onerror = () => reject(new Error("Error loading GAPI"));
      document.head.appendChild(gapiScript);
    }

    // Cargar GIS
    if (!gisLoaded && !document.getElementById("gis-script")) {
      const gisScript = document.createElement("script");
      gisScript.id = "gis-script";
      gisScript.src = "https://accounts.google.com/gsi/client";
      gisScript.onload = () => {
        gisLoaded = true;
        checkAndResolve();
      };
      gisScript.onerror = () => reject(new Error("Error loading GIS"));
      document.head.appendChild(gisScript);
    }

    function checkAndResolve() {
      if (gapiLoaded && gisLoaded) {
        resolve();
      }
    }

    // Si ya están cargados
    if (gapiLoaded && gisLoaded) {
      resolve();
    }
  });
}

// Inicializar Google API
export async function initGoogleCalendar(): Promise<void> {
  await loadGoogleScripts();

  return new Promise((resolve) => {
    window.gapi.load("client", async () => {
      await window.gapi.client.init({
        apiKey: GOOGLE_CONFIG.apiKey,
        discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
      });

      // Inicializar token client
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scope,
        callback: (response: any) => {
          if (response.error) {
            console.error("Error de autenticación:", response);
            return;
          }
          accessToken = response.access_token;
          isAuthenticated = true;
          localStorage.setItem("google_access_token", response.access_token);
        },
      });

      // Verificar si ya hay token guardado
      const savedToken = localStorage.getItem("google_access_token");
      if (savedToken) {
        accessToken = savedToken;
        isAuthenticated = true;
      }

      resolve();
    });
  });
}

// Iniciar sesión con Google
export function signInWithGoogle(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tokenClient) {
      console.error("Token client no inicializado");
      resolve(false);
      return;
    }

    if (isAuthenticated && accessToken) {
      resolve(true);
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        console.error("Error de autenticación:", response);
        resolve(false);
        return;
      }
      accessToken = response.access_token;
      isAuthenticated = true;
      localStorage.setItem("google_access_token", response.access_token);
      resolve(true);
    };

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

// Cerrar sesión de Google
export function signOutGoogle(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log("Sesión de Google cerrada");
    });
  }
  accessToken = null;
  isAuthenticated = false;
  localStorage.removeItem("google_access_token");
}

// Verificar si está autenticado
export function isGoogleAuthenticated(): boolean {
  return isAuthenticated && !!accessToken;
}

// Obtener token de acceso
export function getAccessToken(): string | null {
  return accessToken;
}

// Crear evento en Google Calendar con Google Meet
export async function createGoogleCalendarEvent(event: {
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  emails?: string[];
  crearMeet?: boolean;
}): Promise<{ success: boolean; eventId?: string; meetLink?: string; calendarLink?: string }> {
  if (!isAuthenticated || !accessToken) {
    return { success: false };
  }

  const calendarEvent: GoogleCalendarEvent = {
    summary: event.titulo,
    description: event.descripcion,
    start: {
      dateTime: event.fechaInicio.toISOString(),
      timeZone: "America/Santiago",
    },
    end: {
      dateTime: event.fechaFin.toISOString(),
      timeZone: "America/Santiago",
    },
    attendees: event.emails?.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  // Agregar Google Meet si se solicita
  if (event.crearMeet) {
    calendarEvent.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    const data = await response.json();

    if (data.id) {
      // Construir link de Google Calendar
      const startStr = event.fechaInicio.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endStr = event.fechaFin.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.titulo)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(event.descripcion || "")}`;

      return {
        success: true,
        eventId: data.id,
        meetLink: data.hangoutLink,
        calendarLink,
      };
    }

    return { success: false };
  } catch (error) {
    console.error("Error al crear evento:", error);
    return { success: false };
  }
}

// Obtener eventos del Google Calendar
export async function getGoogleCalendarEvents(
  timeMin: Date,
  timeMax: Date
): Promise<any[]> {
  if (!isAuthenticated || !accessToken) {
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return [];
  }
}

// Eliminar evento de Google Calendar
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  if (!isAuthenticated || !accessToken) {
    return false;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return false;
  }
}

// Generar link de Google Meet directo
export function generateMeetLink(): string {
  return `https://meet.google.com/new`;
}

// Construir link de Google Calendar para compartir
export function buildCalendarShareLink(event: {
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
}): string {
  const startStr = event.fechaInicio.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const endStr = event.fechaFin.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.titulo,
    dates: `${startStr}/${endStr}`,
    details: event.descripcion || "",
  });

  if (event.ubicacion) {
    params.append("location", event.ubicacion);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
