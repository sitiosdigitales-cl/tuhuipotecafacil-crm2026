import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, requireRole, unauthorized, forbidden } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Lead no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener lead" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el lead pertenece al cliente (si es CLIENTE)
    if (auth.rol === "CLIENTE") {
      const { data: lead } = await supabase.from("leads").select("email").eq("id", id).single();
      if (!lead || lead.email !== auth.email) {
        return forbidden();
      }
    }

    const updateData: Record<string, any> = {};

    // CLIENTE puede actualizar campos de perfil y datos financieros
    if (auth.rol === "CLIENTE") {
      if (body.nombre) updateData.nombre = body.nombre;
      if (body.apellido) updateData.apellido = body.apellido;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.telefono !== undefined) updateData.telefono = body.telefono;
      if (body.domicilioParticular !== undefined) updateData.domicilioparticular = body.domicilioParticular;
      if (body.comunaCiudad !== undefined) updateData.comunaciudad = body.comunaCiudad;
      // Datos personales extendidos
      if (body.cargasLegales !== undefined) updateData.cargaslegales = body.cargasLegales;
      if (body.estadoCivil !== undefined) updateData.estadocivil = body.estadoCivil;
      if (body.regimenMatrimonial !== undefined) updateData.regimenmatrimonial = body.regimenMatrimonial;
      if (body.fechaNacimiento !== undefined) updateData.fechanacimiento = body.fechaNacimiento;
      if (body.estudios !== undefined) updateData.estudios = body.estudios;
      if (body.profesion !== undefined) updateData.profesion = body.profesion;
      if (body.valorArriendo !== undefined) updateData.valorarriendo = body.valorArriendo;
      if (body.afp !== undefined) updateData.afp = body.afp;
      // Datos del empleador
      if (body.nombreEmpleador !== undefined) updateData.nombreempleador = body.nombreEmpleador;
      if (body.rutEmpresa !== undefined) updateData.rutfactura = body.rutEmpresa;
      if (body.fechaIngreso !== undefined) updateData.fechaingreso = body.fechaIngreso;
      if (body.cargo !== undefined) updateData.cargo = body.cargo;
      if (body.rentaLiquida !== undefined) updateData.rentaliquida = body.rentaLiquida;
      if (body.bancoAbonoRenta !== undefined) updateData.bancoabonorenta = body.bancoAbonoRenta;
      if (body.fechaPago !== undefined) updateData.fechapago = body.fechaPago;
      if (body.direccionLaboral !== undefined) updateData.direccionlaboral = body.direccionLaboral;
      if (body.comunaCiudadLaboral !== undefined) updateData.comunaciudadlaboral = body.comunaCiudadLaboral;
      if (body.telefonoLaboralFijo !== undefined) updateData.telefonolaboralfijo = body.telefonoLaboralFijo;
      if (body.emailLaboral !== undefined) updateData.emaillaboral = body.emailLaboral;
      if (body.otrosIngresos !== undefined) updateData.otrosingresos = body.otrosIngresos;
      // Situación financiera
      if (body.situacionLaboral) updateData.situacionLaboral = body.situacionLaboral;
      if (body.enDicom !== undefined) updateData.enDicom = body.enDicom;
      if (body.dicomDetalle !== undefined) updateData.dicomDetalle = body.dicomDetalle;
      if (body.rentaMensual !== undefined) updateData.rentaMensual = body.rentaMensual;
      if (body.complementarRenta !== undefined) updateData.complementarRenta = body.complementarRenta;
      if (body.tipoCredito !== undefined) updateData.tipoCredito = body.tipoCredito;
      if (body.cuentaPie !== undefined) updateData.cuentaPie = body.cuentaPie;
      if (body.montoSolicitado !== undefined) updateData.montoSolicitado = body.montoSolicitado;
      if (body.valorPropiedad !== undefined) updateData.valorPropiedad = body.valorPropiedad;
      if (body.pieDisponible !== undefined) updateData.pieDisponible = body.pieDisponible;
      if (body.banco !== undefined) updateData.banco = body.banco;
    } else {
      // Admin/Gerente/Agente pueden actualizar todo
      if (body.nombre) updateData.nombre = body.nombre;
      if (body.apellido) updateData.apellido = body.apellido;
      if (body.rut !== undefined) updateData.rut = body.rut;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.telefono !== undefined) updateData.telefono = body.telefono;
      if (body.origen) updateData.origen = body.origen;
      if (body.etapa) updateData.etapa = body.etapa;
      if (body.prioridad) updateData.prioridad = body.prioridad;
      if (body.nombreEjecutivo !== undefined) updateData.nombreEjecutivo = body.nombreEjecutivo;
      if (body.banco !== undefined) updateData.banco = body.banco;
      if (body.tipoCredito !== undefined) updateData.tipoCredito = body.tipoCredito;
      if (body.montoSolicitado !== undefined) updateData.montoSolicitado = body.montoSolicitado;
      if (body.valorPropiedad !== undefined) updateData.valorPropiedad = body.valorPropiedad;
      if (body.pieDisponible !== undefined) updateData.pieDisponible = body.pieDisponible;
      if (body.notas !== undefined) updateData.notas = body.notas;
      if (body.situacionLaboral) updateData.situacionLaboral = body.situacionLaboral;
      if (body.enDicom !== undefined) updateData.enDicom = body.enDicom;
      // Datos personales extendidos
      if (body.cargasLegales !== undefined) updateData.cargaslegales = body.cargasLegales;
      if (body.estadoCivil !== undefined) updateData.estadocivil = body.estadoCivil;
      if (body.regimenMatrimonial !== undefined) updateData.regimenmatrimonial = body.regimenMatrimonial;
      if (body.fechaNacimiento !== undefined) updateData.fechanacimiento = body.fechaNacimiento;
      if (body.estudios !== undefined) updateData.estudios = body.estudios;
      if (body.profesion !== undefined) updateData.profesion = body.profesion;
      if (body.domicilioParticular !== undefined) updateData.domicilioparticular = body.domicilioParticular;
      if (body.comunaCiudad !== undefined) updateData.comunaciudad = body.comunaCiudad;
      if (body.valorArriendo !== undefined) updateData.valorarriendo = body.valorArriendo;
      if (body.afp !== undefined) updateData.afp = body.afp;
      // Datos del empleador
      if (body.nombreEmpleador !== undefined) updateData.nombreempleador = body.nombreEmpleador;
      if (body.rutEmpresa !== undefined) updateData.rutfactura = body.rutEmpresa;
      if (body.fechaIngreso !== undefined) updateData.fechaingreso = body.fechaIngreso;
      if (body.cargo !== undefined) updateData.cargo = body.cargo;
      if (body.rentaLiquida !== undefined) updateData.rentaliquida = body.rentaLiquida;
      if (body.bancoAbonoRenta !== undefined) updateData.bancoabonorenta = body.bancoAbonoRenta;
      if (body.fechaPago !== undefined) updateData.fechapago = body.fechaPago;
      if (body.direccionLaboral !== undefined) updateData.direccionlaboral = body.direccionLaboral;
      if (body.comunaCiudadLaboral !== undefined) updateData.comunaciudadlaboral = body.comunaCiudadLaboral;
      if (body.telefonoLaboralFijo !== undefined) updateData.telefonolaboralfijo = body.telefonoLaboralFijo;
      if (body.emailLaboral !== undefined) updateData.emaillaboral = body.emailLaboral;
      if (body.otrosIngresos !== undefined) updateData.otrosingresos = body.otrosIngresos;
      if (body.dicomDetalle !== undefined) updateData.dicomDetalle = body.dicomDetalle;
      if (body.rentaMensual !== undefined) updateData.rentaMensual = body.rentaMensual;
      if (body.complementarRenta !== undefined) updateData.complementarRenta = body.complementarRenta;
      if (body.cuentaPie !== undefined) updateData.cuentaPie = body.cuentaPie;
    }

    updateData.actualizadoEn = new Date().toISOString();

    const { data, error } = await supabase
      .from("leads")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // CLIENTE no puede eliminar leads
  if (!requireRole(request, ["SUPER_ADMIN", "ADMIN", "GERENTE"])) return forbidden();
  try {
    const { id } = await params;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
