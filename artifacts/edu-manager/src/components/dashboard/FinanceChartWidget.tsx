import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useFinanceChart } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function FinanceChartWidget() {
  const { data: school } = useCurrentSchool();
  const { data: chart, isLoading } = useFinanceChart(school?.id);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  if (!chart || chart.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Aucun paiement enregistré ces 30 derniers jours.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chart} barSize={16} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-finance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 70% 42%)" stopOpacity={1} />
            <stop offset="100%" stopColor="hsl(142 70% 42%)" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v > 999 ? (v / 1000).toFixed(0) + "k" : v}`}
        />
        <Tooltip
          formatter={(v: any) => [`${v.toLocaleString("fr-FR")} FCFA`, "Encaissé"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
        />
        <Bar dataKey="montant" fill="url(#grad-finance)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
