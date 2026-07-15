"use client";

import { useState } from "react";
import {
  Sparkles,
  Brain,
  Cpu,
  MessageSquare,
  Database,
  Clock,
  Eye,
  EyeOff,
  Info,
  Zap,
} from "lucide-react";
import { SectionCard, Field, ConfigInput, ConfigSelect, ToggleRow, ToggleSwitch } from "./config-section";

interface TabAsistenteIAProps {
  aiProveedor: string;
  setAiProveedor: (v: string) => void;
  aiApiKey: string;
  setAiApiKey: (v: string) => void;
  aiModelo: string;
  setAiModelo: (v: string) => void;
  aiTemperatura: number;
  setAiTemperatura: (v: number) => void;
  aiMaxTokens: number;
  setAiMaxTokens: (v: number) => void;
  aiSystemPrompt: string;
  setAiSystemPrompt: (v: string) => void;
  aiActivo: boolean;
  setAiActivo: (v: boolean) => void;
  aiAccesoDatos: boolean;
  setAiAccesoDatos: (v: boolean) => void;
  aiHistorial: boolean;
  setAiHistorial: (v: boolean) => void;
  aiSugerenciasAutomaticas: boolean;
  setAiSugerenciasAutomaticas: (v: boolean) => void;
}

const modelosPorProveedor: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Rapido)" },
    { value: "gpt-4o", label: "GPT-4o (Potente)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-haiku", label: "Claude 3 Haiku (Rapido)" },
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
    { value: "claude-3-opus", label: "Claude 3 Opus (Potente)" },
  ],
  google: [
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "gemini-ultra", label: "Gemini Ultra" },
  ],
  azure: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
  ],
};

export function TabAsistenteIA({
  aiProveedor, setAiProveedor,
  aiApiKey, setAiApiKey,
  aiModelo, setAiModelo,
  aiTemperatura, setAiTemperatura,
  aiMaxTokens, setAiMaxTokens,
  aiSystemPrompt, setAiSystemPrompt,
  aiActivo, setAiActivo,
  aiAccesoDatos, setAiAccesoDatos,
  aiHistorial, setAiHistorial,
  aiSugerenciasAutomaticas, setAiSugerenciasAutomaticas,
}: TabAsistenteIAProps) {
  const [showAiApiKey, setShowAiApiKey] = useState(false);

  return (
    <div className="space-y-5">
      {/* Estado del Asistente */}
      <SectionCard title="Estado del Asistente" icon={<Sparkles size={16} className="text-violet-500" />}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiActivo ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20" : "bg-slate-200"}`}>
              <Sparkles size={20} className={aiActivo ? "text-white" : "text-slate-400"} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">Asistente IA</div>
              <div className="text-[11px] text-slate-500">
                {aiActivo ? "Activo y listo para ayudar" : "Desactivado"}
              </div>
            </div>
          </div>
          <ToggleSwitch checked={aiActivo} onChange={setAiActivo} />
        </div>
      </SectionCard>

      {/* Configuracion del Proveedor */}
      <SectionCard title="Proveedor de IA" icon={<Brain size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Proveedor">
            <ConfigSelect value={aiProveedor} onChange={setAiProveedor} options={[
              { value: "openai", label: "OpenAI (GPT)" },
              { value: "anthropic", label: "Anthropic (Claude)" },
              { value: "google", label: "Google (Gemini)" },
              { value: "azure", label: "Azure OpenAI" },
            ]} />
          </Field>
          <Field label="Modelo">
            <ConfigSelect
              value={aiModelo}
              onChange={setAiModelo}
              options={modelosPorProveedor[aiProveedor] || modelosPorProveedor.openai}
            />
          </Field>
        </div>
        <Field label="API Key">
          <div className="relative">
            <ConfigInput
              value={aiApiKey}
              onChange={setAiApiKey}
              type={showAiApiKey ? "text" : "password"}
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowAiApiKey(!showAiApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showAiApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tu API key se almacena de forma segura y nunca se comparte.</p>
        </Field>
      </SectionCard>

      {/* Parametros del Modelo */}
      <SectionCard title="Parametros del Modelo" icon={<Cpu size={16} className="text-emerald-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Temperatura">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiTemperatura}
                onChange={(e) => setAiTemperatura(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-[12px] font-bold text-slate-700 w-10 text-center">{aiTemperatura}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Menor = mas preciso, Mayor = mas creativo</p>
          </Field>
          <Field label="Maximo de Tokens">
            <ConfigInput
              value={aiMaxTokens.toString()}
              onChange={(v) => setAiMaxTokens(parseInt(v) || 2048)}
              type="number"
            />
            <p className="text-[10px] text-slate-400 mt-1">Longitud maxima de respuesta (1024-4096)</p>
          </Field>
        </div>
      </SectionCard>

      {/* System Prompt */}
      <SectionCard title="Instrucciones del Asistente" icon={<MessageSquare size={16} className="text-amber-500" />}>
        <Field label="System Prompt">
          <textarea
            value={aiSystemPrompt}
            onChange={(e) => setAiSystemPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none transition-all"
            placeholder="Instrucciones para el asistente..."
          />
          <p className="text-[10px] text-slate-400 mt-1">Define el comportamiento y personalidad del asistente.</p>
        </Field>
      </SectionCard>

      {/* Funcionalidades */}
      <SectionCard title="Funcionalidades" icon={<Zap size={16} className="text-purple-500" />}>
        <div className="space-y-4">
          <ToggleRow
            label="Acceso a datos del CRM"
            description="Permite al asistente leer leads, clientes y estadisticas"
            checked={aiAccesoDatos}
            onChange={setAiAccesoDatos}
            icon={<Database size={16} className="text-blue-500" />}
          />
          <ToggleRow
            label="Historial de conversaciones"
            description="Guarda el historial de chats para contexto"
            checked={aiHistorial}
            onChange={setAiHistorial}
            icon={<Clock size={16} className="text-emerald-500" />}
          />
          <ToggleRow
            label="Sugerencias automaticas"
            description="Muestra sugerencias basadas en la actividad actual"
            checked={aiSugerenciasAutomaticas}
            onChange={setAiSugerenciasAutomaticas}
            icon={<Sparkles size={16} className="text-violet-500" />}
          />
        </div>
      </SectionCard>

      {/* Informacion de Uso */}
      <SectionCard title="Informacion de Uso" icon={<Info size={16} className="text-slate-500" />}>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">1,247</div>
            <div className="text-[10px] text-slate-500 mt-1">Mensajes este mes</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">~$2.500</div>
            <div className="text-[10px] text-slate-500 mt-1">Costo estimado</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">98.5%</div>
            <div className="text-[10px] text-slate-500 mt-1">Disponibilidad</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
