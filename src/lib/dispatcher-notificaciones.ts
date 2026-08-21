/**
 * Dispatcher centralizado de notificaciones
 *
 * Resuelve el dueño del lead, consulta preferencias,
 * y envía notificaciones por los canales habilitados.
 */

import { getSupabaseAdmin } from "./supabase-admin";
import { supabase } from "./supabase";
import { crearEmailDesdeTemplate, enviarEmail } from "./email";
import { enviarMensajeWhatsApp, isWhatsAppConfigured } from "./whatsapp";
import { applicationUrl } from "./application-url";

export type EventoNotificacion =
  | "documento_subido"
  | "documento_estado"
  | "documento_version"
  | "lead_nuevo"
  | "lead_etapa"
  | "lead_asignado"
  | "tarea_asignada"
  | "tarea_vencida"
  | "tarea_completada"
  | "mensaje"
  | "sistema";

interface DespacharOpts {
  evento: EventoNotificacion;
  leadId?: string;
  titulo: string;
  descripcion: string;
  accionUrl?: string;
  usuarioIdDirecto?: string;
  datosEmail?: Record<string, string>;
}

interface PreferenciaNotificacion {
  canal: string;
  habilitado: boolean;
}

/**
 * Despacha una notificacion por todos los canales habilitados.
 * 1. Resuelve el usuario objetivo (dueno del lead o usuarioIdDirecto)
 * 2. Consulta preferencias del usuario
 * 3. Crea notificacion in-app si habilitado
 * 4. Envia email si habilitado
 */
export async function despacharNotificacion(opts: DespacharOpts): Promise<void> {
  try {
    const usuariosNotificados = new Set<string>();

    // 1. Resolver ejecutivo del lead
    let ejecutivoId = opts.usuarioIdDirecto || null;

    if (!ejecutivoId && opts.leadId) {
      const { data: lead } = await supabase
        .from("leads")
        .select("nombreejecutivo, nombre, apellido")
        .eq("id", opts.leadId)
        .single();

      if (lead?.nombreejecutivo) {
        const nombreBusqueda = "%" + lead.nombreejecutivo + "%";
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .ilike("nombre", nombreBusqueda)
          .limit(1)
          .single();

        if (usuario) {
          ejecutivoId = usuario.id;
        }
      }
    }

    // 2. Enviar al ejecutivo del lead
    if (ejecutivoId) {
      usuariosNotificados.add(ejecutivoId);
      await enviarNotificacionAUsuario(ejecutivoId, opts);
    }

    // 3. SIEMPRE enviar a todos los SUPER_ADMIN (evitar duplicados)
    const { data: superAdmins } = await supabase
      .from("usuarios")
      .select("id")
      .eq("rol", "SUPER_ADMIN");

    if (superAdmins) {
      for (const admin of superAdmins) {
        if (!usuariosNotificados.has(admin.id)) {
          usuariosNotificados.add(admin.id);
          await enviarNotificacionAUsuario(admin.id, opts);
        }
      }
    }

    // 4. Si no se pudo resolver ningun usuario, crear notificacion global
    if (usuariosNotificados.size === 0) {
      await crearNotificacionInApp({
        tipo: opts.evento,
        titulo: opts.titulo,
        descripcion: opts.descripcion,
        leadId: opts.leadId,
        accionUrl: opts.accionUrl,
      });
    }
  } catch (error) {
    console.error("Error en dispatcher de notificaciones:", error);
  }
}

/**
 * Envía notificación in-app, email y WhatsApp a un usuario específico
 */
async function enviarNotificacionAUsuario(
  usuarioId: string,
  opts: DespacharOpts
): Promise<void> {
  try {
    // Consultar preferencias del usuario
    const { data: prefs } = await supabase
      .from("preferencias_notificacion")
      .select("canal, habilitado")
      .eq("usuario_id", usuarioId)
      .eq("evento", opts.evento);

    const prefsMap = new Map<string, boolean>();
    const preferencias = (prefs || []) as PreferenciaNotificacion[];
    preferencias.forEach((preferencia) => {
      prefsMap.set(preferencia.canal, preferencia.habilitado);
    });

    // Si no hay preferencias configuradas, asumir todo habilitado
    const inAppHabilitado = prefsMap.has("in_app") ? prefsMap.get("in_app") : true;
    const emailHabilitado = prefsMap.has("email") ? prefsMap.get("email") : true;
    const whatsappHabilitado = prefsMap.has("whatsapp") ? prefsMap.get("whatsapp") : true;

    // Crear notificacion in-app
    if (inAppHabilitado) {
      await crearNotificacionInApp({
        tipo: opts.evento,
        titulo: opts.titulo,
        descripcion: opts.descripcion,
        usuarioId,
        leadId: opts.leadId,
        accionUrl: opts.accionUrl,
      });
    }

    // Enviar email
    if (emailHabilitado) {
      await enviarNotificacionEmail(usuarioId, opts);
    }

    // WhatsApp
    if (whatsappHabilitado && isWhatsAppConfigured()) {
      await enviarNotificacionWhatsApp(usuarioId, opts);
    }
  } catch (error) {
    console.error("Error enviando notificacion a usuario:", usuarioId, error);
  }
}

/**
 * Crea una notificacion in-app en la tabla notificaciones
 */
async function crearNotificacionInApp(opts: {
  tipo: string;
  titulo: string;
  descripcion: string;
  usuarioId?: string | null;
  leadId?: string | null;
  accionUrl?: string;
}): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("notificaciones").insert({
      id: crypto.randomUUID(),
      tipo: opts.tipo,
      titulo: opts.titulo,
      descripcion: opts.descripcion,
      leida: false,
      usuarioid: opts.usuarioId || null,
      leadid: opts.leadId || null,
      accionurl: opts.accionUrl || null,
      creadoen: new Date().toISOString(),
    });
    if (error) {
      console.error("Error creando notificacion in-app:", JSON.stringify(error));
    }
  } catch (error) {
    console.error("No se pudo crear la notificación interna:", error);
  }
}

/**
 * Envía notificación por email al usuario
 */
async function enviarNotificacionEmail(
  usuarioId: string,
  opts: DespacharOpts
): Promise<void> {
  try {
    // Obtener datos del usuario
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("email, nombre")
      .eq("id", usuarioId)
      .single();

    if (!usuario?.email) return;

    // Mapear evento a template de email
    const templateMap: Record<string, string> = {
      documento_subido: "notificacionDocumento",
      documento_estado: "notificacionDocumento",
      documento_version: "notificacionDocumento",
      lead_nuevo: "notificacionLead",
      lead_etapa: "notificacionLead",
      lead_asignado: "notificacionLead",
      tarea_asignada: "notificacionTarea",
      tarea_vencida: "notificacionTarea",
      tarea_completada: "notificacionTarea",
    };

    const templateName = templateMap[opts.evento];
    if (!templateName) return;

    const urlCompleta = opts.accionUrl ? applicationUrl(opts.accionUrl) : "";

    const email = crearEmailDesdeTemplate(templateName, {
      ...opts.datosEmail,
      nombre: usuario.nombre || "Usuario",
      evento: opts.titulo,
      descripcion: opts.descripcion,
      url: urlCompleta,
    });
    if (!email) return;

    await enviarEmail({
      to: usuario.email,
      subject: email.asunto,
      html: email.contenido,
    });
  } catch {
    // Silenciar errores de email
  }
}

/**
 * Envía notificación por WhatsApp al usuario
 */
async function enviarNotificacionWhatsApp(
  usuarioId: string,
  opts: DespacharOpts
): Promise<void> {
  try {
    // Obtener datos del usuario
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("telefono, nombre")
      .eq("id", usuarioId)
      .single();

    if (!usuario?.telefono) return;

    const urlCompleta = opts.accionUrl ? applicationUrl(opts.accionUrl) : "";

    let mensaje = `📋 *${opts.titulo}*\n${opts.descripcion}`;
    if (urlCompleta) {
      mensaje += `\n\n🔗 Ver más: ${urlCompleta}`;
    }

    await enviarMensajeWhatsApp({
      telefono: usuario.telefono,
      mensaje,
    });
  } catch {
    // Silenciar errores de WhatsApp
  }
}
