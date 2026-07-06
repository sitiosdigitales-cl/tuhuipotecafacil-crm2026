"use client";

const PRESETS = [
  { label: "Azul", value: "#3B82F6" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Violeta", value: "#8B5CF6" },
  { label: "Esmeralda", value: "#10B981" },
  { label: "Ambar", value: "#F59E0B" },
  { label: "Rosa", value: "#F43F5E" },
  { label: "Gris", value: "#64748B" },
  { label: "Cyan", value: "#06B6D4" },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showPresets?: boolean;
}

export function ColorPicker({ value, onChange, label, showPresets = true }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      )}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="flex-1 h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
          placeholder="#3B82F6"
        />
        <div
          className="w-10 h-10 rounded-xl border-2 border-slate-200 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
      </div>
      {showPresets && (
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                value === preset.value
                  ? "border-slate-800 scale-110 shadow-md"
                  : "border-slate-200 hover:scale-105"
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
