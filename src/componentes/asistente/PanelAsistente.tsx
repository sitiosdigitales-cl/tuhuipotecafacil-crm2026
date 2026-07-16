"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SugerenciasRapidas } from "./SugerenciasRapidas";
import { MensajeAsistente } from "./MensajeAsistente";
import { useLeads } from "@/modulos/leads";
import { useUser } from "@/modulos/usuarios";
import { generarEstadisticas, generarResumenLeads, obtenerDatosCMFParaIA } from "@/lib/ai/estadisticas";

export function PanelAsistente() {
  const { leads } = useLeads();
  const { usuarioActual } = useUser();
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false); // eslint-disable-line react-hooks/set-state-in-effect -- Ocultar bienvenida al recibir mensajes
    }
  }, [messages]);

  // Generar datos contextuales para el asistente
  const obtenerContextoDatos = async (): Promise<string> => {
    const stats = generarEstadisticas(leads);
    const resumenLeads = generarResumenLeads(leads, 30);
    const datosCMF = await obtenerDatosCMFParaIA();

    return `
=== DATOS ACTUALES DEL CRM ===

ESTADÍSTICAS GENERALES:
- Total de leads: ${stats.totalLeads}
- Tasa de conversión global: ${stats.tasaConversion}
- Monto total financiado: ${stats.montoTotalFinanciado}
- Ticket promedio: ${stats.ticketPromedio}
- Leads urgentes (URGENTE/ALTA): ${stats.leadsUrgentes}
- Leads estancados (>14 días): ${stats.leadsEstancados}

DISTRIBUCIÓN POR ETAPA:
${Object.entries(stats.leadsPorEtapa)
  .map(([etapa, count]) => `- ${etapa}: ${count} leads`)
  .join("\n")}

DISTRIBUCIÓN POR ORIGEN:
${Object.entries(stats.leadsPorOrigen)
  .map(([origen, count]) => `- ${origen}: ${count} leads`)
  .join("\n")}

RENDIMIENTO POR EJECUTIVO:
${stats.topEjecutivos
  .map((e) => `- ${e.nombre}: ${e.leads} leads, $${(e.monto / 1_000_000).toFixed(0)}M CLP`)
  .join("\n")}

RENDIMIENTO POR BANCO:
${stats.topBancos
  .map((b) => `- ${b.nombre}: ${b.creditos} créditos, $${(b.monto / 1_000_000).toFixed(0)}M CLP`)
  .join("\n")}

USUARIO ACTUAL: ${usuarioActual.nombre} ${usuarioActual.apellido} (${usuarioActual.rol})
${datosCMF}
=== ÚLTIMOS LEADS REGISTRADOS ===
${resumenLeads}
`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || status === "streaming") return;

    // Enviar mensaje con contexto de datos reales
    const contextoDatos = await obtenerContextoDatos();
    const mensajeConContexto = `[CONTEXTO CRM]\n${contextoDatos}\n[/CONTEXTO CRM]\n\nPregunta del usuario: ${input}`;

    sendMessage({ text: mensajeConContexto });
    setInput("");
  };

  const handleSugerencia = async (prompt: string) => {
    setInput(prompt);
    setTimeout(async () => {
      const contextoDatos = await obtenerContextoDatos();
      const mensajeConContexto = `[CONTEXTO CRM]\n${contextoDatos}\n[/CONTEXTO CRM]\n\nPregunta del usuario: ${prompt}`;

      sendMessage({ text: mensajeConContexto });
      setInput("");
    }, 100);
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Asistente IA</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {leads.length} leads cargados • {usuarioActual.nombre}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
              <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Hola, soy tu asistente IA
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
              Tengo acceso a los datos de tus {leads.length} leads. Puedo ayudarte a analizar, obtener insights y sugerir acciones.
            </p>
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 mb-6 max-w-sm">
              <p className="text-[11px] text-violet-700 dark:text-violet-300">
                <strong>Datos disponibles:</strong> Estadísticas del pipeline, rendimiento por ejecutivo, análisis por banco, leads urgentes y estancados.
              </p>
            </div>
            <SugerenciasRapidas onSelect={handleSugerencia} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MensajeAsistente key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm">Analizando datos...</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                Error: {error.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale algo sobre tus leads..."
              rows={1}
              className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
          Enter para enviar • Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
