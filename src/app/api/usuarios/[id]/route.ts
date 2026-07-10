import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,telefono,rol,estado,ultimoacceso,creadoen")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

    const usuario = {
      id: data.id,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono,
      rol: data.rol,
      estado: data.estado,
      ultimoAcceso: data.ultimoacceso,
      creadoEn: data.creadoen,
    };

    return NextResponse.json({ success: true, data: usuario });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.nombre) updateData.nombre = body.nombre;
    if (body.apellido) updateData.apellido = body.apellido;
    if (body.email) updateData.email = body.email.toLowerCase();
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.rol) updateData.rol = body.rol;
    if (body.estado) updateData.estado = body.estado;

    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select("id,nombre,apellido,email,telefono,rol,estado,creadoen")
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft delete: cambiar estado a INACTIVO
    const { error } = await supabase
      .from("usuarios")
      .update(toSupabaseColumns({ estado: "INACTIVO" }))
      .eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
