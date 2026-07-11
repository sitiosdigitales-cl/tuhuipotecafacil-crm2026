import type { DocumentoLead, RegistroAuditoria, Usuario } from "@/tipos";

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nombre: "Super", apellido: "Admin", email: "admin@tuhipotecafacil.cl", rol: "SUPER_ADMIN", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 3600000), creadoEn: new Date("2024-01-01"), doisFA: true },
  { id: "u2", nombre: "Andrés", apellido: "Pérez", email: "andres.perez@tuhipotecafacil.cl", rol: "ADMIN", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 7200000), creadoEn: new Date("2024-02-15"), doisFA: true },
  { id: "u3", nombre: "Carolina", apellido: "Muñoz", email: "carolina.munoz@tuhipotecafacil.cl", rol: "GERENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 86400000), creadoEn: new Date("2024-03-10") },
  { id: "u4", nombre: "Diego", apellido: "Silva", email: "diego.silva@tuhipotecafacil.cl", rol: "AGENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 172800000), creadoEn: new Date("2024-04-05") },
  { id: "u5", nombre: "Valentina", apellido: "Torres", email: "valentina.torres@tuhipotecafacil.cl", rol: "AGENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 259200000), creadoEn: new Date("2024-05-20") },
  { id: "u6", nombre: "Javier", apellido: "Morales", email: "javier.morales@tuhipotecafacil.cl", rol: "AGENTE", estado: "SUSPENDIDO", ultimoAcceso: new Date(Date.now() - 604800000), creadoEn: new Date("2024-06-15") },
  { id: "u7", nombre: "Ana", apellido: "Torres", email: "ana.torres@tuhipotecafacil.cl", rol: "AGENTE", estado: "INACTIVO", ultimoAcceso: new Date(Date.now() - 2592000000), creadoEn: new Date("2024-07-01") },
  { id: "u8", nombre: "Roberto", apellido: "Silva", email: "roberto.silva@tuhipotecafacil.cl", rol: "GERENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 43200000), creadoEn: new Date("2024-08-10"), doisFA: true },
];

export const RENDIMIENTO_BANCOS = [
  { nombre: "Banco de Chile", montoTotal: 3250000000, color: "#E31837" },
  { nombre: "Santander", montoTotal: 2980000000, color: "#EC0000" },
  { nombre: "Bci", montoTotal: 2450000000, color: "#003DA5" },
  { nombre: "Itaú", montoTotal: 2100000000, color: "#F7941D" },
  { nombre: "Scotiabank", montoTotal: 1850000000, color: "#EC111A" },
];

export const DOCUMENTOS_MOCK: DocumentoLead[] = [
  { id: "d1", leadId: "lead-1", leadNombre: "María González", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 604800000) },
  { id: "d2", leadId: "lead-1", leadNombre: "María González", nombre: "Contrato de Trabajo", tipo: "CONTRATO_TRABAJO", estado: "APROBADO", creadoEn: new Date(Date.now() - 518400000) },
  { id: "d3", leadId: "lead-1", leadNombre: "María González", nombre: "Comprobante de Ingresos", tipo: "COMPROBANTE_INGRESOS", estado: "EN_REVISION", creadoEn: new Date(Date.now() - 432000000) },
  { id: "d4", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 345600000) },
  { id: "d5", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 259200000) },
  { id: "d6", leadId: "lead-3", leadNombre: "Juan Pérez", nombre: "Valorización", tipo: "VALORIZACION", estado: "RECHAZADO", creadoEn: new Date(Date.now() - 172800000) },
  { id: "d7", leadId: "lead-4", leadNombre: "Ana Torres", nombre: "Declaración de Renta", tipo: "DECLARACION_RENTA", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 86400000) },
  { id: "d8", leadId: "lead-5", leadNombre: "Diego Díaz", nombre: "Certificado de Pie", tipo: "CERTIFICADO_PIE", estado: "APROBADO", creadoEn: new Date(Date.now() - 604800000) },
];

export const AUDITORIA_MOCK: RegistroAuditoria[] = [
  { id: "a1", usuarioId: "u1", usuarioNombre: "Super Admin", accion: "LOGIN", modulo: "Sistema", ip: "192.168.1.100", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 300000) },
  { id: "a2", usuarioId: "u2", usuarioNombre: "Andrés Pérez", accion: "CREAR", modulo: "Leads", registroId: "lead-100", registroNombre: "María González", ip: "192.168.1.101", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 600000) },
  { id: "a3", usuarioId: "u3", usuarioNombre: "Carolina Muñoz", accion: "EDITAR", modulo: "Pipeline", registroId: "etapa-3", registroNombre: "Contactado", valorAnterior: "Etapa anterior", valorNuevo: "Etapa modificada", ip: "192.168.1.102", navegador: "Firefox 121", dispositivo: "Desktop", fecha: new Date(Date.now() - 900000) },
  { id: "a4", usuarioId: "u1", usuarioNombre: "Super Admin", accion: "CAMBIO_ROL", modulo: "Usuarios", registroId: "u6", registroNombre: "Javier Morales", valorAnterior: "Agente", valorNuevo: "Suspendido", motivo: "Inactividad prolongada", ip: "192.168.1.100", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 1800000) },
  { id: "a5", usuarioId: "u4", usuarioNombre: "Diego Silva", accion: "CREAR", modulo: "Documentos", registroId: "doc-50", registroNombre: "Certificado AFP", ip: "192.168.1.103", navegador: "Safari 17", dispositivo: "iPhone", fecha: new Date(Date.now() - 3600000) },
];
