import { UserX, Clock } from "lucide-react";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useTodayAbsences } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AbsencesWidget() {
  const { data: school } = useCurrentSchool();
  const { data: absences, isLoading } = useTodayAbsences(school?.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!absences || absences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
        <UserX className="h-8 w-8 opacity-30" />
        <p className="text-sm">Aucune absence enregistrée aujourd'hui</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {absences.map((a, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-smooth"
        >
          <div className="flex items-center gap-2">
            {a.status === "absent" ? (
              <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-warning flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{a.name || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{a.class}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                a.status === "absent"
                  ? "border-destructive/40 text-destructive"
                  : "border-warning/40 text-warning"
              )}
            >
              {a.status === "absent" ? "Absent" : "Retard"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
