import { useAuth } from "@/providers/AuthProvider";
import { ROLE_META } from "@/lib/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Check } from "lucide-react";

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRole } = useAuth();

  if (!activeRole) {
    return (
      <div className="rounded-lg bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/60">
        Aucun rôle attribué
      </div>
    );
  }

  const meta = ROLE_META[activeRole];
  const Icon = meta.icon;

  if (roles.length === 1) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/60 px-3 py-2">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-sidebar-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Mon rôle
          </div>
          <div className="text-sm font-medium truncate">{meta.shortLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 rounded-lg bg-sidebar-accent/60 hover:bg-sidebar-accent transition-smooth px-3 py-2 text-left">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Vue actuelle
            </div>
            <div className="text-sm font-medium truncate">{meta.shortLabel}</div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs">Changer de vue</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((r) => {
          const m = ROLE_META[r];
          const RIcon = m.icon;
          const active = r === activeRole;
          return (
            <DropdownMenuItem key={r} onClick={() => setActiveRole(r)}>
              <RIcon className={`mr-2 h-4 w-4 ${m.color}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
              </div>
              {active && <Check className="ml-2 h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
