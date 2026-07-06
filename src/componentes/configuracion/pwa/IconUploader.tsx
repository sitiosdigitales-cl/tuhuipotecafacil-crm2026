"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface IconUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  size?: number;
  label: string;
  sublabel?: string;
  accept?: string;
}

export function IconUploader({
  value,
  onChange,
  size = 80,
  label,
  sublabel,
  accept = "image/png,image/jpeg,image/svg+xml",
}: IconUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const procesarArchivo = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      {sublabel && <p className="text-[10px] text-slate-400">{sublabel}</p>}

      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          dragging
            ? "border-blue-400 bg-blue-50/50"
            : value
            ? "border-slate-200 bg-slate-50/50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30"
        }`}
        style={{ width: size + 32, height: size + 32 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={value}
              alt={label}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <ImageIcon size={20} className="text-slate-300" />
            <span className="text-[11px] text-slate-400">Arrastra o haz clic</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
