"use client";

import { useState } from "react";
import { ListaConversaciones } from "@/componentes/conversaciones/ListaConversaciones";
import { AreaChat } from "@/componentes/conversaciones/AreaChat";
import { useUser } from "@/lib/contexts/UserContext";

export default function ConversacionesPage() {
  const { usuarioActual } = useUser();
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-8rem)] -m-4 lg:-m-6 flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <ListaConversaciones
        conversacionActiva={conversacionActiva}
        onSeleccionarConversacion={setConversacionActiva}
        usuarioActualId={usuarioActual.id}
      />
      <AreaChat
        conversacionId={conversacionActiva}
        usuarioActualId={usuarioActual.id}
      />
    </div>
  );
}
