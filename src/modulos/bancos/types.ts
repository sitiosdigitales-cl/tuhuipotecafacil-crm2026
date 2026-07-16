export interface Banco {
  id: string;
  nombre: string;
  color: string;
  estado: "ACTIVO" | "INACTIVO";
  convenio: string;
  tasaBase: number;
  tasaPreferencial: number;
  cae: number;
  financiamientoMaximo: number;
  plazoMaximo: number;
  pieMinimo: number;
  pieMaximo: number;
  prepago: boolean;
  complementoRenta: boolean;
  independientes: boolean;
  empresas: boolean;
  productos: string[];
  requisitos: string[];
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  contactoWhatsapp: string;
  sucursal: string;
  region: string;
  horarioAtencion: string;
  tiempoAprobacion: string;
  tiempoEscrituracion: string;
  tiempoPago: string;
  comisionConvenio: string;
  requisitosMinimos: string[];
  tasasPorTipo: Record<string, Record<string, number>>;
  // Metricas calculadas
  aprobados?: number;
  enProceso?: number;
  rechazados?: number;
  montoTotal?: number;
  satisfaccion?: number;
}

export const BANCOS_POR_DEFECTO: Omit<Banco, "id">[] = [
  {
    nombre: "Banco de Chile", color: "#E31837", estado: "ACTIVO", convenio: "Premium",
    tasaBase: 4.49, tasaPreferencial: 3.29, cae: 5.15,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Segunda vivienda", "Refinanciamiento", "Fines generales"],
    requisitos: ["Edad entre 18 y 75 anos", "Antiguedad laboral minima 12 meses", "Independientes 24 meses de actividad", "Buen comportamiento financiero", "Sin morosidades vigentes", "Pie desde 10%", "Renta liquida minima $800.000"],
    contactoNombre: "Carlos Mendoza", contactoEmail: "cmendoza@chile.cl", contactoTelefono: "+56 2 2653 1000", contactoWhatsapp: "+56983300597",
    sucursal: "Sucursal Central", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:00",
    tiempoAprobacion: "5-10 dias habiles", tiempoEscrituracion: "30-45 dias", tiempoPago: "24-48 horas despues de escrituracion",
    comisionConvenio: "0.8% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-75 anos", "Antiguedad 12 meses", "Independientes 24 meses", "Renta minima $800.000", "Sin DICOM"],
    tasasPorTipo: { Dependiente: { "15": 3.99, "20": 4.09, "25": 4.19, "30": 4.29 }, Independiente: { "15": 4.19, "20": 4.29, "25": 4.39, "30": 4.49 }, "Convenio Empresa": { "15": 3.69, "20": 3.79, "25": 3.89, "30": 3.99 }, FOGAES: { "15": 3.29, "20": 3.32, "25": 3.35, "30": 3.39 } },
  },
  {
    nombre: "Banco Santander", color: "#EC0000", estado: "ACTIVO", convenio: "Premium",
    tasaBase: 4.50, tasaPreferencial: 3.32, cae: 5.10,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Segunda vivienda", "Refinanciamiento"],
    requisitos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $750.000"],
    contactoNombre: "Maria Lopez", contactoEmail: "mlopez@santander.cl", contactoTelefono: "+56 2 2658 2000", contactoWhatsapp: "+56983300598",
    sucursal: "Sucursal Costanera", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:30",
    tiempoAprobacion: "7-12 dias habiles", tiempoEscrituracion: "35-50 dias", tiempoPago: "48-72 horas despues de escrituracion",
    comisionConvenio: "0.75% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $750.000"],
    tasasPorTipo: { Dependiente: { "15": 4.05, "20": 4.15, "25": 4.25, "30": 4.35 }, Independiente: { "15": 4.25, "20": 4.35, "25": 4.45, "30": 4.55 }, "Convenio Empresa": { "15": 3.72, "20": 3.82, "25": 3.92, "30": 4.02 }, FOGAES: { "15": 3.32, "20": 3.35, "25": 3.38, "30": 3.41 } },
  },
  {
    nombre: "BCI", color: "#0071CE", estado: "ACTIVO", convenio: "Premium",
    tasaBase: 4.55, tasaPreferencial: 3.30, cae: 5.20,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Refinanciamiento", "Fines generales"],
    requisitos: ["Edad 18-75 anos", "Antiguedad 12 meses", "Renta minima $800.000"],
    contactoNombre: "Pedro Garcia", contactoEmail: "pgarcia@bci.cl", contactoTelefono: "+56 2 2669 2000", contactoWhatsapp: "+56983300599",
    sucursal: "Sucursal Providencia", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:00",
    tiempoAprobacion: "5-10 dias habiles", tiempoEscrituracion: "30-45 dias", tiempoPago: "24-48 horas despues de escrituracion",
    comisionConvenio: "0.85% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-75 anos", "Antiguedad 12 meses", "Renta minima $800.000"],
    tasasPorTipo: { Dependiente: { "15": 4.09, "20": 4.19, "25": 4.29, "30": 4.39 }, Independiente: { "15": 4.29, "20": 4.39, "25": 4.49, "30": 4.59 }, "Convenio Empresa": { "15": 3.70, "20": 3.80, "25": 3.90, "30": 4.00 }, FOGAES: { "15": 3.30, "20": 3.33, "25": 3.36, "30": 3.39 } },
  },
  {
    nombre: "BancoEstado", color: "#004B87", estado: "ACTIVO", convenio: "Premium",
    tasaBase: 3.99, tasaPreferencial: 3.41, cae: 4.70,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: false,
    productos: ["Compra primera vivienda", "Segunda vivienda"],
    requisitos: ["Edad 18-75 anos", "Antiguedad 6 meses", "Renta minima $500.000"],
    contactoNombre: "Ana Torres", contactoEmail: "atores@bancostado.cl", contactoTelefono: "+56 2 2661 1000", contactoWhatsapp: "+56983300600",
    sucursal: "Sucursal Plaza de Armas", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 08:30 - 17:30",
    tiempoAprobacion: "3-7 dias habiles", tiempoEscrituracion: "25-40 dias", tiempoPago: "24 horas despues de escrituracion",
    comisionConvenio: "0.70% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-75 anos", "Antiguedad 6 meses", "Renta minima $500.000"],
    tasasPorTipo: { Dependiente: { "15": 3.89, "20": 3.99, "25": 4.09, "30": 4.19 }, Independiente: { "15": 4.09, "20": 4.19, "25": 4.29, "30": 4.39 }, "Convenio Empresa": { "15": 3.59, "20": 3.69, "25": 3.79, "30": 3.89 }, FOGAES: { "15": 3.41, "20": 3.44, "25": 3.47, "30": 3.50 } },
  },
  {
    nombre: "Scotiabank", color: "#EC111A", estado: "ACTIVO", convenio: "Gold",
    tasaBase: 4.60, tasaPreferencial: 3.40, cae: 5.25,
    financiamientoMaximo: 85, plazoMaximo: 30, pieMinimo: 15, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Refinanciamiento"],
    requisitos: ["Edad 18-70 anos", "Antiguedad 18 meses", "Renta minima $900.000"],
    contactoNombre: "Roberto Diaz", contactoEmail: "rdiaz@scotiabank.cl", contactoTelefono: "+56 2 2660 3000", contactoWhatsapp: "+56983300601",
    sucursal: "Sucursal El Golf", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:00",
    tiempoAprobacion: "7-14 dias habiles", tiempoEscrituracion: "40-55 dias", tiempoPago: "48-72 horas despues de escrituracion",
    comisionConvenio: "0.80% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-70 anos", "Antiguedad 18 meses", "Renta minima $900.000"],
    tasasPorTipo: { Dependiente: { "15": 4.14, "20": 4.24, "25": 4.34, "30": 4.44 }, Independiente: { "15": 4.34, "20": 4.44, "25": 4.54, "30": 4.64 }, "Convenio Empresa": { "15": 3.80, "20": 3.90, "25": 4.00, "30": 4.10 }, FOGAES: { "15": 3.40, "20": 3.43, "25": 3.46, "30": 3.49 } },
  },
  {
    nombre: "Itau", color: "#F58220", estado: "ACTIVO", convenio: "Premium",
    tasaBase: 3.39, tasaPreferencial: 3.30, cae: 4.25,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Refinanciamiento", "Fines generales"],
    requisitos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $700.000"],
    contactoNombre: "Laura Martinez", contactoEmail: "lmartinez@itau.cl", contactoTelefono: "+56 2 2665 4000", contactoWhatsapp: "+56983300602",
    sucursal: "Sucursal Apoquindo", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:00",
    tiempoAprobacion: "5-10 dias habiles", tiempoEscrituracion: "30-45 dias", tiempoPago: "24-48 horas despues de escrituracion",
    comisionConvenio: "0.75% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $700.000"],
    tasasPorTipo: { Dependiente: { "15": 3.89, "20": 3.99, "25": 4.09, "30": 4.19 }, Independiente: { "15": 4.09, "20": 4.19, "25": 4.29, "30": 4.39 }, "Convenio Empresa": { "15": 3.59, "20": 3.69, "25": 3.79, "30": 3.89 }, FOGAES: { "15": 3.30, "20": 3.33, "25": 3.36, "30": 3.39 } },
  },
  {
    nombre: "Banco Consorcio", color: "#00A651", estado: "ACTIVO", convenio: "Estadar",
    tasaBase: 4.45, tasaPreferencial: 3.72, cae: 5.05,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Refinanciamiento"],
    requisitos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $700.000"],
    contactoNombre: "Fernando Reyes", contactoEmail: "freyes@consorcio.cl", contactoTelefono: "+56 2 2667 5000", contactoWhatsapp: "+56983300603",
    sucursal: "Sucursal Las Condes", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 18:00",
    tiempoAprobacion: "7-12 dias habiles", tiempoEscrituracion: "35-50 dias", tiempoPago: "48-72 horas despues de escrituracion",
    comisionConvenio: "0.70% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $700.000"],
    tasasPorTipo: { Dependiente: { "15": 4.05, "20": 4.15, "25": 4.25, "30": 4.35 }, Independiente: { "15": 4.25, "20": 4.35, "25": 4.45, "30": 4.55 }, "Convenio Empresa": { "15": 3.82, "20": 3.92, "25": 4.02, "30": 4.12 }, FOGAES: { "15": 3.72, "20": 3.75, "25": 3.78, "30": 3.81 } },
  },
  {
    nombre: "Banco Falabella", color: "#4CAF50", estado: "ACTIVO", convenio: "Estadar",
    tasaBase: 3.70, tasaPreferencial: 3.72, cae: 4.55,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 10, pieMaximo: 20,
    prepago: true, complementoRenta: true, independientes: true, empresas: true,
    productos: ["Compra primera vivienda", "Segunda vivienda", "Refinanciamiento"],
    requisitos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $600.000"],
    contactoNombre: "Patricia Vargas", contactoEmail: "pvargas@falabella.cl", contactoTelefono: "+56 2 2662 6000", contactoWhatsapp: "+56983300604",
    sucursal: "Sucursal Outlet", region: "Metropolitana", horarioAtencion: "Lunes a Sabado 09:00 - 20:00",
    tiempoAprobacion: "5-10 dias habiles", tiempoEscrituracion: "30-45 dias", tiempoPago: "24-48 horas despues de escrituracion",
    comisionConvenio: "0.65% sobre monto desembolsado",
    requisitosMinimos: ["Edad 18-70 anos", "Antiguedad 12 meses", "Renta minima $600.000"],
    tasasPorTipo: { Dependiente: { "15": 3.60, "20": 3.70, "25": 3.80, "30": 3.90 }, Independiente: { "15": 3.80, "20": 3.90, "25": 4.00, "30": 4.10 }, "Convenio Empresa": { "15": 3.40, "20": 3.50, "25": 3.60, "30": 3.70 }, FOGAES: { "15": 3.72, "20": 3.75, "25": 3.78, "30": 3.81 } },
  },
  {
    nombre: "BICE", color: "#003DA5", estado: "ACTIVO", convenio: "Especial",
    tasaBase: 4.35, tasaPreferencial: 4.35, cae: 4.95,
    financiamientoMaximo: 90, plazoMaximo: 30, pieMinimo: 20, pieMaximo: 20,
    prepago: true, complementoRenta: false, independientes: true, empresas: false,
    productos: ["Compra primera vivienda", "Refinanciamiento"],
    requisitos: ["Edad 18-65 anos", "Antiguedad 24 meses", "Renta minima $1.000.000", "Sin DICOM"],
    contactoNombre: "Sergio Morales", contactoEmail: "smorales@bice.cl", contactoTelefono: "+56 2 2668 7000", contactoWhatsapp: "+56983300605",
    sucursal: "Sucursal Vitacura", region: "Metropolitana", horarioAtencion: "Lunes a Viernes 09:00 - 17:30",
    tiempoAprobacion: "10-15 dias habiles", tiempoEscrituracion: "45-60 dias", tiempoPago: "72 horas despues de escrituracion",
    comisionConvenio: "Segun evaluacion",
    requisitosMinimos: ["Edad 18-65 anos", "Antiguedad 24 meses", "Renta minima $1.000.000", "Sin DICOM", "Pie desde 20%"],
    tasasPorTipo: { Dependiente: { "15": 3.95, "20": 4.05, "25": 4.15, "30": 4.25 }, Independiente: { "15": 4.15, "20": 4.25, "25": 4.35, "30": 4.45 }, "Convenio Empresa": { "15": 3.85, "20": 3.95, "25": 4.05, "30": 4.15 }, FOGAES: { "15": 4.35, "20": 4.35, "25": 4.35, "30": 4.35 } },
  },
];