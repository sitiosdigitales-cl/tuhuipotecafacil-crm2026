import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { documentStoragePath } from "@/lib/document-storage";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { data: document, error: documentError } = await supabase
    .from("documentos")
    .select("archivourl, leadid")
    .eq("id", id)
    .single();
  if (documentError || !document) {
    return NextResponse.json(
      { success: false, error: "Documento no encontrado" },
      { status: 404 }
    );
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("email, asignadoa")
    .eq("id", document.leadid)
    .single();
  if (leadError || !lead || !puedeAccederLead(auth, lead)) return forbidden();

  const filePath = documentStoragePath(document.archivourl);
  if (!filePath) {
    return NextResponse.json(
      { success: false, error: "Archivo no disponible" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { success: false, error: "No se pudo abrir el archivo" },
      { status: 502 }
    );
  }

  let signedUrl: URL;
  try {
    signedUrl = new URL(data.signedUrl);
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo abrir el archivo" },
      { status: 502 }
    );
  }
  if (signedUrl.protocol !== "https:") {
    return NextResponse.json(
      { success: false, error: "No se pudo abrir el archivo" },
      { status: 502 }
    );
  }

  const response = NextResponse.redirect(signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
