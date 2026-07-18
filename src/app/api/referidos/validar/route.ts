import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ valido: false, error: "Codigo requerido" });
  }

  // Validar formato del codigo (REF-XXX-XXXXXX)
  const formatoValido = /^REF-[A-Z]{3}-[A-Z0-9]{6}$/.test(codigo);
  
  if (!formatoValido) {
    return NextResponse.json({ valido: false, error: "Formato de codigo invalido" });
  }

  // En produccion, aqui se verificaria contra la base de datos
  // Por ahora, validamos el formato y asumimos que es valido
  return NextResponse.json({ valido: true, codigo });
}