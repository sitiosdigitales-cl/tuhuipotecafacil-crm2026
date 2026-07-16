"use client";

import { useMemo, useState } from "react";
import {
  Building2, DollarSign, Users, CheckCircle, Clock,
  Phone, Mail, MessageSquare, Eye, Search, ChevronRight,
  FileText, Target, X,
} from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { useBancos } from "@/modulos/bancos";
import type { Banco } from "@/modulos/bancos";

export default function BancosPage() {
  const { leads } = useLeads();
  const { bancos, cargando } = useBancos();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [bancoSeleccionado, setBancoSeleccionado] = useState<Banco | null>(null);

  const bancosFiltrados = useMemo(() => {
    return bancos.filter((b) => {
      const coincideBusqueda = !busqueda || b.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || b.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [bancos, busqueda, filtroEstado]);

  const leadsPorBanco = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.banco) map[l.banco] = (map[l.banco] || 0) + 1;
    });
    return map;
  }, [leads]);

  const stats = useMemo(() => ({
    total: bancos.length,
    activos: bancos.filter((b) => b.estado === "ACTIVO").length,
    totalLeads: leads.length,
    leadsAsignados: leads.filter((l) => l.banco).length,
  }), [bancos, leads]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-sm text-slate-500">Cargando bancos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Bancos Aliados</h1>
              <p className="text-blue-100 text-[11px] font-medium">{stats.activos} bancos activos - {stats.leadsAsignados} leads asignados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bancos", value: stats.total, icon: <Building2 size={16} />, gradient: "from-blue-500 to-blue-600", color: "text-blue-600" },
          { label: "Activos", value: stats.activos, icon: <CheckCircle size={16} />, gradient: "from-emerald-500 to-teal-500", color: "text-emerald-600" },
          { label: "Leads Totales", value: stats.totalLeads, icon: <Users size={16} />, gradient: "from-purple-500 to-violet-500", color: "text-purple-600" },
          { label: "Leads Asignados", value: stats.leadsAsignados, icon: <Target size={16} />, gradient: "from-amber-500 to-orange-500", color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100/80 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>{stat.icon}</div>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar banco..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="flex gap-2">
            {["todos", "ACTIVO", "INACTIVO"].map((estado) => (
              <button key={estado} onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${filtroEstado === estado ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {estado === "todos" ? "Todos" : estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Bancos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bancosFiltrados.map((banco) => (
          <div key={banco.id} onClick={() => setBancoSeleccionado(banco)}
            className="bg-white rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
            {/* Header de la card */}
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md" style={{ backgroundColor: banco.color }}>
                    {banco.nombre[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{banco.nombre}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${banco.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {banco.estado}
                      </span>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{banco.convenio}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{banco.tasaBase}%</div>
                  <div className="text-[9px] text-slate-400">Tasa base</div>
                </div>
              </div>

              {/* Tasas */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-blue-500 font-medium">Preferencial</div>
                  <div className="text-xs font-bold text-blue-700">{banco.tasaPreferencial}%</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-emerald-500 font-medium">CAE</div>
                  <div className="text-xs font-bold text-emerald-700">{banco.cae}%</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-purple-500 font-medium">Pie Min.</div>
                  <div className="text-xs font-bold text-purple-700">{banco.pieMinimo}%</div>
                </div>
              </div>

              {/* Leads asignados */}
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{leadsPorBanco[banco.nombre] || 0} leads asignados</span>
                <span>Financ. hasta {banco.financiamientoMaximo}%</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                <Eye size={12} /> Ver detalles
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalle */}
      {bancoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBancoSeleccionado(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100" style={{ borderTop: `4px solid ${bancoSeleccionado.color}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg" style={{ backgroundColor: bancoSeleccionado.color }}>
                    {bancoSeleccionado.nombre[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{bancoSeleccionado.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bancoSeleccionado.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{bancoSeleccionado.estado}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Convenio {bancoSeleccionado.convenio}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setBancoSeleccionado(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tasas */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tasas de Interes</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-blue-500 font-medium">Tasa Base</div>
                    <div className="text-xl font-bold text-blue-700">{bancoSeleccionado.tasaBase}%</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-emerald-500 font-medium">Tasa Preferencial</div>
                    <div className="text-xl font-bold text-emerald-700">{bancoSeleccionado.tasaPreferencial}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-purple-500 font-medium">CAE</div>
                    <div className="text-xl font-bold text-purple-700">{bancoSeleccionado.cae}%</div>
                  </div>
                </div>
              </div>

              {/* Tabla de Tasas por Tipo */}
              {bancoSeleccionado.tasasPorTipo && Object.keys(bancoSeleccionado.tasasPorTipo).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tasas por Tipo de Cliente</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="text-left p-2 rounded-l-lg font-bold text-slate-700">Tipo Cliente</th>
                          <th className="text-center p-2 font-bold text-slate-700">15 anos</th>
                          <th className="text-center p-2 font-bold text-slate-700">20 anos</th>
                          <th className="text-center p-2 font-bold text-slate-700">25 anos</th>
                          <th className="text-center p-2 rounded-r-lg font-bold text-slate-700">30 anos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(bancoSeleccionado.tasasPorTipo).map(([tipo, tasas]) => (
                          <tr key={tipo} className="border-b border-slate-100">
                            <td className="p-2 font-semibold text-slate-700">{tipo}</td>
                            {Object.values(tasas).map((tasa, i) => (
                              <td key={i} className="p-2 text-center font-medium text-slate-600">{tasa}%</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Condiciones */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Condiciones</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Financiamiento</div>
                    <div className="text-xs font-bold text-slate-700">hasta {bancoSeleccionado.financiamientoMaximo}%</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Plazo Maximo</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.plazoMaximo} anos</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Pie Minimo</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.pieMinimo}%</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Prepago</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.prepago ? "Si" : "No"}</div>
                  </div>
                </div>
              </div>

              {/* Compatibilidad */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Compatibilidad</h3>
                <div className="flex flex-wrap gap-2">
                  {bancoSeleccionado.independientes && <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Independientes</span>}
                  {bancoSeleccionado.empresas && <span className="text-[10px] font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">Empresas</span>}
                  {bancoSeleccionado.complementoRenta && <span className="text-[10px] font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">Complemento Renta</span>}
                  {bancoSeleccionado.productos?.map((p) => (
                    <span key={p} className="text-[10px] font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{p}</span>
                  ))}
                </div>
              </div>

              {/* Requisitos */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Requisitos Minimos</h3>
                <div className="space-y-1.5">
                  {bancoSeleccionado.requisitosMinimos?.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" /> {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Condiciones Adicionales */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Condiciones Adicionales</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Prepago</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.prepago ? "Permitido" : "No permitido"}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Complemento Renta</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.complementoRenta ? "Si" : "No"}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-400">Comision Convenio</div>
                    <div className="text-xs font-bold text-slate-700">{bancoSeleccionado.comisionConvenio}</div>
                  </div>
                </div>
              </div>

              {/* Tiempos */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tiempos de Proceso</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <Clock size={14} className="text-blue-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-blue-700">{bancoSeleccionado.tiempoAprobacion}</div>
                    <div className="text-[9px] text-blue-500">Aprobacion</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <FileText size={14} className="text-purple-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-purple-700">{bancoSeleccionado.tiempoEscrituracion}</div>
                    <div className="text-[9px] text-purple-500">Escrituracion</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <DollarSign size={14} className="text-emerald-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-emerald-700">{bancoSeleccionado.tiempoPago}</div>
                    <div className="text-[9px] text-emerald-500">Pago</div>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contacto del Ejecutivo</h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: bancoSeleccionado.color }}>
                      {bancoSeleccionado.contactoNombre?.[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{bancoSeleccionado.contactoNombre}</div>
                      <div className="text-[10px] text-slate-500">{bancoSeleccionado.sucursal} - {bancoSeleccionado.region}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <a href={`tel:${bancoSeleccionado.contactoTelefono}`} className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-blue-600">
                      <Phone size={12} /> {bancoSeleccionado.contactoTelefono}
                    </a>
                    <a href={`mailto:${bancoSeleccionado.contactoEmail}`} className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-blue-600">
                      <Mail size={12} /> {bancoSeleccionado.contactoEmail}
                    </a>
                    <a href={`https://wa.me/56${(bancoSeleccionado.contactoWhatsapp || "").replace(/[^0-9]/g, "").replace(/^56/, "")}`} target="_blank" className="flex items-center gap-2 text-[11px] text-green-600 hover:text-green-700">
                      <MessageSquare size={12} /> WhatsApp
                    </a>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock size={12} /> {bancoSeleccionado.horarioAtencion}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metricas del Banco */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rendimiento</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-emerald-700">{leadsPorBanco[bancoSeleccionado.nombre] || 0}</div>
                    <div className="text-[9px] text-emerald-500">Leads</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-700">{bancoSeleccionado.tiempoAprobacion}</div>
                    <div className="text-[9px] text-blue-500">Aprobacion</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-700">{bancoSeleccionado.tiempoEscrituracion}</div>
                    <div className="text-[9px] text-purple-500">Escrituracion</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-amber-700">{bancoSeleccionado.tiempoPago}</div>
                    <div className="text-[9px] text-amber-500">Pago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}