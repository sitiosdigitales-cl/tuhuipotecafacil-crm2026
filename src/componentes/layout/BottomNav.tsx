"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Inicio", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Pipeline", icon: GitBranch, href: "/pipeline" },
  { label: "Leads", icon: Users, href: "/leads" },
  { label: "Tareas", icon: CheckSquare, href: "/tareas" },
  { label: "Más", icon: MoreHorizontal, href: "/reportes" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const activa = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                activa
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} strokeWidth={activa ? 2.5 : 2} />
              <span className={`text-[9px] font-semibold ${activa ? "text-blue-600" : ""}`}>
                {item.label}
              </span>
              {activa && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
