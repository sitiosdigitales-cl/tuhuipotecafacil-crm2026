"use client";

import { PWAConfig } from "@/tipos/pwa-config";
import { LayoutDashboard, Users, BarChart3, Settings } from "lucide-react";

interface PhoneMockupProps {
  config: PWAConfig;
}

export function PhoneMockup({ config }: PhoneMockupProps) {
  const { colorPrimario, colorSecundario, colorFondoSplash, logoUrl, nombreApp, darkMode, colorPrimarioDark, colorFondoDark } = config;
  const primary = darkMode ? colorPrimarioDark : colorPrimario;
  const bg = darkMode ? colorFondoDark : "#F8FAFC";

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Preview en Vivo</span>

      {/* Phone Frame */}
      <div className="relative w-[220px] h-[440px] bg-slate-900 rounded-[36px] p-[10px] shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full rounded-[28px] overflow-hidden bg-white flex flex-col relative">
          {/* Status Bar */}
          <div className="h-8 flex items-center justify-between px-5 pt-1" style={{ backgroundColor: primary }}>
            <span className="text-[7px] font-semibold text-white/90">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 border border-white/60 rounded-sm relative">
                <div className="absolute inset-0.5 bg-white/60 rounded-[1px]" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* App Header */}
          <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: primary }}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">TH</span>
              </div>
            )}
            <span className="text-[10px] font-bold text-white truncate">{nombreApp || "TuHipotecaFacil"}</span>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-2 space-y-2 overflow-hidden" style={{ backgroundColor: bg }}>
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Leads", value: "344", color: "#3B82F6" },
                { label: "Aprobados", value: "89", color: "#10B981" },
                { label: "Monto", value: "$45M", color: "#F59E0B" },
              ].map((kpi) => (
                <div key={kpi.label} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-1.5 border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="text-[6px] text-slate-400">{kpi.label}</div>
                  <div className="text-[10px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Chart Placeholder */}
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2 border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="text-[7px] font-semibold mb-1.5" style={{ color: darkMode ? '#e2e8f0' : '#334155' }}>Pipeline</div>
              <div className="flex items-end gap-1 h-12">
                {[40, 55, 70, 85, 60, 45, 30, 25, 20, 15, 10, 8, 5].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i < 4 ? primary : i < 8 ? colorSecundario : `${primary}40`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2 border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="text-[7px] font-semibold mb-1" style={{ color: darkMode ? '#e2e8f0' : '#334155' }}>Actividad</div>
              {["Nuevo lead: Maria S.", "Credito aprobado: Juan P.", "Doc. pendiente: Pedro G."].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 py-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: i === 0 ? "#3B82F6" : i === 1 ? "#10B981" : "#F59E0B" }} />
                  <span className="text-[6px]" style={{ color: darkMode ? '#94a3b8' : '#64748B' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Nav */}
          <div className={`h-10 flex items-center justify-around border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            {[
              { icon: LayoutDashboard, active: true },
              { icon: Users, active: false },
              { icon: BarChart3, active: false },
              { icon: Settings, active: false },
            ].map((item, i) => (
              <item.icon
                key={i}
                size={12}
                style={{ color: item.active ? primary : darkMode ? '#64748B' : '#94A3B8' }}
              />
            ))}
          </div>

          {/* Home Indicator */}
          <div className={`h-4 flex items-center justify-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="w-16 h-1 rounded-full bg-slate-300" />
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl" />
      </div>

      {/* Splash Preview */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Splash Screen</span>
        <div className="w-[160px] h-[280px] rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: colorFondoSplash }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover mb-3" />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${primary}20` }}>
              <span className="text-xl font-bold" style={{ color: primary }}>TH</span>
            </div>
          )}
          <div className="text-[11px] font-bold" style={{ color: darkMode ? colorPrimarioDark : colorPrimario }}>
            {nombreApp || "TuHipotecaFacil"}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cargando...</div>
          <div className="w-8 h-1 rounded-full mt-3 overflow-hidden bg-slate-200">
            <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: primary, width: "60%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
