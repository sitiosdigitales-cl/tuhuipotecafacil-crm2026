"use client";

import { Lock, Clock, Shield } from "lucide-react";
import { SectionCard, Field, ConfigInput, ToggleRow } from "./config-section";

interface TabSeguridadProps {
  passwordMinLength: number;
  setPasswordMinLength: (v: number) => void;
  requiereMayuscula: boolean;
  setRequiereMayuscula: (v: boolean) => void;
  requiereNumero: boolean;
  setRequiereNumero: (v: boolean) => void;
  requiereEspecial: boolean;
  setRequiereEspecial: (v: boolean) => void;
  bloqueoIntentos: number;
  setBloqueoIntentos: (v: number) => void;
  sesionDuracion: number;
  setSesionDuracion: (v: number) => void;
  twoFactorActivo: boolean;
  setTwoFactorActivo: (v: boolean) => void;
}

export function TabSeguridad({
  passwordMinLength, setPasswordMinLength,
  requiereMayuscula, setRequiereMayuscula,
  requiereNumero, setRequiereNumero,
  requiereEspecial, setRequiereEspecial,
  bloqueoIntentos, setBloqueoIntentos,
  sesionDuracion, setSesionDuracion,
  twoFactorActivo, setTwoFactorActivo,
}: TabSeguridadProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="Politica de Contrasenas" icon={<Lock size={16} className="text-red-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Longitud Minima">
            <ConfigInput value={passwordMinLength.toString()} onChange={(v) => setPasswordMinLength(parseInt(v) || 8)} type="number" />
          </Field>
          <Field label="Intentos Maximos (Bloqueo)">
            <ConfigInput value={bloqueoIntentos.toString()} onChange={(v) => setBloqueoIntentos(parseInt(v) || 5)} type="number" />
          </Field>
        </div>
        <div className="space-y-4 mt-4">
          <ToggleRow
            label="Requiere Mayuscula"
            description="La contrasena debe contener al menos una mayuscula"
            checked={requiereMayuscula}
            onChange={setRequiereMayuscula}
          />
          <ToggleRow
            label="Requiere Numero"
            description="La contrasena debe contener al menos un numero"
            checked={requiereNumero}
            onChange={setRequiereNumero}
          />
          <ToggleRow
            label="Requiere Caracter Especial"
            description="La contrasena debe contener !@#$%^&*"
            checked={requiereEspecial}
            onChange={setRequiereEspecial}
          />
        </div>
      </SectionCard>

      <SectionCard title="Sesiones" icon={<Clock size={16} className="text-amber-500" />}>
        <Field label="Duracion de Sesion (horas)">
          <ConfigInput value={sesionDuracion.toString()} onChange={(v) => setSesionDuracion(parseInt(v) || 24)} type="number" />
        </Field>
      </SectionCard>

      <SectionCard title="Autenticacion de Dos Factores" icon={<Shield size={16} className="text-purple-500" />}>
        <ToggleRow
          label="2FA Obligatorio"
          description="Requerir autenticacion de dos factores para todos los usuarios"
          checked={twoFactorActivo}
          onChange={setTwoFactorActivo}
        />
      </SectionCard>
    </div>
  );
}
