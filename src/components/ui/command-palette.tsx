"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Kanban,
  Users,
  Building2,
  FileText,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = React.useState("");

  const commands: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => router.push("/dashboard"), category: "Navegación" },
    { id: "pipeline", label: "Pipeline Comercial", icon: Kanban, action: () => router.push("/pipeline"), category: "Navegación" },
    { id: "leads", label: "Leads", icon: Users, action: () => router.push("/leads"), category: "Navegación" },
    { id: "clientes", label: "Clientes", icon: Users, action: () => router.push("/clientes"), category: "Navegación" },
    { id: "bancos", label: "Bancos", icon: Building2, action: () => router.push("/bancos"), category: "Navegación" },
    { id: "documentos", label: "Documentos", icon: FileText, action: () => router.push("/documentos"), category: "Navegación" },
    { id: "agenda", label: "Agenda", icon: Calendar, action: () => router.push("/agenda"), category: "Navegación" },
    { id: "tareas", label: "Tareas", icon: CheckSquare, action: () => router.push("/tareas"), category: "Navegación" },
    { id: "reportes", label: "Reportes", icon: BarChart3, action: () => router.push("/reportes"), category: "Navegación" },
    { id: "conversaciones", label: "Conversaciones", icon: MessageSquare, action: () => router.push("/conversaciones"), category: "Navegación" },
    { id: "configuracion", label: "Configuración", icon: Settings, action: () => router.push("/configuracion"), category: "Navegación" },
    { id: "theme", label: theme === "dark" ? "Modo Claro" : "Modo Oscuro", icon: theme === "dark" ? Sun : Moon, action: () => setTheme(theme === "dark" ? "light" : "dark"), category: "Sistema" },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setSearch(""); // eslint-disable-line react-hooks/set-state-in-effect -- Reset intencional al cerrar dialog
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-4">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar comandos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-4 bg-transparent text-sm outline-none placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {category}
              </div>
              {items.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <cmd.icon size={16} className="text-slate-400" />
                  {cmd.label}
                </button>
              ))}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-slate-400">
              No se encontraron comandos
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
