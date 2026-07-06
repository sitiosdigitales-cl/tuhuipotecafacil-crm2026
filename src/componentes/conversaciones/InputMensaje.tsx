"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  AtSign,
  Image,
  Mic,
  Bold,
  Italic,
  Code,
  Link,
  List,
  X,
} from "lucide-react";

interface InputMensajeProps {
  onEnviar: (contenido: string) => void;
  nombreConversacion: string;
}

export function InputMensaje({ onEnviar, nombreConversacion }: InputMensajeProps) {
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormato, setMostrarFormato] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [mensaje]);

  const handleEnviar = () => {
    if (!mensaje.trim()) return;
    onEnviar(mensaje.trim());
    setMensaje("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const insertarFormato = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSeleccionado = mensaje.substring(start, end);

    const nuevoMensaje =
      mensaje.substring(0, start) +
      prefix +
      (textoSeleccionado || "texto") +
      suffix +
      mensaje.substring(end);

    setMensaje(nuevoMensaje);

    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = textoSeleccionado
        ? newStart + textoSeleccionado.length
        : newStart + 4;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Barra de formato */}
      {mostrarFormato && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100">
          <button
            onClick={() => insertarFormato("**", "**")}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Negrita"
          >
            <Bold size={14} className="text-slate-500" />
          </button>
          <button
            onClick={() => insertarFormato("_", "_")}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Cursiva"
          >
            <Italic size={14} className="text-slate-500" />
          </button>
          <button
            onClick={() => insertarFormato("`", "`")}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Código"
          >
            <Code size={14} className="text-slate-500" />
          </button>
          <button
            onClick={() => insertarFormato("[", "](url)")}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Enlace"
          >
            <Link size={14} className="text-slate-500" />
          </button>
          <button
            onClick={() => insertarFormato("\n• ", "")}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            title="Lista"
          >
            <List size={14} className="text-slate-500" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={() => setMostrarFormato(false)}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          {/* Botones izquierda */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={() => setMostrarFormato(!mostrarFormato)}
              className={`p-1.5 rounded-lg transition-colors ${
                mostrarFormato ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
              }`}
              title="Formato"
            >
              <Bold size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Adjuntar archivo">
              <Paperclip size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Enviar imagen">
              <Image size={16} />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe un mensaje en ${nombreConversacion}...`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none py-1 max-h-[120px]"
          />

          {/* Botones derecha */}
          <div className="flex items-center gap-1 pb-0.5">
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Mencionar">
              <AtSign size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Emojis">
              <Smile size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Mensaje de voz">
              <Mic size={16} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={handleEnviar}
              disabled={!mensaje.trim()}
              className={`p-2 rounded-xl transition-all ${
                mensaje.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-slate-400">
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Enter</kbd> enviar ·{" "}
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Shift+Enter</kbd> nueva línea
          </p>
          {mensaje.length > 0 && (
            <p className="text-[10px] text-slate-400">{mensaje.length} caracteres</p>
          )}
        </div>
      </div>
    </div>
  );
}
