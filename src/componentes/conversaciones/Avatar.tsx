"use client";

import { getAvatarColor, getIniciales, getEstadoOnline } from "@/datos/conversaciones-mock";
import { ESTADO_ONLINE_CONFIG } from "@/tipos/conversaciones";

interface AvatarProps {
  nombre: string;
  id: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
};

const statusSizeClasses = {
  sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  md: "w-3 h-3 -bottom-0.5 -right-0.5",
  lg: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
};

export function Avatar({ nombre, id, size = "md", showStatus = true }: AvatarProps) {
  const colorClass = getAvatarColor(nombre);
  const iniciales = getIniciales(nombre);
  const estado = getEstadoOnline(id);
  const statusConfig = ESTADO_ONLINE_CONFIG[estado];

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white font-bold shadow-sm`}
      >
        {iniciales}
      </div>
      {showStatus && (
        <div
          className={`absolute ${statusSizeClasses[size]} ${statusConfig.color} rounded-full border-2 border-white`}
          title={statusConfig.label}
        />
      )}
    </div>
  );
}
