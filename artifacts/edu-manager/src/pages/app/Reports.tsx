import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear } from "@/hooks/useSchool";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Loader2, TrendingUp, Users, GraduationCap, Wallet, ClipboardCheck, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(215 80% 45%)", "hsl(142 70% 42%)", "hsl(38 92% 50%)", "hsl(0 80% 55%)", "hsl(271 81% 56%)", "hsl(199 89% 48%)"];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);

  const reportQ = useQuery({
    queryKey: ["reports", school?.id, year?.id],
    enabled: !!school?.id,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const sid = school!.id;

      const [
        studentsRes, classesRes, staffRes, subjectsRes,
        enrollmentsRes, paymentsRes, gradesRes, attendanceRes,
      ] = await Promise.all([
        supabase.from("students").select("id, status, enrollment_date, gender").eq("school_id", sid),
        supabase.from("classes").select("id, name, capacity").eq("school_id", sid),
        supabase.from("profiles").select("id").eq("school_id", sid),
        supabase.from("subjects").select("id").eq("school_id", sid),
        supabase.from("enrollments").select("student_id, class_id, status, enrolled_at").eq("school_id", sid),
        supabase.from("fee_payments").select("amount, paid_at").eq("school_id", sid),
        supabase.from("grades").select("score, assessments!inner(school_id, max_score, coefficient)").eq("assessments.school_id", sid).not("score", "is", null).limit(1000),
        supabase.from("attendance_sessions").select("id, session_date, class:classes(name), attendances(status)").eq("school_id", sid).limit(200),
      ]);

      const students = studentsRes.data ?? [];
      const classes = classesRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const grades = (gradesRes.data ?? []) as any[];
      const sessions = (attendanceRes.data ?? []) as any[];
      const enrollments = (enrollmentsRes.data ?? []) as any[];

      // ── Enrollment by month ─────────────────────────────
      const enrollByMonth: Record<string, number> = {};
      students.forEach((s) => {
        const m = (s.enrollment_date ?? "").slice(0, 7);
        if (m) enrollByMonth[m] = (enrollByMonth[m] ?? 0) + 1;
      });
      const enrollChart = Object.entries(enrollByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => ({
          month: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          inscrits: count,
        }));

      // ── Finance by month ────────────────────────────────
      const finByMonth: Record<string, number> = {};
      payments.forEach((p) => {
        const m = (p.paid_at ?? "").slice(0, 7);
        if (m) finByMonth[m] = (finByMonth[m] ?? 0) + Number(p.amount ?? 0);
      });
      const finChart = Object.entries(finByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, amount]) => ({
          month: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          montant: amount,
        }));

      // ── Gender split ────────────────────────────────────
      const genderMap: Record<string, number> = {};
      students.forEach((s: any) => { const g = s.gender ?? "non_renseigné"; genderMap[g] = (genderMap[g] ?? 0) + 1; });
      const genderChart = Object.entries(genderMap).map(([name, value]) => ({
        name: name === "male" ? "Garçons" : name === "female" ? "Filles" : "N/R",
        value,
      }));

      // ── Attendance rate by class ─────────────────────────
      const classAttMap: Record<string, { name: string; present: number; total: number }> = {};
      sessions.forEach((s: any) => {
        const cName = s.class?.name ?? "—";
        if (!classAttMap[cName]) classAttMap[cName] = { name: cName, present: 0, total: 0 };
        (s.attendances ?? []).forEach((a: any) => {
          classAttMap[cName].total++;
          if (a.status === "present") classAttMap[cName].present++;
        });
      });
      const attendanceChart = Object.values(classAttMap)
        .filter((c) => c.total > 0)
        .map((c) => ({ name: c.name, taux: Math.round((c.present / c.total) * 100) }))
        .sort((a, b) => b.taux - a.taux)
        .slice(0, 10);

      // ── Grade distribution ───────────────────────────────
      const dist = { "16-20": 0, "12-15": 0, "10-11": 0, "0-9": 0 };
      grades.forEach((g: any) => {
        const n20 = (g.score / (g.assessments?.max_score ?? 20)) * 20;
        if (n20 >= 16) dist["16-20"]++;
        else if (n20 >= 12) dist["12-15"]++;
        else if (n20 >= 10) dist["10-11"]++;
        else dist["0-9"]++;
      });
      const gradeDistChart = Object.entries(dist).map(([name, value]) => ({ name, value }));

      // ── Summary stats ────────────────────────────────────
      const activeStudents = students.filter((s) => s.status === "active").length;
      const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
      const avgGrade = grades.length > 0
        ? (grades.reduce((acc, g: any) => acc + (g.score / (g.assessments?.max_score ?? 20)) * 20, 0) / grades.length).toFixed(1)
        : "—";
      const classCount = classes.length;
      const staffCount = staffRes.data?.length ?? 0;
      const subjectCount = subjectsRes.data?.length ?? 0;

      return {
        enrollChart, finChart, genderChart, attendanceChart, gradeDistChart,
        activeStudents, totalRevenue, avgGrade, classCount, staffCount, subjectCount,
        totalStudents: students.length,
        currency: school?.currency ?? "XOF",
      };
    },
  });

  if (!school) return <div className="container py-10 text-muted-foreground">Aucune école configurée.</div>;
  if (reportQ.isLoading) return (
    <div className="container py-20 flex justify-center text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin mr-2" /> Génération des rapports…
    </div>
  );

  const d = reportQ.data!;

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Rapports & Analyses</h1>
        <p className="text-muted-foreground mt-1">{school.name} — vue consolidée</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={GraduationCap} label="Élèves actifs" value={d.activeStudents} color="bg-primary/10 text-primary" />
        <StatCard icon={BookOpen} label="Classes" value={d.classCount} color="bg-info/10 text-info" />
        <StatCard icon={Users} label="Personnel" value={d.staffCount} color="bg-purple-100 text-purple-600" />
        <StatCard icon={TrendingUp} label="Matières" value={d.subjectCount} color="bg-orange-100 text-orange-600" />
        <StatCard icon={ClipboardCheck} label="Moy. générale" value={`${d.avgGrade}/20`} color="bg-success/10 text-success" />
        <StatCard icon={Wallet} label="Revenus totaux" value={`${(d.totalRevenue / 1000).toFixed(0)}k`} sub={d.currency} color="bg-emerald-100 text-emerald-600" />
      </div>

      <Tabs defaultValue="effectifs">
        <TabsList className="mb-4">
          <TabsTrigger value="effectifs">Effectifs</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="presence">Présence</TabsTrigger>
        </TabsList>

        {/* Effectifs */}
        <TabsContent value="effectifs" className="space-y-5">
          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="border-border/50 shadow-card lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Évolution des inscriptions</CardTitle></CardHeader>
              <CardContent>
                {d.enrollChart.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Pas de données d'inscription.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={d.enrollChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-en" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(215 80% 45%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(215 80% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: any) => [v, "Inscrits"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="inscrits" stroke="hsl(215 80% 45%)" strokeWidth={2} fill="url(#grad-en)" dot={{ r: 3, fill: "hsl(215 80% 45%)" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-card">
              <CardHeader><CardTitle className="text-base">Répartition genre</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {d.genderChart.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Pas de données.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={d.genderChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {d.genderChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance">
          <Card className="border-border/50 shadow-card">
            <CardHeader><CardTitle className="text-base">Revenus mensuels ({d.currency})</CardTitle></CardHeader>
            <CardContent>
              {d.finChart.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Aucun paiement enregistré.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.finChart} barSize={28} margin={{ top: 4, right: 4, left: -5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-fin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 70% 42%)" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(142 70% 42%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v: any) => [`${v.toLocaleString("fr-FR")} ${d.currency}`, "Encaissé"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="montant" fill="url(#grad-fin)" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card className="border-border/50 shadow-card">
            <CardHeader><CardTitle className="text-base">Distribution des notes</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              {d.gradeDistChart.every((r) => r.value === 0) ? (
                <p className="text-muted-foreground text-sm py-4">Aucune note enregistrée.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.gradeDistChart} barSize={60} margin={{ top: 4, right: 4, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: any) => [v, "Notes"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {d.gradeDistChart.map((_, i) => <Cell key={i} fill={["hsl(215 80% 45%)", "hsl(142 70% 42%)", "hsl(38 92% 50%)", "hsl(0 80% 55%)"][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Présence */}
        <TabsContent value="presence">
          <Card className="border-border/50 shadow-card">
            <CardHeader><CardTitle className="text-base">Taux de présence par classe (%)</CardTitle></CardHeader>
            <CardContent>
              {d.attendanceChart.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Aucune session de présence enregistrée.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.attendanceChart} layout="vertical" margin={{ top: 4, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Présence"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="taux" fill="hsl(215 80% 45%)" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
