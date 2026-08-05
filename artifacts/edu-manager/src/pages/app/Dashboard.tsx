import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ROLE_META } from "@/lib/roles";
import { DASHBOARD_CONFIGS } from "@/lib/dashboards";
import type { WidgetType } from "@/lib/dashboards";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { useCurrentSchool } from "@/hooks/useSchool";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Plus, ArrowRight } from "lucide-react";

// Widget components
import { TeacherTimetableWidget, StudentTimetableWidget } from "@/components/dashboard/TodayTimetableWidget";
import { RecentGradesWidget } from "@/components/dashboard/RecentGradesWidget";
import { EnrollmentChartWidget } from "@/components/dashboard/EnrollmentChartWidget";
import { FinanceChartWidget } from "@/components/dashboard/FinanceChartWidget";
import { NotificationsWidget } from "@/components/dashboard/NotificationsWidget";
import { AbsencesWidget } from "@/components/dashboard/AbsencesWidget";
import { ChildrenWidget } from "@/components/dashboard/ChildrenWidget";
import { PendingAssessmentsWidget } from "@/components/dashboard/PendingAssessmentsWidget";

function RealWidget({ type }: { type?: WidgetType }) {
  switch (type) {
    case "timetable-teacher":   return <TeacherTimetableWidget />;
    case "timetable-student":   return <StudentTimetableWidget />;
    case "grades-recent":       return <RecentGradesWidget />;
    case "enrollment-chart":    return <EnrollmentChartWidget />;
    case "finance-chart":       return <FinanceChartWidget />;
    case "absences-today":      return <AbsencesWidget />;
    case "children-overview":   return <ChildrenWidget />;
    case "assessments-pending": return <PendingAssessmentsWidget />;
    case "notifications":
    default:
      return <NotificationsWidget />;
  }
}

export default function Dashboard() {
  const { user, activeRole, roles } = useAuth();
  const [fullName, setFullName] = useState<string>("");
  const { data: school } = useCurrentSchool();
  const { data: liveStats } = useDashboardStats(school?.id);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, [user]);

  // No role yet → onboarding
  if (!activeRole || roles.length === 0) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="rounded-3xl border border-border/50 bg-card p-10 shadow-card text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-6">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">Bienvenue sur EduMaster Pro</h1>
          <p className="mt-3 text-muted-foreground">
            Votre compte est créé mais aucun rôle ne vous a encore été attribué. En production, c'est
            l'administration de votre établissement qui le fait.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Pour découvrir la plateforme en mode démo, attribuez-vous un rôle ci-dessous :
          </p>
          <Button asChild className="mt-6 shadow-glow gap-2">
            <Link to="/app/onboarding">
              <Plus className="h-4 w-4" />
              Choisir un rôle de démonstration
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const config = DASHBOARD_CONFIGS[activeRole];
  const meta = ROLE_META[activeRole];
  const Icon = meta.icon;
  const greetName =
    fullName || (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "";

  // Inject live stats for director / deputy_director / accountant
  const displayStats = config.stats.map((s, i) => {
    if (!liveStats) return s;
    if (activeRole === "director" || activeRole === "deputy_director") {
      if (i === 0 && liveStats.attendanceRate !== null)
        return { ...s, value: `${liveStats.presentToday} / ${liveStats.activeStudents}`, trend: `${liveStats.attendanceRate}%` };
      if (i === 2 && liveStats.schoolAverage !== null)
        return { ...s, value: `${liveStats.schoolAverage}/20` };
      if (i === 3)
        return { ...s, value: String(liveStats.unreadNotifications) };
    }
    if (activeRole === "accountant") {
      if (i === 0 && liveStats.todayRevenue > 0)
        return { ...s, value: `${liveStats.todayRevenue.toLocaleString("fr-FR")} FCFA` };
    }
    if (activeRole === "supervisor") {
      // absences today from liveStats not directly available; keep as-is
    }
    return s;
  });

  return (
    <div className="container py-8 lg:py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className={`h-4 w-4 ${meta.color}`} />
            <span>{meta.label}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl lg:text-4xl font-bold tracking-tight">
            Bonjour {greetName} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      {displayStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-card hover:shadow-md transition-smooth"
            >
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                {s.trend && (
                  <span
                    className={`text-xs font-semibold ${
                      s.trend.startsWith("+") || s.trend.endsWith("%")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {s.trend}
                  </span>
                )}
              </div>
              <div className="mt-4 font-display text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Widgets */}
      <div className="grid lg:grid-cols-3 gap-5">
        {config.widgets.map((w, i) => (
          <div
            key={i}
            className={`rounded-2xl border border-border/50 bg-card p-6 shadow-card ${
              w.span === 2 ? "lg:col-span-2" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${w.iconBg}`}>
                  <w.icon className={`h-4 w-4 ${w.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold">{w.title}</h3>
              </div>
              {w.link ? (
                <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                  <Link to={w.link}>
                    Voir tout <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                  <Link to="/app/notifications">
                    Voir tout <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
            <RealWidget type={w.type} />
          </div>
        ))}
      </div>
    </div>
  );
}
