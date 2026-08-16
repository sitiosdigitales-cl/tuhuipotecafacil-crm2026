import Link from "next/link";
import { Database, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { SectionCard, InfoRow } from "./config-section";

export function TabSistema() {
  return (
    <div className="space-y-5">
      <SectionCard title="Informacion del Sistema" icon={<Database size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Aplicacion" value="Next.js" />
          <InfoRow label="Base de Datos" value="PostgreSQL en Supabase" />
          <InfoRow label="Almacenamiento" value="Supabase Storage" />
          <InfoRow label="Runtime" value="Node.js 22" />
        </div>
      </SectionCard>

      <SectionCard title="Respaldo y Exportacion" icon={<Download size={16} className="text-emerald-500" />}>
        <div className="space-y-4">
          <p className="text-[11px] leading-5 text-slate-500">
            La exportacion de contingencia disponible incluye leads y documentos.
            Su estado y resultado se verifican en la pantalla de respaldos.
          </p>
          <Link
            href="/backups"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <Download size={14} /> Gestionar exportaciones <ExternalLink size={13} />
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Recuperacion" icon={<ShieldCheck size={16} className="text-blue-500" />}>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[11px] leading-5 text-blue-700">
            Una exportacion de la aplicacion no reemplaza el respaldo administrado
            de PostgreSQL, los archivos de Storage ni una prueba periodica de restauracion.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
