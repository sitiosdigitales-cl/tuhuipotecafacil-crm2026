"use client";

import type { ReactNode } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  Building2,
  CalendarClock,
  DollarSign,
  Eye,
  FileText,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { ORIGEN_LABELS } from "@/tipos";
import type { Lead, Prioridad } from "@/tipos";
import {
  AsignarEjecutivo,
  type EjecutivoAsignable,
} from "./AsignarEjecutivo";

const PRIORIDADES: Record<Prioridad, { label: string; className: string }> = {
  BAJA: { label: "Baja", className: "bg-slate-100 text-slate-600" },
  MEDIA: { label: "Media", className: "bg-blue-50 text-blue-600" },
  ALTA: { label: "Alta", className: "bg-orange-50 text-orange-600" },
  URGENTE: { label: "Urgente", className: "bg-red-50 text-red-600" },
};

interface PipelineLeadCardProps {
  lead: Lead;
  index: number;
  onOpen: () => void;
}

export function PipelineLeadCard({ lead, index, onOpen }: PipelineLeadCardProps) {
  const prioridad = PRIORIDADES[lead.prioridad];

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          aria-label={`Abrir ficha de ${lead.nombre} ${lead.apellido}`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className={`mb-2 cursor-pointer rounded-xl border bg-white p-2.5 transition-all dark:bg-slate-800 ${
            snapshot.isDragging
              ? "z-50 rotate-1 scale-[1.02] border-blue-300 shadow-xl ring-2 ring-blue-500/20"
              : "border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-[9px] font-bold text-white shadow-sm">
              {lead.nombre[0]}{lead.apellido[0]}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                  lead.prioridad === "URGENTE"
                    ? "bg-red-500"
                    : lead.prioridad === "ALTA"
                      ? "bg-orange-500"
                      : lead.prioridad === "MEDIA"
                        ? "bg-blue-500"
                        : "bg-slate-400"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">
                    {lead.nombre} {lead.apellido}
                  </p>
                  <p className="truncate text-[9px] font-medium text-slate-400">
                    {lead.rut || "Sin RUT"}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${prioridad.className}`}>
                  {prioridad.label}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-slate-400">
                    {lead.telefono || lead.email || "Sin contacto"}
                  </p>
                  <p className="truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
                    {lead.nombreEjecutivo || "Sin asignar"}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {formatoMonedaAbreviado(lead.montoSolicitado || 0)}
                  </p>
                  <p className="text-[8px] font-semibold text-slate-400">
                    {lead.diasEnEtapa}d en etapa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

interface PipelineLeadDetailProps {
  lead: Lead | null;
  etapaNombre: string;
  carga: Record<string, number>;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (leadId: string, ejecutivo: EjecutivoAsignable | null) => void;
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpenFull: (lead: Lead) => void;
}

function DetailItem({ icon, label, value }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1.5 flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="break-words text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        {value || "—"}
      </div>
    </div>
  );
}

export function PipelineLeadDetail({
  lead,
  etapaNombre,
  carga,
  canManage,
  onOpenChange,
  onAssign,
  onDelete,
  onEdit,
  onOpenFull,
}: PipelineLeadDetailProps) {
  if (!lead) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-[11px] font-bold text-white shadow-sm">
              {lead.nombre[0]}{lead.apellido[0]}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">
                {lead.nombre} {lead.apellido}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {lead.rut || "Sin RUT"} · {etapaNombre} · {lead.diasEnEtapa} días en etapa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {canManage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 dark:border-blue-900/50 dark:bg-blue-900/20">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500">Responsable</p>
              <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {lead.nombreEjecutivo || "Lead sin asignar"}
              </p>
            </div>
            <AsignarEjecutivo
              ejecutivoActual={lead.nombreEjecutivo}
              carga={carga}
              onAsignar={(ejecutivo) => onAssign(lead.id, ejecutivo)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DetailItem
            icon={<DollarSign size={12} />}
            label="Monto solicitado"
            value={
              <>
                <span className="block text-sm">{formatoMonedaAbreviado(lead.montoSolicitado || 0)}</span>
                <span className="text-[9px] font-medium text-blue-500">{formatoUF(lead.montoSolicitado || 0)}</span>
              </>
            }
          />
          <DetailItem
            icon={<Home size={12} />}
            label="Valor propiedad"
            value={formatoMonedaAbreviado(lead.valorPropiedad || 0)}
          />
          <DetailItem
            icon={<Wallet size={12} />}
            label="Pie disponible"
            value={formatoMonedaAbreviado(lead.pieDisponible || 0)}
          />
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Contacto y operación
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem icon={<Phone size={12} />} label="Teléfono" value={lead.telefono} />
            <DetailItem icon={<Mail size={12} />} label="Correo" value={lead.email} />
            <DetailItem icon={<Building2 size={12} />} label="Banco" value={lead.banco || "Sin banco"} />
            <DetailItem icon={<FileText size={12} />} label="Tipo de crédito" value={lead.tipoCredito || "Sin tipo"} />
            <DetailItem icon={<UserRound size={12} />} label="Ejecutivo" value={lead.nombreEjecutivo || "Sin asignar"} />
            <DetailItem icon={<MapPin size={12} />} label="Origen" value={ORIGEN_LABELS[lead.origen] || lead.origen} />
            <DetailItem icon={<CalendarClock size={12} />} label="Creado" value={new Date(lead.creadoEn).toLocaleDateString("es-CL")} />
            <DetailItem icon={<Home size={12} />} label="Situación laboral" value={lead.situacionLaboral} />
            <DetailItem icon={<FileText size={12} />} label="DICOM" value={lead.enDicom ? "Con observaciones" : "Sin observaciones"} />
          </div>
        </div>

        {lead.notas && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-900/20">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-600">Notas</p>
            <p className="whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300">{lead.notas}</p>
          </div>
        )}

        <DialogFooter className="flex flex-wrap justify-end gap-2">
          {canManage && (
            <Button variant="outline" className="gap-1.5 text-red-500" onClick={() => onDelete(lead)}>
              <Trash2 size={13} /> Eliminar
            </Button>
          )}
            <Button variant="outline" className="gap-1.5" onClick={() => onEdit(lead)}>
              <Pencil size={13} /> Editar
            </Button>
            <Button className="gap-1.5" onClick={() => onOpenFull(lead)}>
              <Eye size={13} /> Ver ficha completa
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
