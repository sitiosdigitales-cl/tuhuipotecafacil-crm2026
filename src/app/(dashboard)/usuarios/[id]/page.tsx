"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { useLeads } from "@/lib/contexts/LeadContext";
import { formatoMonedaAbreviado } from "@/lib/utils";
import {
  ESTADOS_USUARIO_CONFIG,
  ETAPAS_CONFIG,
  ROLES_CONFIG,
} from "@/tipos";
import type { EstadoUsuario, Etapa, Rol } from "@/tipos";

interface UsuarioApi {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  rol: Rol;
  estado: EstadoUsuario;
  cargo?: string | null;
  creadoEn?: string | Date | null;
}

type UsuarioDetalle = Omit<UsuarioApi, "creadoEn"> & {
  creadoEn: Date | null;
};

interface RespuestaUsuario {
  success: boolean;
  data?: UsuarioApi;
}

const ETAPAS_APROBADAS = new Set<Etapa>([
  "APROBADO",
  "FIRMA_DIGITAL",
  "NOTARIA",
  "CREDITO_PAGADO",
  "CLIENTE_FINALIZADO",
]);

const ETAPAS_CERRADAS = new Set<Etapa>([
  "CREDITO_PAGADO",
  "CLIENTE_FINALIZADO",
]);

function normalizarUsuario(usuario: UsuarioApi): UsuarioDetalle {
  const fecha = usuario.creadoEn ? new Date(usuario.creadoEn) : null;
  return {
    ...usuario,
    creadoEn: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
  };
}

export default function UsuarioPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { leads } = useLeads();
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarUsuario() {
      try {
        const response = await fetch(`/api/usuarios/${id}`, {
          credentials: "include",
        });
        const payload = (await response.json().catch(() => null)) as
          | RespuestaUsuario
          | null;

        if (!response.ok || !payload?.success || !payload.data) {
          throw new Error("No se pudo cargar el usuario");
        }

        if (!cancelado) setUsuario(normalizarUsuario(payload.data));
      } catch {
        if (!cancelado) setErrorCarga(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargarUsuario();
    return () => {
      cancelado = true;
    };
  }, [id]);

  const leadsAsignados = useMemo(() => {
    if (!usuario) return [];
    return leads.filter((lead) => lead.asignadoA === usuario.id);
  }, [leads, usuario]);

  const estadisticas = useMemo(() => {
    const total = leadsAsignados.length;
    const enGestion = leadsAsignados.filter(
      (lead) => !ETAPAS_CERRADAS.has(lead.etapa)
    ).length;
    const aprobados = leadsAsignados.filter((lead) =>
      ETAPAS_APROBADAS.has(lead.etapa)
    ).length;
    const montoSolicitado = leadsAsignados.reduce(
      (totalMonto, lead) => totalMonto + (lead.montoSolicitado || 0),
      0
    );
    const promedioSolicitado = total > 0 ? montoSolicitado / total : 0;

    return {
      total,
      enGestion,
      aprobados,
      montoSolicitado,
      promedioSolicitado,
    };
  }, [leadsAsignados]);

  const etapas = useMemo(() => {
    const conteo = leadsAsignados.reduce<Record<Etapa, number>>(
      (acumulado, lead) => {
        acumulado[lead.etapa] = (acumulado[lead.etapa] || 0) + 1;
        return acumulado;
      },
      {} as Record<Etapa, number>
    );

    return Object.entries(conteo)
      .map(([etapa, cantidad]) => ({
        etapa: etapa as Etapa,
        cantidad,
        ...ETAPAS_CONFIG[etapa as Etapa],
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [leadsAsignados]);

  const bancos = useMemo(() => {
    const conteo = leadsAsignados.reduce<Record<string, number>>(
      (acumulado, lead) => {
        const banco = lead.banco?.trim() || "Sin banco registrado";
        acumulado[banco] = (acumulado[banco] || 0) + 1;
        return acumulado;
      },
      {}
    );

    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  }, [leadsAsignados]);

  if (cargando) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-blue-600" />
        <span className="ml-3 text-sm text-slate-500">Cargando usuario...</span>
      </div>
    );
  }

  if (errorCarga || !usuario) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Users size={22} className="text-slate-400" />
        </div>
        <h1 className="text-base font-bold text-slate-800">
          No fue posible cargar el usuario
        </h1>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          La cuenta no existe o tu rol no permite consultar este perfil.
        </p>
        <button
          type="button"
          onClick={() => router.push("/usuarios")}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Volver a usuarios
        </button>
      </div>
    );
  }

  const rol = ROLES_CONFIG[usuario.rol];
  const estado = ESTADOS_USUARIO_CONFIG[usuario.estado];
  const maximoEtapa = Math.max(...etapas.map((item) => item.cantidad), 1);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/usuarios")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft size={14} /> Volver a usuarios
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-900 text-2xl font-bold text-white shadow-lg">
                {usuario.nombre[0]}
                {usuario.apellido[0]}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                  {usuario.nombre} {usuario.apellido}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${rol.color}`}>
                    {rol.label}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estado.color}`}>
                    {estado.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:max-w-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Vista informativa
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-blue-700/80">
                Muestra datos persistidos. La edición administrativa se realiza
                desde el listado de usuarios cuando el rol lo permite.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DatoCuenta
              icono={<Mail size={15} />}
              etiqueta="Email"
              valor={usuario.email}
              href={`mailto:${usuario.email}`}
            />
            <DatoCuenta
              icono={<Phone size={15} />}
              etiqueta="Teléfono"
              valor={usuario.telefono || "No disponible para este rol"}
              href={usuario.telefono ? `tel:${usuario.telefono}` : undefined}
            />
            <DatoCuenta
              icono={<BriefcaseBusiness size={15} />}
              etiqueta="Cargo"
              valor={usuario.cargo || "No registrado"}
            />
            <DatoCuenta
              icono={<CalendarDays size={15} />}
              etiqueta="Miembro desde"
              valor={usuario.creadoEn?.toLocaleDateString("es-CL") || "No disponible"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metrica
          etiqueta="Leads asignados"
          valor={String(estadisticas.total)}
          detalle="por identificador de usuario"
          icono={<UserRound size={16} />}
          color="blue"
        />
        <Metrica
          etiqueta="En gestión"
          valor={String(estadisticas.enGestion)}
          detalle="sin etapa de cierre"
          icono={<Users size={16} />}
          color="indigo"
        />
        <Metrica
          etiqueta="Aprobados"
          valor={String(estadisticas.aprobados)}
          detalle="aprobación o etapa posterior"
          icono={<CheckCircle2 size={16} />}
          color="emerald"
        />
        <Metrica
          etiqueta="Monto solicitado"
          valor={formatoMonedaAbreviado(estadisticas.montoSolicitado)}
          detalle="suma de la cartera"
          icono={<CircleDollarSign size={16} />}
          color="amber"
        />
        <Metrica
          etiqueta="Solicitud promedio"
          valor={formatoMonedaAbreviado(estadisticas.promedioSolicitado)}
          detalle="por lead asignado"
          icono={<CircleDollarSign size={16} />}
          color="violet"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Leads asignados</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Cartera vinculada a la cuenta mediante su identificador estable.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
              {leadsAsignados.length}
            </span>
          </div>

          {leadsAsignados.length === 0 ? (
            <EstadoVacio texto="No hay leads vinculados a esta cuenta." />
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {leadsAsignados.slice(0, 12).map((lead) => {
                const etapa = ETAPAS_CONFIG[lead.etapa];
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => router.push(`/clientes/${lead.id}`)}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                      {lead.nombre[0]}
                      {lead.apellido[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {lead.nombre} {lead.apellido}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {lead.banco || "Sin banco registrado"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-800">
                        {formatoMonedaAbreviado(lead.montoSolicitado || 0)}
                      </p>
                      <p className="mt-0.5 text-[9px] font-medium" style={{ color: etapa.color }}>
                        {etapa.label}
                      </p>
                    </div>
                  </button>
                );
              })}
              {leadsAsignados.length > 12 && (
                <p className="pt-3 text-center text-[10px] text-slate-500">
                  Se muestran los primeros 12 registros.
                </p>
              )}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Cartera por etapa</h2>
            </div>
            {etapas.length === 0 ? (
              <EstadoVacio texto="Sin etapas para resumir." />
            ) : (
              <div className="mt-4 space-y-3">
                {etapas.map((item) => (
                  <div key={item.etapa}>
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="truncate font-medium text-slate-600">{item.label}</span>
                      <span className="font-bold text-slate-800">{item.cantidad}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: item.color,
                          width: `${(item.cantidad / maximoEtapa) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Distribución por banco</h2>
            {bancos.length === 0 ? (
              <EstadoVacio texto="Sin bancos para resumir." />
            ) : (
              <div className="mt-4 space-y-2.5">
                {bancos.map(([banco, cantidad]) => (
                  <div
                    key={banco}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                  >
                    <span className="truncate text-[11px] font-medium text-slate-600">{banco}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800">
                      {cantidad}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DatoCuenta({
  icono,
  etiqueta,
  valor,
  href,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  href?: string;
}) {
  const contenido = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icono}
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-700">
          {valor}
        </span>
      </span>
    </>
  );

  return href ? (
    <a href={href} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100">
      {contenido}
    </a>
  ) : (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
      {contenido}
    </div>
  );
}

const COLORES_METRICA = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
} as const;

function Metrica({
  etiqueta,
  valor,
  detalle,
  icono,
  color,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
  color: keyof typeof COLORES_METRICA;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${COLORES_METRICA[color]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-bold uppercase tracking-wide opacity-75">{etiqueta}</p>
        {icono}
      </div>
      <p className="mt-2 text-lg font-bold">{valor}</p>
      <p className="mt-0.5 text-[9px] font-medium opacity-70">{detalle}</p>
    </div>
  );
}

function EstadoVacio({ texto }: { texto: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[11px] text-slate-500">
      {texto}
    </div>
  );
}
