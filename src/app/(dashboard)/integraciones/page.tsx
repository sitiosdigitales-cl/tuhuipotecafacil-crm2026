"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  Plug,
  Search,
  ShieldCheck,
  Unplug,
} from "lucide-react";

interface IntegracionPersistida {
  id: string;
  nombre: string;
  tipo: string;
  proveedor?: string | null;
  estado: string;
  ultimaSync?: string | null;
  syncCount?: number | null;
  errores?: number | null;
  creadoEn?: string | null;
}

interface RespuestaIntegraciones {
  success: boolean;
  data?: IntegracionPersistida[];
}

const ESTADOS_ACTIVOS = new Set(["ACTIVA", "ACTIVO", "CONECTADA"]);

export default function IntegracionesPage() {
  const [integraciones, setIntegraciones] = useState<IntegracionPersistida[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarIntegraciones() {
      try {
        const response = await fetch("/api/integraciones", {
          credentials: "include",
        });
        const payload = (await response.json().catch(() => null)) as
          | RespuestaIntegraciones
          | null;

        if (!response.ok || !payload?.success || !payload.data) {
          throw new Error("No se pudo cargar el inventario");
        }

        if (!cancelado) setIntegraciones(payload.data);
      } catch {
        if (!cancelado) setErrorCarga(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargarIntegraciones();
    return () => {
      cancelado = true;
    };
  }, []);

  const integracionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-CL");
    if (!termino) return integraciones;

    return integraciones.filter((integracion) =>
      [
        integracion.nombre,
        integracion.tipo,
        integracion.proveedor || "",
        integracion.estado,
      ].some((valor) => valor.toLocaleLowerCase("es-CL").includes(termino))
    );
  }, [busqueda, integraciones]);

  const activas = integraciones.filter((integracion) =>
    ESTADOS_ACTIVOS.has(integracion.estado.toLocaleUpperCase("es-CL"))
  ).length;

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Plug size={20} />
              <h1 className="text-xl font-bold tracking-tight">Integraciones</h1>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-blue-100">
              Inventario persistido de conexiones registradas por el equipo.
              Esta vista no recibe ni muestra credenciales.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <Resumen
              etiqueta="Registradas"
              valor={integraciones.length}
              icono={<Database size={15} />}
            />
            <Resumen
              etiqueta="Activas"
              valor={activas}
              icono={<CheckCircle2 size={15} />}
            />
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="text-xs font-bold text-blue-900">
                Inventario de solo lectura
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80">
                La configuración de proveedores y secretos se realiza en sus
                paneles autorizados y en el gestor de variables del entorno.
                Una fila registrada no reemplaza una prueba real en staging.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-xs font-bold text-amber-900">
                WordPress y servicios externos
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800/80">
                El conector WordPress vive en `wordpress/` y usa el webhook del
                servidor. Las verificaciones de Resend, WhatsApp y respaldos se
                ejecutan con datos sintéticos antes de habilitarlas en producción.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Conexiones registradas
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Estado informado por la tabla `integraciones`.
            </p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar integración</span>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre, tipo o estado"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>
        </div>

        {cargando ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-slate-500">
            <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-b-blue-600" />
            Cargando inventario...
          </div>
        ) : errorCarga ? (
          <EstadoVacio
            icono={<AlertCircle size={20} />}
            titulo="No se pudo cargar el inventario"
            detalle="Revisa la sesión y vuelve a intentar. No se muestra un catálogo alternativo local."
          />
        ) : integracionesFiltradas.length === 0 ? (
          <EstadoVacio
            icono={<Unplug size={20} />}
            titulo={integraciones.length === 0 ? "Sin integraciones registradas" : "Sin coincidencias"}
            detalle={
              integraciones.length === 0
                ? "Registra una conexión solo después de configurarla y comprobarla en un entorno controlado."
                : "Prueba con otro nombre, proveedor, tipo o estado."
            }
          />
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integracionesFiltradas.map((integracion) => (
              <TarjetaIntegracion key={integracion.id} integracion={integracion} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Resumen({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: number;
  icono: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between text-blue-100">
        <span className="text-[9px] font-bold uppercase tracking-wide">{etiqueta}</span>
        {icono}
      </div>
      <p className="mt-1 text-xl font-bold text-white">{valor}</p>
    </div>
  );
}

function TarjetaIntegracion({
  integracion,
}: {
  integracion: IntegracionPersistida;
}) {
  const activa = ESTADOS_ACTIVOS.has(
    integracion.estado.toLocaleUpperCase("es-CL")
  );
  const ultimaSincronizacion = formatearFecha(integracion.ultimaSync);

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Plug size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-slate-800">
              {integracion.nombre}
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              {integracion.proveedor || integracion.tipo}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
            activa
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {integracion.estado}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <Dato etiqueta="Tipo" valor={integracion.tipo} />
        <Dato
          etiqueta="Sincronizaciones"
          valor={String(integracion.syncCount ?? 0)}
        />
        <Dato
          etiqueta="Errores registrados"
          valor={String(integracion.errores ?? 0)}
        />
        <Dato
          etiqueta="Última sincronización"
          valor={ultimaSincronizacion}
          icono={<Clock3 size={11} />}
        />
      </dl>
    </article>
  );
}

function Dato({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: string;
  icono?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-medium text-slate-400">{etiqueta}</dt>
      <dd className="mt-1 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-700">
        {icono}
        {valor}
      </dd>
    </div>
  );
}

function EstadoVacio({
  icono,
  titulo,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
}) {
  return (
    <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        {icono}
      </span>
      <h3 className="mt-3 text-xs font-bold text-slate-700">{titulo}</h3>
      <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">
        {detalle}
      </p>
    </div>
  );
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Sin registro";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "Sin registro";
  return parsed.toLocaleDateString("es-CL");
}
