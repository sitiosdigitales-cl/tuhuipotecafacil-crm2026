"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  num: number;
  title: string;
  icon: LucideIcon;
  activeSection: number;
  onSectionChange: (section: number) => void;
}

export function SectionHeader({
  num,
  title,
  icon: Icon,
  activeSection,
  onSectionChange,
}: SectionHeaderProps) {
  const isActive = activeSection === num;

  return (
    <button
      onClick={() => onSectionChange(isActive ? 0 : num)}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
        {num}
      </div>
      <Icon size={16} className={isActive ? "text-blue-600" : "text-slate-400"} />
      <span className="text-sm font-bold text-slate-800 flex-1 text-left">{title}</span>
      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isActive ? "rotate-180" : ""}`} />
    </button>
  );
}

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  placeholder?: string;
  hint?: string;
  suffix?: string;
}

function formatCLP(value: number): string {
  if (value === 0) return "0";
  return value.toLocaleString("es-CL");
}

export function InputField({
  label,
  value,
  onChange,
  prefix = "$",
  placeholder,
  hint,
  suffix,
}: InputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(formatCLP(value));
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
      setLocalValue(formatCLP(value));
    }
  }, [value]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    isTyping.current = true;
    const raw = event.target.value.replace(/[^0-9]/g, "");
    const numericValue = Number(raw) || 0;
    const formatted = formatCLP(numericValue);
    const cursorPosition = event.target.selectionStart || 0;
    const digitsBefore = event.target.value
      .substring(0, cursorPosition)
      .replace(/[^0-9]/g, "").length;

    setLocalValue(formatted);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;

      let newPosition = 0;
      let counted = 0;
      for (let index = 0; index < formatted.length; index += 1) {
        if (counted === digitsBefore) break;
        newPosition = index + 1;
        if (/[0-9]/.test(formatted[index])) counted += 1;
      }
      input.setSelectionRange(newPosition, newPosition);
      isTyping.current = false;
    });
  };

  const handleBlur = () => {
    isTyping.current = false;
    const raw = localValue.replace(/[^0-9]/g, "");
    const numericValue = Number(raw) || 0;
    setLocalValue(formatCLP(numericValue));
    onChange(numericValue);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold text-slate-500">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">{prefix}</span>}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={handleInputChange}
          onFocus={() => { isTyping.current = false; }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full ${prefix ? "pl-9" : "pl-4"} ${suffix ? "pr-14" : "pr-4"} py-3 bg-white border-2 rounded-xl text-lg font-bold text-slate-800 tracking-wide transition-all outline-none border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
    </div>
  );
}
