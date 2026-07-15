/**
 * Módulo Usuarios - TuHipotecaFacil CRM
 */

export {
  USUARIOS_PERMISOS,
  USUARIOS_ROLES,
  USUARIOS_ESTADOS,
  tienePermisoUsuario,
} from "./config";

export {
  UsuarioSchema,
  CrearUsuarioSchema,
  EditarUsuarioSchema,
  validarCrearUsuario,
} from "./validaciones";

export type { CrearUsuarioInput, EditarUsuarioInput } from "./validaciones";

export {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
} from "./servicios";

export { useUser } from "./hooks";
