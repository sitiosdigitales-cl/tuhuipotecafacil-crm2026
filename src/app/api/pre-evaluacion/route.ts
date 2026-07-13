import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { enviarEmail } from "@/lib/email";

// POST /api/pre-evaluacion — Endpoint público para crear leads desde el simulador
// NO requiere auth (es un formulario público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nombre || !body.apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    if (!body.email) {
      return NextResponse.json({ success: false, error: "Email requerido" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    // Determinar situación laboral
    let sitLaboral = "DEPENDIENTE";
    if (body.situacionLaboral === "Independiente" || body.situacionLaboral === "INDEPENDIENTE") {
      sitLaboral = "INDEPENDIENTE";
    }

    // Crear lead en Supabase
    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: body.nombre.trim(),
        apellido: body.apellido.trim(),
        rut: body.rut || "",
        email: body.email.trim(),
        telefono: body.telefono || null,
        origen: "simulador_web",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        situacionLaboral: sitLaboral,
        enDicom: body.dicom === "Sí" || body.enDicom === true,
        tipoCredito: body.tipoCredito || null,
        montoSolicitado: body.montoSolicitado || null,
        banco: body.banco || null,
        notas: body.comentarios || null,
        edad: body.edad ? parseInt(body.edad) : null,
        complementarRenta: body.complementarRenta === "Sí",
        diasEnEtapa: 0,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error al crear lead pre-evaluación:", error);
      return NextResponse.json({ success: false, error: "Error al guardar" }, { status: 500 });
    }

    // Crear notificación en el CRM
    try {
      await supabase.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "lead",
        titulo: "Nueva pre-evaluación desde simulador",
        descripcion: `${body.nombre} ${body.apellido} completó la pre evaluación desde el simulador web`,
        leida: false,
        leadid: leadId,
        accionurl: `/leads/${leadId}`,
        creadoen: new Date().toISOString(),
      });
    } catch {
      // La notificación no es crítica
    }

    // Enviar email de notificación al equipo
    try {
      await enviarEmail({
        to: "contacto@tuhipotecafacil.cl",
        subject: `🏠 Nueva Pre Evaluación: ${body.nombre} ${body.apellido}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1E40AF; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">🏠 Nueva Pre Evaluación</h2>
              <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.8;">Desde el Simulador Web</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; font-size: 13px;">
                <tr><td style="padding: 8px 0; color: #64748b; width: 140px;"><strong>Nombre:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.nombre} ${body.apellido}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><strong>RUT:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.rut || "No informado"}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.email}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><strong>Teléfono:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.telefono || "No informado"}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><strong>Situación laboral:</strong></td><td style="padding: 8px 0; color: #0f172a;">${sitLaboral}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><strong>Tipo crédito:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.tipoCredito || "No especificado"}</td></tr>
                ${body.montoSolicitado ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Monto estimado:</strong></td><td style="padding: 8px 0; color: #0f172a;">$${body.montoSolicitado.toLocaleString("es-CL")}</td></tr>` : ""}
                ${body.banco ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Banco preferido:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.banco}</td></tr>` : ""}
                ${body.comentarios ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Comentarios:</strong></td><td style="padding: 8px 0; color: #0f172a;">${body.comentarios}</td></tr>` : ""}
              </table>
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center;">
                <a href="https://tuhuipotecafacil-crm2026.vercel.app/leads/${leadId}" style="display: inline-block; background: #1E40AF; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">Ver Lead en el CRM</a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error enviando email de notificación:", emailError);
      // El email no es crítico — el lead ya se creó
    }

    // Enviar email de confirmación al cliente
    try {
      await enviarEmail({
        to: body.email.trim(),
        subject: "¡Recibimos tu solicitud de pre evaluación! - TuHipotecaFacil.cl",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1E40AF, #2563EB); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">🏠 TuHipotecaFacil.cl</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">¡Hola ${body.nombre}!</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Hemos recibido tu solicitud de <strong>pre evaluación financiera</strong> de manera exitosa.
              </p>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Nuestro equipo de expertos analizará tu perfil y se pondrá en contacto contigo en las próximas <strong>24 horas hábiles</strong> para orientarte sobre las mejores alternativas de financiamiento.
              </p>
              <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #64748b; margin: 0;"><strong>Resumen de tu solicitud:</strong></p>
                <p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Tipo de crédito: <strong>${body.tipoCredito || "Crédito Hipotecario"}</strong></p>
                ${body.montoSolicitado ? `<p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Monto estimado: <strong>$${body.montoSolicitado.toLocaleString("es-CL")}</strong></p>` : ""}
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
                Si tienes alguna consulta, no dudes en escribirnos por WhatsApp al <strong>+56 9 6684 2168</strong>.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://wa.me/56966842168" style="display: inline-block; background: #25D366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">💬 Escribir por WhatsApp</a>
              </div>
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 15px;">
              © 2026 TuHipotecaFacil.cl — Todos los derechos reservados
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error enviando email al cliente:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Pre evaluación registrada correctamente",
      leadId,
    });

  } catch (err) {
    console.error("Error en pre-evaluación:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
