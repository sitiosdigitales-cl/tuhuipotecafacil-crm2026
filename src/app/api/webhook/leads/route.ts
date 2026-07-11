import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// Endpoint público para recibir leads desde formularios web (Elementor)

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => { body[key] = value; });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => { body[key] = value.toString(); });
    } else {
      try { body = await request.json(); } catch {
        const text = await request.text();
        const params = new URLSearchParams(text);
        params.forEach((value, key) => { body[key] = value; });
      }
    }

    console.log("Webhook recibido:", JSON.stringify(body, null, 2));

    // Mapear campos del formulario Elementor al CRM
    const nombre = body.nombre || body.first_name || body.Name || "";
    const apellido = body.apellido || body.last_name || body.Apellido || "";
    const rut = body.rut || body.Rut || body.RUT || "";
    const email = body.email || body["Correo Electrónico"] || body.correo || null;
    const telefono = body.telefono || body["Número de Teléfono"] || body.telefono || null;
    
    // Mapear situación laboral
    let situacionLaboral = "DEPENDIENTE";
    const situacionRaw = body["¿Cuál es tu situación laboral?"] || body.situacionLaboral || "";
    if (situacionRaw.toLowerCase().includes("independiente")) {
      situacionLaboral = "INDEPENDIENTE";
    }

    // Mapear DICOM
    let enDicom = false;
    const dicomRaw = body["¿Estás actualmente en DICOM?"] || body.enDicom || "";
    if (dicomRaw.toLowerCase().includes("sí") || dicomRaw.toLowerCase().includes("si")) {
      enDicom = true;
    }
    const dicomDetalle = body["Si estás en DICOM, ¿corresponde?"] || body.dicomDetalle || null;

    // Mapear renta
    const rentaMensual = body["¿Cuál es tu renta mensual apro..."] || body["¿Cuál es tu renta mensual aproximada?"] || body.rentaMensual || null;

    // Mapear complementar renta
    let complementarRenta = false;
    const complementarRaw = body["¿Deseas complementar renta?"] || body.complementarRenta || "";
    if (complementarRaw.toLowerCase().includes("sí") || complementarRaw.toLowerCase().includes("si")) {
      complementarRenta = true;
    }

    // Mapear tipo de crédito
    const tipoCredito = body["¿Qué tipo de crédito buscas?"] || body.tipoCredito || null;

    // Mapear cuenta pie
    let cuentaPie = false;
    const cuentaPieRaw = body["¿Cuentas con pie o ahorro inici..."] || body["¿Cuentas con pie o ahorro inicial?"] || body.cuentaPie || "";
    if (cuentaPieRaw.toLowerCase().includes("sí") || cuentaPieRaw.toLowerCase().includes("si")) {
      cuentaPie = true;
    }

    // Mapear comentarios
    const comentarios = body["Comentarios adicionales"] || body.comentarios || body.notas || null;

    if (!nombre && !apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre || "Sin nombre",
        apellido: apellido || "Sin apellido",
        rut: rut,
        email: email,
        telefono: telefono,
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        nombreEjecutivo: null,
        banco: null,
        tipoCredito: tipoCredito,
        montoSolicitado: null,
        valorPropiedad: null,
        pieDisponible: null,
        notas: comentarios,
        situacionLaboral: situacionLaboral,
        enDicom: enDicom,
        dicomDetalle: dicomDetalle,
        diasEnEtapa: 0,
        rentaMensual: rentaMensual,
        complementarRenta: complementarRenta,
        cuentaPie: cuentaPie,
        cargasLegales: null,
        estadoCivil: null,
        regimenMatrimonial: null,
        fechaNacimiento: null,
        estudios: null,
        profesion: null,
        domicilioParticular: null,
        comunaCiudad: null,
        valorArriendo: null,
        afp: null,
        nombreEmpleador: null,
        rutEmpresa: null,
        fechaIngreso: null,
        cargo: null,
        rentaLiquida: null,
        bancoAbonoRenta: null,
        fechaPago: null,
        direccionLaboral: null,
        comunaCiudadLaboral: null,
        telefonoLaboralFijo: null,
        emailLaboral: null,
        otrosIngresos: null,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("Lead creado:", data);
    return NextResponse.json({ success: true, data, message: "Lead creado" }, { status: 201 });
    
  } catch (error) {
    console.error("Error webhook:", error);
    return NextResponse.json({ success: false, error: "Error al procesar" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook activo" });
}
