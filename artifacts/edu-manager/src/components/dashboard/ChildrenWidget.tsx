import { Link } from "react-router-dom";
import { GraduationCap, Users } from "lucide-react";
import { useChildrenOverview } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ChildrenWidget() {
  const { data: children, isLoading } = useChildrenOverview();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
        <Users className="h-8 w-8 opacity-30" />
        <p className="text-sm">Aucun enfant associé à votre compte</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {children.map((child: any) => (
        <Link
          key={child.id}
          to={`/app/students/${child.id}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-smooth"
        >
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={child.photo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {child.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{child.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GraduationCap className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{child.className}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs flex-shrink-0",
              child.status === "active"
                ? "border-success/40 text-success"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {child.status === "active" ? "Actif" : child.status}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
