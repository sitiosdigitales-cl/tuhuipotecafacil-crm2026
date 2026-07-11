import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function insertStages() {
  const etapas = [
    { id: "NUEVO_LEAD", nombre: "Nuevo Lead", color: "#3B82F6", orden: 1, activa: true },
    { id: "CONTACTO_INICIAL", nombre: "Contacto Inicial", color: "#6366F1", orden: 2, activa: true },
    { id: "CONTACTADO", nombre: "Contactado", color: "#8B5CF6", orden: 3, activa: true },
    { id: "INTERESADO", nombre: "Interesado", color: "#A855F7", orden: 4, activa: true },
    { id: "CALIFICACION_COMERCIAL", nombre: "Calificación Comercial", color: "#D946EF", orden: 5, activa: true },
    { id: "DOCS_PENDIENTES", nombre: "Docs. Pendientes", color: "#F97316", orden: 6, activa: true },
    { id: "DOCS_COMPLETAS", nombre: "Docs. Completas", color: "#22C55E", orden: 7, activa: true },
    { id: "EVALUACION_BANCARIA", nombre: "Evaluación Bancaria", color: "#06B6D4", orden: 8, activa: true },
    { id: "PREAPROBADO", nombre: "Preaprobado", color: "#14B8A6", orden: 9, activa: true },
    { id: "APROBADO", nombre: "Aprobado", color: "#10B981", orden: 10, activa: true },
    { id: "FIRMA_DIGITAL", nombre: "Firma Digital", color: "#6366F1", orden: 11, activa: true },
    { id: "NOTARIA", nombre: "Notaría", color: "#8B5CF6", orden: 12, activa: true },
    { id: "CREDITO_PAGADO", nombre: "Crédito Pagado", color: "#22C55E", orden: 13, activa: true },
  ];

  const { error } = await supabase.from("pipeline_stages").insert(etapas);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("Etapas insertadas:", etapas.length);

  // Verificar
  const { data } = await supabase.from("pipeline_stages").select("*").order("orden", { ascending: true });
  console.log("Total en DB:", data ? data.length : 0);
}

insertStages();
