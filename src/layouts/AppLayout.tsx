import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useAuth } from "@/providers/AuthProvider";
import { NAV_BY_ROLE } from "@/lib/navigation";
import { ROLE_META } from "@/lib/roles";
import { LogOut, User as UserIcon, Search, Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { user, loading, activeRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const groups = activeRole ? NAV_BY_ROLE[activeRole] : [];
  const roleMeta = activeRole ? ROLE_META[activeRole] : null;
  const initials =
    (user.user_metadata?.full_name as string | undefined)
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || user.email?.[0]?.toUpperCase() || "U";

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/app">
          <Logo size="md" />
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border">
        <RoleSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/app"
                    ? location.pathname === "/app"
                    : location.pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] font-semibold rounded-full bg-primary/20 text-primary px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent transition-smooth">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {(user.user_metadata?.full_name as string) || user.email}
                </div>
                {roleMeta && (
                  <div className="text-xs text-sidebar-foreground/60 truncate">
                    {roleMeta.shortLabel}
                  </div>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-xs text-muted-foreground">Connecté en tant que</div>
              <div className="text-sm font-medium truncate">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* ===== Sidebar desktop ===== */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* ===== Sidebar mobile (Sheet) ===== */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* ===== Main ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40 flex items-center px-3 lg:px-8 gap-3">
          {/* Burger mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="lg:hidden">
            <Logo size="sm" showText={false} />
          </div>
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher un élève, une classe…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-smooth"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
