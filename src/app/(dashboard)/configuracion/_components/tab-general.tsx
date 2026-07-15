"use client";

import { Building2, Globe, Palette, Upload } from "lucide-react";
import { SectionCard, Field, ConfigInput, ConfigSelect } from "./config-section";

interface TabGeneralProps {
  nombreEmpresa: string;
  setNombreEmpresa: (v: string) => void;
  rutEmpresa: string;
  setRutEmpresa: (v: string) => void;
  emailEmpresa: string;
  setEmailEmpresa: (v: string) => void;
  telefonoEmpresa: string;
  setTelefonoEmpresa: (v: string) => void;
  direccionEmpresa: string;
  setDireccionEmpresa: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  idioma: string;
  setIdioma: (v: string) => void;
  moneda: string;
  setMoneda: (v: string) => void;
}

export function TabGeneral({
  nombreEmpresa, setNombreEmpresa,
  rutEmpresa, setRutEmpresa,
  emailEmpresa, setEmailEmpresa,
  telefonoEmpresa, setTelefonoEmpresa,
  direccionEmpresa, setDireccionEmpresa,
  timezone, setTimezone,
  idioma, setIdioma,
  moneda, setMoneda,
}: TabGeneralProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="Informacion de la Empresa" icon={<Building2 size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre de la Empresa">
            <ConfigInput value={nombreEmpresa} onChange={setNombreEmpresa} />
          </Field>
          <Field label="RUT">
            <ConfigInput value={rutEmpresa} onChange={setRutEmpresa} />
          </Field>
          <Field label="Email de Contacto">
            <ConfigInput value={emailEmpresa} onChange={setEmailEmpresa} type="email" />
          </Field>
          <Field label="Telefono">
            <ConfigInput value={telefonoEmpresa} onChange={setTelefonoEmpresa} />
          </Field>
        </div>
        <Field label="Direccion">
          <ConfigInput value={direccionEmpresa} onChange={setDireccionEmpresa} />
        </Field>
      </SectionCard>

      <SectionCard title="Preferencias Regionales" icon={<Globe size={16} className="text-emerald-500" />}>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Zona Horaria">
            <ConfigSelect value={timezone} onChange={setTimezone} options={[
              { value: "America/Santiago", label: "Santiago (GMT-4)" },
              { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
              { value: "America/Lima", label: "Lima (GMT-5)" },
              { value: "America/Bogota", label: "Bogota (GMT-5)" },
            ]} />
          </Field>
          <Field label="Idioma">
            <ConfigSelect value={idioma} onChange={setIdioma} options={[
              { value: "es-CL", label: "Espanol (Chile)" },
              { value: "es-AR", label: "Espanol (Argentina)" },
              { value: "es-PE", label: "Espanol (Peru)" },
              { value: "pt-BR", label: "Portugues (Brasil)" },
            ]} />
          </Field>
          <Field label="Moneda">
            <ConfigSelect value={moneda} onChange={setMoneda} options={[
              { value: "CLP", label: "Peso Chileno (CLP)" },
              { value: "ARS", label: "Peso Argentino (ARS)" },
              { value: "PEN", label: "Sol Peruano (PEN)" },
              { value: "USD", label: "Dolar (USD)" },
            ]} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Logo y Apariencia" icon={<Palette size={16} className="text-purple-500" />}>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            TH
          </div>
          <div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors mb-2">
              <Upload size={14} /> Subir Logo
            </button>
            <p className="text-[10px] text-slate-400">PNG, JPG o SVG. Maximo 2MB.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
