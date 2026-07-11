import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// Endpoint público para recibir leads desde formularios web (Elementor)

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();
    
    console.log("Content-Type:", contentType);
    console.log("Raw body:", rawBody);
    
    try {
      body = JSON.parse(rawBody);
    } catch {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => { body[key] = value; });
    }

    console.log("Parsed body:", JSON.stringify(body, null, 2));
    console.log("Body keys:", Object.keys(body));

    // Buscar campos por diferentes nombres posibles
    const findField = (...keys: string[]): string => {
      for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
          return String(body[key]);
        }
      }
      return "";
    };

    // Datos personales
    const nombre = findField("nombre", "first_name", "Name", "Nombre");
    const apellido = findField("apellido", "last_name", "Apellido");
    const rut = findField("rut", "Rut", "RUT");
    const email = findField("email", "Correo Electrónico", "correo");
    const telefono = findField("telefono", "Número de Teléfono", "teléfono");

    // Situación laboral
    const situacionRaw = findField("¿Cuál es tu situación laboral?", "situacionLaboral", "situacion_laboral");
    const situacionLaboral = situacionRaw.toLowerCase().includes("independiente") ? "INDEPENDIENTE" : "DEPENDIENTE";

    // DICOM
    const dicomRaw = findField("¿Estás actualmente en DICOM?", "enDicom", "dicom");
    const enDicom = dicomRaw.toLowerCase().includes("sí") || dicomRaw.toLowerCase().includes("si") || dicomRaw.toLowerCase().includes("yes");
    const dicomDetalle = findField("Si estás en DICOM, ¿corresponde?", "dicomDetalle", "dicom_detalle");

    // Renta
    const rentaMensual = findField("¿Cuál es tu renta mensual apro...", "¿Cuál es tu renta mensual aproximada?", "rentaMensual", "renta_mensual");

    // Complementar renta
    const complementarRaw = findField("¿Deseas complementar renta?", "complementarRenta", "complementar_renta");
    const complementarRenta = complementarRaw.toLowerCase().includes("sí") || complementarRaw.toLowerCase().includes("si") || complementarRaw.toLowerCase().includes("yes");

    // Tipo de crédito
    const tipoCredito = findField("¿Qué tipo de crédito buscas?", "tipoCredito", "tipo_credito");

    // Cuenta pie
    const cuentaPieRaw = findField("¿Cuentas con pie o ahorro inici...", "¿Cuentas con pie o ahorro inicial?", "cuentaPie", "cuenta_pie");
    const cuentaPie = cuentaPieRaw.toLowerCase().includes("sí") || cuentaPieRaw.toLowerCase().includes("si") || cuentaPieRaw.toLowerCase().includes("yes");

    // Comentarios
    const comentarios = findField("Comentarios adicionales", "comentarios", "notas", "mensaje");

    console.log("Campos mapeados:", { nombre, apellido, rut, email, telefono, situacionLaboral, enDicom, tipoCredito, cuentaPie, comentarios });

    if (!nombre && !apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos", received: body }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre || "Sin nombre",
        apellido: apellido || "Sin apellido",
        rut: rut,
        email: email || null,
        telefono: telefono || null,
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        nombreEjecutivo: null,
        banco: null,
        tipoCredito: tipoCredito || null,
        montoSolicitado: null,
        valorPropiedad: null,
        pieDisponible: null,
        notas: comentarios || null,
        situacionLaboral: situacionLaboral,
        enDicom: enDicom,
        dicomDetalle: dicomDetalle || null,
        diasEnEtapa: 0,
        rentaMensual: rentaMensual || null,
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
