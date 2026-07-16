"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  Edit,
  Save,
  X,
  Link,
  Award,
  Clock,
  FileText,
  Camera,
} from "lucide-react";
import { ROLES_CONFIG, ESTADOS_USUARIO_CONFIG } from "@/tipos";
import { toast } from "sonner";
import type { Usuario } from "@/tipos";

interface PerfilProfesionalProps {
  usuario: Usuario;
  onActualizar: (datos: Partial<Usuario>) => void;
  esPropioPerfil?: boolean;
}

export function PerfilProfesional({ usuario, onActualizar, esPropioPerfil = true }: PerfilProfesionalProps) {
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    telefono: usuario.telefono || "",
    cargo: usuario.cargo || "",
    departamento: usuario.departamento || "",
    telefonoTrabajo: usuario.telefonoTrabajo || "",
    direccion: usuario.direccion || "",
    ciudad: usuario.ciudad || "",
    pais: usuario.pais || "Chile",
    fechaIngreso: usuario.fechaIngreso || "",
    fechaNacimiento: usuario.fechaNacimiento || "",
    biografia: usuario.biografia || "",
    linkedin: usuario.linkedin || "",
    website: usuario.website || "",
  });

  const rolConfig = ROLES_CONFIG[usuario.rol];
  const estadoConfig = ESTADOS_USUARIO_CONFIG[usuario.estado];

  const handleGuardar = () => {
    onActualizar(datos);
    setEditando(false);
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="space-y-6">
      {/* Header del Perfil */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Información del perfil */}
        <div className="px-6 pb-6 -mt-14 relative">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white">
                  {usuario.nombre[0]}{usuario.apellido[0]}
                </div>
                {esPropioPerfil && (
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-colors">
                    <Camera size={14} className="text-slate-600" />
                  </button>
                )}
              </div>

              {/* Info del usuario */}
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {usuario.nombre} {usuario.apellido}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
                    <Briefcase size={13} /> {datos.cargo || rolConfig.label}
                  </span>
                  <div className="w-px h-4 bg-slate-200" />
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${rolConfig.color}`}>
                    {rolConfig.label}
                  </span>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${estadoConfig.color}`}>
                    {estadoConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Mail size={11} /> {usuario.email}
                  </span>
                  {usuario.telefono && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone size={11} /> {usuario.telefono}
                    </span>
                  )}
                  {datos.ciudad && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin size={11} /> {datos.ciudad}, {datos.pais}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botón editar */}
            {esPropioPerfil && (
              <div className="pb-2">
                {!editando ? (
                  <button
                    onClick={() => setEditando(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                  >
                    <Edit size={14} /> Editar Perfil
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditando(false)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                    >
                      <X size={14} /> Cancelar
                    </button>
                    <button
                      onClick={handleGuardar}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <Save size={14} /> Guardar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Información Personal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de Contacto */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              Información Personal
            </h3>
            
            {editando ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                  <input
                    type="text"
                    value={datos.nombre}
                    onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Apellido *</label>
                  <input
                    type="text"
                    value={datos.apellido}
                    onChange={(e) => setDatos({ ...datos, apellido: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Email *</label>
                  <input
                    type="email"
                    value={datos.email}
                    onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Teléfono</label>
                  <input
                    type="tel"
                    value={datos.telefono}
                    onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={datos.fechaNacimiento}
                    onChange={(e) => setDatos({ ...datos, fechaNacimiento: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">País</label>
                  <select
                    value={datos.pais}
                    onChange={(e) => setDatos({ ...datos, pais: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Chile">Chile</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Perú">Perú</option>
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<User size={13} />} label="Nombre completo" value={`${usuario.nombre} ${usuario.apellido}`} />
                <InfoRow icon={<Mail size={13} />} label="Email" value={usuario.email} />
                <InfoRow icon={<Phone size={13} />} label="Teléfono personal" value={usuario.telefono || "No registrado"} />
                <InfoRow icon={<Calendar size={13} />} label="Fecha de nacimiento" value={datos.fechaNacimiento || "No especificado"} />
                <InfoRow icon={<MapPin size={13} />} label="País" value={datos.pais || "No especificado"} />
                <InfoRow icon={<Globe size={13} />} label="Miembro desde" value={usuario.creadoEn.toLocaleDateString("es-CL")} />
              </div>
            )}
          </div>

          {/* Información Laboral */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-500" />
              Información Laboral
            </h3>
            
            {editando ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Cargo</label>
                  <input
                    type="text"
                    value={datos.cargo}
                    onChange={(e) => setDatos({ ...datos, cargo: e.target.value })}
                    placeholder="Ej: Ejecutivo Comercial"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Departamento</label>
                  <input
                    type="text"
                    value={datos.departamento}
                    onChange={(e) => setDatos({ ...datos, departamento: e.target.value })}
                    placeholder="Ej: Ventas"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Teléfono de trabajo</label>
                  <input
                    type="tel"
                    value={datos.telefonoTrabajo}
                    onChange={(e) => setDatos({ ...datos, telefonoTrabajo: e.target.value })}
                    placeholder="+56 2 2123 4567"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha de ingreso</label>
                  <input
                    type="date"
                    value={datos.fechaIngreso}
                    onChange={(e) => setDatos({ ...datos, fechaIngreso: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Dirección</label>
                  <input
                    type="text"
                    value={datos.direccion}
                    onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
                    placeholder="Av. Providencia 1234, Santiago"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Briefcase size={13} />} label="Cargo" value={datos.cargo || "No especificado"} />
                <InfoRow icon={<Building2 size={13} />} label="Departamento" value={datos.departamento || "No especificado"} />
                <InfoRow icon={<Phone size={13} />} label="Teléfono de trabajo" value={datos.telefonoTrabajo || "No registrado"} />
                <InfoRow icon={<Calendar size={13} />} label="Fecha de ingreso" value={datos.fechaIngreso || "No especificado"} />
                <InfoRow icon={<MapPin size={13} />} label="Dirección" value={datos.direccion || "No especificado"} />
                <InfoRow icon={<Award size={13} />} label="Rol" value={rolConfig.label} />
              </div>
            )}
          </div>

          {/* Biografía */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-purple-500" />
              Biografía
            </h3>
            
            {editando ? (
              <textarea
                value={datos.biografia}
                onChange={(e) => setDatos({ ...datos, biografia: e.target.value })}
                placeholder="Cuéntanos sobre ti, tu experiencia y especialidades..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            ) : (
              <p className="text-[12px] text-slate-600 leading-relaxed">
                {datos.biografia || "No hay biografía agregada. Haz clic en 'Editar Perfil' para agregar una descripción sobre ti, tu experiencia y especialidades."}
              </p>
            )}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Información de contacto rápido */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              Contacto Rápido
            </h3>
            <div className="space-y-3">
              <a
                href={`mailto:${usuario.email}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Mail size={16} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">Email</div>
                  <div className="text-[10px] text-slate-500 truncate">{usuario.email}</div>
                </div>
              </a>
              
              {usuario.telefono && (
                <a
                  href={`tel:${usuario.telefono}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Phone size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-800">Teléfono</div>
                    <div className="text-[10px] text-slate-500">{usuario.telefono}</div>
                  </div>
                </a>
              )}

              {datos.linkedin && (
                <a
                  href={datos.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Link size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-800">LinkedIn</div>
                    <div className="text-[10px] text-slate-500">Ver perfil</div>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Redes sociales (si está editando) */}
          {editando && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-500" />
                Redes y Enlaces
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">LinkedIn</label>
                  <input
                    type="url"
                    value={datos.linkedin}
                    onChange={(e) => setDatos({ ...datos, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/tu-perfil"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Sitio web</label>
                  <input
                    type="url"
                    value={datos.website}
                    onChange={(e) => setDatos({ ...datos, website: e.target.value })}
                    placeholder="https://tusitio.com"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Información de la cuenta */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Información de la Cuenta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Rol</span>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${rolConfig.color}`}>
                  {rolConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Estado</span>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estadoConfig.color}`}>
                  {estadoConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Último acceso</span>
                <span className="text-[11px] text-slate-700 font-medium">
                  {usuario.ultimoAcceso ? usuario.ultimoAcceso.toLocaleDateString("es-CL") : "Nunca"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Miembro desde</span>
                <span className="text-[11px] text-slate-700 font-medium">
                  {usuario.creadoEn.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para filas de información
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{label}</div>
        <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
      </div>
    </div>
  );
}
