import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMyStudent } from "@/hooks/useMyStudent";
import { useMyRecentGrades } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function gradeColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.75) return "hsl(142 70% 42%)";
  if (pct >= 0.5) return "hsl(215 80% 45%)";
  if (pct >= 0.3) return "hsl(38 92% 50%)";
  return "hsl(0 80% 55%)";
}

export function RecentGradesWidget() {
  const { data: student } = useMyStudent();
  const { data: grades, isLoading } = useMyRecentGrades(student?.id);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
    );
  }

  if (!grades || grades.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Aucune note disponible pour l'instant.
      </p>
    );
  }

  const chartData = grades.slice(0, 6).map((g: any) => ({
    name: g.assessments?.subject?.name?.slice(0, 6) ?? "—",
    note: parseFloat(((g.score / (g.assessments?.max_score ?? 20)) * 20).toFixed(1)),
    max: 20,
    color: gradeColor(g.score, g.assessments?.max_score ?? 20),
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={chartData} barSize={24} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(v: any) => [`${v}/20`, "Note"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
          />
          <Bar dataKey="note" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {grades.slice(0, 4).map((g: any, i: number) => {
          const score20 = ((g.score / (g.assessments?.max_score ?? 20)) * 20).toFixed(1);
          const color = gradeColor(g.score, g.assessments?.max_score ?? 20);
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate text-muted-foreground">{g.assessments?.name ?? "—"}</span>
              </div>
              <span className="font-semibold ml-2 flex-shrink-0" style={{ color }}>
                {score20}/20
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
