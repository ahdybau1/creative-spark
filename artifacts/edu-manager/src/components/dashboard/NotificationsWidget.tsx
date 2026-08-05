import { Link } from "react-router-dom";
import { Bell, BookOpen, AlertTriangle, Info, MessageSquare } from "lucide-react";
import { useRecentNotifications } from "@/hooks/useDashboardData";
import { useAuth } from "@/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_ICONS: Record<string, any> = {
  grade: BookOpen,
  absence: AlertTriangle,
  message: MessageSquare,
  info: Info,
  alert: AlertTriangle,
};

const TYPE_BG: Record<string, string> = {
  grade: "bg-primary/10 text-primary",
  absence: "bg-warning/10 text-warning",
  message: "bg-accent/10 text-accent",
  alert: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function NotificationsWidget() {
  const { user } = useAuth();
  const { data: notifs, isLoading } = useRecentNotifications(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifs || notifs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
        <Bell className="h-8 w-8 opacity-30" />
        <p className="text-sm">Aucune notification récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {notifs.map((n: any) => {
        const Icon = TYPE_ICONS[n.type] ?? Bell;
        const colorClass = TYPE_BG[n.type] ?? "bg-muted text-muted-foreground";
        const isUnread = !n.read_at;
        return (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-smooth",
              isUnread ? "bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm leading-tight", isUnread ? "font-semibold" : "font-medium")}>
                {n.title}
              </p>
              {n.body && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
              </p>
            </div>
            {isUnread && (
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
