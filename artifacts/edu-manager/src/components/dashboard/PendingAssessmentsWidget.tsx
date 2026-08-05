import { Link } from "react-router-dom";
import { FileText, ChevronRight } from "lucide-react";
import { useCurrentSchool } from "@/hooks/useSchool";
import { usePendingAssessments } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function PendingAssessmentsWidget() {
  const { data: school } = useCurrentSchool();
  const { data: assessments, isLoading } = usePendingAssessments(school?.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-5 gap-2 text-muted-foreground">
        <FileText className="h-8 w-8 opacity-30" />
        <p className="text-sm">Aucune évaluation récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {assessments.map((a: any) => {
        const color = a.subject?.color ?? "#3b82f6";
        return (
          <Link
            key={a.id}
            to="/app/grades"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-smooth group"
          >
            <div
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {a.subject?.name} · {a.class?.name} · /{a.max_score}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(a.assessment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-smooth" />
          </Link>
        );
      })}
    </div>
  );
}
