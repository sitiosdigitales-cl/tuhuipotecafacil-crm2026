import { redirect } from "next/navigation";

/**
 * La raíz solo decide a dónde entrar.
 *
 * Antes era un componente cliente que montaba AuthProvider para leer la sesión
 * y redirigir. Ya no hace falta: el proxy verifica el token antes de que la
 * petición llegue acá, así que a quien no tenga sesión lo manda al login por
 * su cuenta. Como server component, no baja JavaScript.
 */
export default function Home() {
  redirect("/dashboard");
}
