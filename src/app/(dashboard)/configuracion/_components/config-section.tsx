"use client";

import { type ReactNode } from "react";

export function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

export function ConfigInput({ value, onChange, type = "text", placeholder, disabled }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

export function ConfigSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
        checked ? "bg-violet-500" : "bg-slate-300"
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
        checked ? "translate-x-6" : "translate-x-0.5"
      }`} />
    </button>
  );
}

export function ToggleRow({ label, description, checked, onChange, icon }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>}
        <div>
          <div className="text-[12px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-400">{description}</div>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[12px] font-semibold text-slate-700">{value}</span>
    </div>
  );
}
