import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck, Users } from "lucide-react";

import { ROLES_CONFIG, type Rol } from "@/tipos";

const roles = (Object.entries(ROLES_CONFIG) as Array<
  [Rol, (typeof ROLES_CONFIG)[Rol]]
>).map(([id, config]) => ({ id, ...config }));

export default function PermisosPage() {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-6 text-white">
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-purple-200">
              <ShieldCheck size={18} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Control de acceso
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Roles del sistema</h1>
            <p className="mt-1 max-w-2xl text-[11px] font-medium leading-5 text-slate-300">
              Los permisos se validan en el proxy y en cada API. Esta pantalla es
              informativa: no existe un editor dinámico de permisos.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-300">{roles.length}</div>
            <div className="text-[10px] text-slate-400">Roles vigentes</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 shrink-0 text-amber-600" size={18} />
          <div>
            <h2 className="text-[12px] font-bold text-amber-800">
              La matriz no se modifica desde el navegador
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-amber-700">
              Cambiar el rol de una cuenta sí es una operación persistida y se
              realiza en Usuarios. Cambiar las capacidades de un rol requiere un
              cambio de código revisado y sus pruebas de regresión.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((rol) => (
          <article
            key={rol.id}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${rol.color}`}>
                {rol.label}
              </span>
              <ShieldCheck size={17} className="text-slate-300" />
            </div>
            <p className="text-[11px] leading-5 text-slate-500">{rol.descripcion}</p>
            <p className="mt-4 font-mono text-[10px] text-slate-400">{rol.id}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-soft sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-[12px] font-bold text-slate-800">Asignar roles a cuentas</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              La API de usuarios valida y persiste los cinco roles vigentes.
            </p>
          </div>
        </div>
        <Link
          href="/usuarios"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Administrar usuarios <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
