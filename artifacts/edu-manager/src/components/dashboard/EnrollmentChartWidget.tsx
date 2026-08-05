import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useStudentEnrollmentChart } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function EnrollmentChartWidget() {
  const { data: school } = useCurrentSchool();
  const { data: chart, isLoading } = useStudentEnrollmentChart(school?.id);

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (!chart || chart.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Aucune donnée d'inscription disponible.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-enroll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(215 80% 45%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(215 80% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v: any) => [v, "Nouveaux inscrits"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
        />
        <Area
          type="monotone"
          dataKey="inscrits"
          stroke="hsl(215 80% 45%)"
          strokeWidth={2}
          fill="url(#grad-enroll)"
          dot={{ r: 3, fill: "hsl(215 80% 45%)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
