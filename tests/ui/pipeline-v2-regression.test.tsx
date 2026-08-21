import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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

describe("regresiones del pipeline V3", () => {
  it("muestra el esqueleto mientras carga y luego prioriza el tablero", async () => {
    configurarContextos([], true);
    const vista = render(<PipelinePage />);

    expect(screen.getByTestId("pipeline-skeleton")).toBeTruthy();

    configurarContextos([], false);
    vista.rerender(<PipelinePage />);

    expect(screen.queryByTestId("pipeline-skeleton")).toBeNull();
    expect(await screen.findByRole("option", { name: /Revisión Legal \(0\)/ })).toBeTruthy();
    expect(screen.getByTestId("pipeline-column-REVISION_LEGAL")).toBeTruthy();
    expect(screen.queryByText("Total oportunidades")).toBeNull();
    expect(screen.queryByText("Ticket promedio")).toBeNull();
    expect(screen.queryByText("Click en el icono del lead para asignar")).toBeNull();
  });

  it("combina etapa y ejecutivo con búsqueda normalizada por varios campos", async () => {
    configurarContextos([
      crearLead({
        id: "objetivo",
        nombre: "José",
        apellido: "Peña",
        rut: "18.121.211-0",
        etapa: "REVISION_LEGAL" as Lead["etapa"],
        nombreEjecutivo: "Ejecutivo Uno",
        telefono: "+56 9 1234 5678",
        banco: "Banco Estado",
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
    expect(await screen.findByRole("option", { name: /Revisión Legal \(2\)/ })).toBeTruthy();

    const [filtroEtapa, filtroEjecutivo] = screen.getAllByRole("combobox");
    const busqueda = screen.getByRole("searchbox", { name: "Buscar oportunidades" });
    fireEvent.change(filtroEtapa, { target: { value: "REVISION_LEGAL" } });
    fireEvent.change(filtroEjecutivo, { target: { value: "Ejecutivo Uno" } });
    fireEvent.change(busqueda, { target: { value: "jose pena" } });

    expect(screen.getByText("José Peña")).toBeTruthy();
    expect(screen.queryByText("Otra Etapa")).toBeNull();
    expect(screen.queryByText("Otro Ejecutivo")).toBeNull();

    for (const consulta of ["181212110", "+56912345678", "banco estado"]) {
      fireEvent.change(busqueda, { target: { value: consulta } });
      expect(screen.getByText("José Peña")).toBeTruthy();
    }
  });

  it("al elegir una etapa muestra solo su columna y conserva su contador", async () => {
    configurarContextos([
      crearLead({ id: "legal", etapa: "REVISION_LEGAL" as Lead["etapa"] }),
      crearLead({ id: "nuevo", etapa: "NUEVO_LEAD" }),
    ]);
    render(<PipelinePage />);
    const filtroEtapa = await screen.findByLabelText("Filtrar por etapa");

    fireEvent.change(filtroEtapa, { target: { value: "REVISION_LEGAL" } });

    expect(screen.getByTestId("pipeline-column-REVISION_LEGAL")).toBeTruthy();
    expect(screen.queryByTestId("pipeline-column-NUEVO_LEAD")).toBeNull();
    expect(screen.getByRole("option", { name: /Revisión Legal \(1\)/ })).toBeTruthy();
  });

  it("abre el detalle completo desde una tarjeta resumida", async () => {
    const lead = crearLead({
      id: "detalle",
      nombre: "María",
      apellido: "Detalle",
      valorPropiedad: 250_000_000,
      pieDisponible: 50_000_000,
      banco: "Banco QA",
      tipoCredito: "Hipotecario",
      notas: "Antecedentes completos",
    });
    configurarContextos([lead]);
    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: /Revisión Legal/ })).toBeTruthy();

    expect(screen.queryByText("Valor propiedad")).toBeNull();
    expect(screen.queryByText("Antecedentes completos")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Abrir ficha de María Detalle" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Valor propiedad")).toBeTruthy();
    expect(screen.getByText("Antecedentes completos")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ver ficha completa/ })).toBeTruthy();
  });

  it("distingue el estado vacío normal del resultado vacío por filtros", async () => {
    configurarContextos([]);
    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: /Revisión Legal \(0\)/ })).toBeTruthy();

    expect(screen.getAllByText("No hay oportunidades en esta etapa")).toHaveLength(3);
    expect(screen.queryByText("No encontramos oportunidades con estos criterios.")).toBeNull();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar oportunidades" }),
      { target: { value: "sin-coincidencias" } },
    );

    expect(screen.getAllByText("No encontramos oportunidades con estos criterios.")).toHaveLength(3);
    expect(screen.queryByText("No hay oportunidades en esta etapa")).toBeNull();
  });

  it("mantiene el movimiento entre etapas conectado a la persistencia del contexto", async () => {
    const lead = crearLead({ id: "lead-movible", telefono: "+56 9 1111 2222" });
    configurarContextos([lead]);
    render(<PipelinePage />);
    expect(await screen.findByRole("option", { name: /Revisión Legal/ })).toBeTruthy();
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
