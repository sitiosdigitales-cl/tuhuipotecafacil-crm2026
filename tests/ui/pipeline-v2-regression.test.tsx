import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PipelinePage from "@/app/(dashboard)/pipeline/page";
import type { EtapaPipeline, Lead } from "@/tipos";

const mocks = vi.hoisted(() => ({
  agregarActividad: vi.fn(),
  agregarLead: vi.fn(),
  actualizarLead: vi.fn(),
  eliminarLead: vi.fn(),
  moverEtapa: vi.fn(),
  push: vi.fn(),
  useActivities: vi.fn(),
  useLeads: vi.fn(),
  useUser: vi.fn(),
}));

const dndHarness = vi.hoisted(() => ({
  onDragEnd: null as null | ((result: unknown) => Promise<void> | void),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/modulos/usuarios", () => ({
  useUser: mocks.useUser,
}));

vi.mock("@/modulos/leads", () => ({
  useLeads: mocks.useLeads,
}));

vi.mock("@/lib/contexts/ActivityContext", () => ({
  useActivities: mocks.useActivities,
}));

vi.mock("@/componentes/pipeline/PipelineSkeleton", () => ({
  PipelineSkeleton: () => <div data-testid="pipeline-skeleton">Cargando pipeline</div>,
}));

vi.mock("@/componentes/pipeline/AsignarEjecutivo", () => ({
  AsignarEjecutivo: () => null,
}));

vi.mock("@/componentes/leads/FormularioLead", () => ({
  FormularioLead: () => null,
}));

vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@hello-pangea/dnd", async () => {
  const React = await import("react");
  return {
    DragDropContext: ({ children, onDragEnd }: {
      children: React.ReactNode;
      onDragEnd: (result: unknown) => Promise<void> | void;
    }) => {
      dndHarness.onDragEnd = onDragEnd;
      return React.createElement("div", { "data-testid": "drag-context" }, children);
    },
    Droppable: ({ children }: {
      children: (provided: unknown, snapshot: unknown) => React.ReactNode;
    }) => children(
      { innerRef: vi.fn(), droppableProps: {}, placeholder: null },
      { isDraggingOver: false },
    ),
    Draggable: ({ children }: {
      children: (provided: unknown, snapshot: unknown) => React.ReactNode;
    }) => children(
      { innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} },
      { isDragging: false },
    ),
  };
});

const etapas: EtapaPipeline[] = [
  { id: "NUEVO_LEAD", nombre: "Nuevo Lead", color: "#3B82F6", orden: 1, activa: true },
  { id: "CONTACTO_INICIAL", nombre: "Contacto Inicial", color: "#6366F1", orden: 2, activa: true },
  { id: "REVISION_LEGAL", nombre: "Revisión Legal", color: "#A855F7", orden: 3, activa: true },
];

function respuestaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function crearLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-base",
    nombre: "Caso",
    apellido: "Sintético",
    rut: "11.111.111-1",
    email: "caso@example.test",
    telefono: "+56 9 1234 5678",
    situacionLaboral: "DEPENDIENTE",
    enDicom: false,
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    montoSolicitado: 100,
    valorPropiedad: 200,
    nombreEjecutivo: "Ejecutivo Uno",
    creadoEn: new Date("2026-08-10T12:00:00-04:00"),
    diasEnEtapa: 1,
    ...overrides,
  };
}

function configurarContextos(leads: Lead[], cargando = false) {
  mocks.useUser.mockReturnValue({
    usuarioActual: {
      id: "admin-qa",
      nombre: "Admin",
      apellido: "QA",
      rol: "SUPER_ADMIN",
      estado: "ACTIVO",
    },
    esSuperAdmin: true,
    usuarios: [],
  });
  mocks.useLeads.mockReturnValue({
    leads,
    agregarLead: mocks.agregarLead,
    actualizarLead: mocks.actualizarLead,
    eliminarLead: mocks.eliminarLead,
    moverEtapa: mocks.moverEtapa,
    cargaPorEjecutivo: {},
    cargando,
  });
  mocks.useActivities.mockReturnValue({ agregarActividad: mocks.agregarActividad });
}

function tarjetaIndicador(titulo: string) {
  const etiqueta = screen.getByText(titulo);
  const tarjeta = etiqueta.parentElement?.parentElement;
  if (!tarjeta) throw new Error(`No se encontró la tarjeta ${titulo}`);
  return within(tarjeta);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-08-21T12:00:00-04:00"));
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(respuestaJson({ success: true, data: etapas })),
  );
  mocks.moverEtapa.mockResolvedValue(undefined);
  mocks.agregarActividad.mockResolvedValue(undefined);
  configurarContextos([]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  dndHarness.onDragEnd = null;
});

describe("regresiones del pipeline V2", () => {
  it("muestra el esqueleto mientras carga y el contenido cuando termina", async () => {
    configurarContextos([], true);
    const vista = render(<PipelinePage />);

    expect(screen.getByTestId("pipeline-skeleton")).toBeTruthy();
    expect(screen.queryByText("Total oportunidades")).toBeNull();

    configurarContextos([], false);
    vista.rerender(<PipelinePage />);

    expect(screen.queryByTestId("pipeline-skeleton")).toBeNull();
    expect(screen.getByText("Total oportunidades")).toBeTruthy();
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();
  });

  it("calcula totales y variaciones usando mes actual y mes anterior", async () => {
    configurarContextos([
      crearLead({ id: "actual-ganada", etapa: "APROBADO", montoSolicitado: 200 }),
      crearLead({ id: "actual-abierta", montoSolicitado: 100 }),
      crearLead({
        id: "anterior-ganada",
        etapa: "FIRMA_DIGITAL",
        montoSolicitado: 100,
        creadoEn: new Date("2026-07-10T12:00:00-04:00"),
      }),
      crearLead({
        id: "anterior-abierta",
        montoSolicitado: 100,
        creadoEn: new Date("2026-07-15T12:00:00-04:00"),
      }),
    ]);

    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();

    expect(tarjetaIndicador("Total oportunidades").getByText("4")).toBeTruthy();
    expect(tarjetaIndicador("Total oportunidades").getByText("+0.0% vs mes pasado")).toBeTruthy();
    expect(tarjetaIndicador("Monto total").getByText("$ 500")).toBeTruthy();
    expect(tarjetaIndicador("Monto total").getByText("+50.0% vs mes pasado")).toBeTruthy();
    expect(tarjetaIndicador("Ticket promedio").getByText("$ 125")).toBeTruthy();
    expect(tarjetaIndicador("Ticket promedio").getByText("+50.0% vs mes pasado")).toBeTruthy();
    expect(tarjetaIndicador("Conversión global").getByText("50.0%")).toBeTruthy();
    expect(tarjetaIndicador("Conversión global").getByText("+0.0% vs mes pasado")).toBeTruthy();
    expect(tarjetaIndicador("Oportunidades ganadas").getByText("2")).toBeTruthy();
    expect(tarjetaIndicador("Oportunidades ganadas").getByText("+0.0% vs mes pasado")).toBeTruthy();
  });

  it("usa null sin porcentajes inventados cuando el mes anterior está vacío", async () => {
    configurarContextos([crearLead({ id: "solo-actual", montoSolicitado: 300 })]);

    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();

    expect(screen.getAllByText("Sin comparación")).toHaveLength(5);
    expect(screen.queryByText(/vs mes pasado/)).toBeNull();
  });

  it("evita divisiones por cero cuando no hay oportunidades", async () => {
    configurarContextos([]);

    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();

    expect(tarjetaIndicador("Total oportunidades").getByText("0")).toBeTruthy();
    expect(tarjetaIndicador("Ticket promedio").getByText("$ 0")).toBeTruthy();
    expect(tarjetaIndicador("Conversión global").getByText("0.0%")).toBeTruthy();
    expect(tarjetaIndicador("Oportunidades ganadas").getByText("0")).toBeTruthy();
    expect(screen.queryByText(/Infinity|NaN/)).toBeNull();
  });

  it("combina etapa, ejecutivo y búsqueda telefónica ignorando espacios", async () => {
    configurarContextos([
      crearLead({
        id: "objetivo",
        nombre: "Objetivo",
        apellido: "Correcto",
        etapa: "REVISION_LEGAL" as Lead["etapa"],
        nombreEjecutivo: "Ejecutivo Uno",
        telefono: "+56 9 1234 5678",
      }),
      crearLead({
        id: "otra-etapa",
        nombre: "Otra",
        apellido: "Etapa",
        etapa: "NUEVO_LEAD",
        nombreEjecutivo: "Ejecutivo Uno",
        telefono: "+56 9 1234 5678",
      }),
      crearLead({
        id: "otro-ejecutivo",
        nombre: "Otro",
        apellido: "Ejecutivo",
        etapa: "REVISION_LEGAL" as Lead["etapa"],
        nombreEjecutivo: "Ejecutivo Dos",
        telefono: "+56 9 1234 5678",
      }),
    ]);

    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();

    const [filtroEtapa, filtroEjecutivo] = screen.getAllByRole("combobox");
    const busqueda = screen.getByPlaceholderText("Buscar cliente, RUT, teléfono, email...");
    fireEvent.change(filtroEtapa, { target: { value: "REVISION_LEGAL" } });
    fireEvent.change(filtroEjecutivo, { target: { value: "Ejecutivo Uno" } });
    fireEvent.change(busqueda, { target: { value: "+56912345678" } });

    expect(screen.getByText("Objetivo Correcto")).toBeTruthy();
    expect(screen.queryByText("Otra Etapa")).toBeNull();
    expect(screen.queryByText("Otro Ejecutivo")).toBeNull();

    fireEvent.change(busqueda, { target: { value: "+56 9 1234 5678" } });
    expect(screen.getByText("Objetivo Correcto")).toBeTruthy();
  });

  it("distingue el estado vacío normal del resultado vacío por filtros", async () => {
    configurarContextos([]);
    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();

    expect(screen.getAllByText("No hay oportunidades en esta etapa")).toHaveLength(3);
    expect(screen.queryByText("No encontramos oportunidades con estos criterios.")).toBeNull();

    fireEvent.change(
      screen.getByPlaceholderText("Buscar cliente, RUT, teléfono, email..."),
      { target: { value: "sin-coincidencias" } },
    );

    expect(screen.getAllByText("No encontramos oportunidades con estos criterios.")).toHaveLength(3);
    expect(screen.queryByText("No hay oportunidades en esta etapa")).toBeNull();
  });

  it("mantiene el movimiento entre etapas conectado a la persistencia del contexto", async () => {
    const lead = crearLead({ id: "lead-movible", telefono: "+56 9 1111 2222" });
    configurarContextos([lead]);
    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: "Revisión Legal" })).toBeTruthy();
    expect(dndHarness.onDragEnd).not.toBeNull();

    await act(async () => {
      await dndHarness.onDragEnd?.({
        draggableId: lead.id,
        type: "DEFAULT",
        reason: "DROP",
        mode: "FLUID",
        source: { droppableId: "NUEVO_LEAD", index: 0 },
        destination: { droppableId: "CONTACTO_INICIAL", index: 0 },
        combine: null,
      });
    });

    expect(mocks.moverEtapa).toHaveBeenCalledWith("lead-movible", "CONTACTO_INICIAL");
    expect(mocks.agregarActividad).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: "lead-movible", tipo: "cambio_estado" }),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
