import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useMyStudent, useMyChildren } from "@/hooks/useMyStudent";

// Map JS Date.getDay() → Supabase weekday enum
const JS_DAY_TO_WEEKDAY: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};
export function todayWeekday() {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}

/* ───────────── STATS TEMPS RÉELS ───────────── */

export function useDashboardStats(schoolId?: string | null) {
  return useQuery({
    queryKey: ["dashboard-stats", schoolId],
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [studentsRes, sessionsRes, paymentsRes, notifRes, gradesRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, status", { count: "exact", head: false })
          .eq("school_id", schoolId!)
          .eq("status", "active"),

        supabase
          .from("attendance_sessions")
          .select("id, attendances(id, status)", { count: "exact" })
          .eq("school_id", schoolId!)
          .eq("session_date", today),

        supabase
          .from("fee_payments")
          .select("amount")
          .eq("school_id", schoolId!)
          .gte("paid_at", today),

        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId!)
          .is("read_at", null),

        supabase
          .from("grades")
          .select("score, assessments!inner(school_id, max_score)")
          .eq("assessments.school_id", schoolId!)
          .not("score", "is", null)
          .limit(500),
      ]);

      const activeStudents = studentsRes.count ?? 0;

      // Attendance: count present today
      const presentToday = (sessionsRes.data ?? []).reduce((acc, s) => {
        const present = ((s.attendances as any[]) ?? []).filter(
          (a) => a.status === "present"
        ).length;
        return acc + present;
      }, 0);

      const totalSessionStudents = (sessionsRes.data ?? []).reduce((acc, s) => {
        return acc + ((s.attendances as any[]) ?? []).length;
      }, 0);

      const attendanceRate =
        totalSessionStudents > 0
          ? Math.round((presentToday / totalSessionStudents) * 100)
          : null;

      // Finance: sum today
      const todayRevenue = (paymentsRes.data ?? []).reduce(
        (acc, p) => acc + (p.amount ?? 0),
        0
      );

      // School average
      const gradesList = (gradesRes.data ?? []) as any[];
      const avg =
        gradesList.length > 0
          ? gradesList.reduce((acc, g) => {
              const maxScore = g.assessments?.max_score ?? 20;
              return acc + (g.score / maxScore) * 20;
            }, 0) / gradesList.length
          : null;

      return {
        activeStudents,
        attendanceRate,
        presentToday,
        totalSessionStudents,
        todayRevenue,
        schoolAverage: avg ? parseFloat(avg.toFixed(1)) : null,
        unreadNotifications: notifRes.count ?? 0,
      };
    },
  });
}

/* ───────────── WIDGET: EMPLOI DU TEMPS AUJOURD'HUI ───────────── */

export function useTodayTimetableForTeacher(schoolId?: string | null) {
  const { user } = useAuth();
  const day = todayWeekday();

  return useQuery({
    queryKey: ["timetable-today-teacher", schoolId, user?.id],
    enabled: !!schoolId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("*, subject:subjects(name, color), class:classes(name)")
        .eq("school_id", schoolId!)
        .eq("teacher_id", user!.id)
        .eq("day", day)
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTodayTimetableForStudent(classId?: string | null, schoolId?: string | null) {
  const day = todayWeekday();

  return useQuery({
    queryKey: ["timetable-today-student", classId, schoolId],
    enabled: !!classId && !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("*, subject:subjects(name, color), teacher:profiles!timetable_slots_teacher_id_fkey(full_name)")
        .eq("school_id", schoolId!)
        .eq("class_id", classId!)
        .eq("day", day)
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ───────────── WIDGET: NOTES RÉCENTES (ÉLÈVE) ───────────── */

export function useMyRecentGrades(studentId?: string | null) {
  return useQuery({
    queryKey: ["my-recent-grades", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("score, is_absent, assessments(name, max_score, assessment_date, coefficient, subject:subjects(name, color))")
        .eq("student_id", studentId!)
        .not("score", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

/* ───────────── WIDGET: ÉVOLUTION EFFECTIFS (DIRECTION) ───────────── */

export function useStudentEnrollmentChart(schoolId?: string | null) {
  return useQuery({
    queryKey: ["enrollment-chart", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("enrollment_date, status")
        .eq("school_id", schoolId!)
        .order("enrollment_date");
      if (error) throw error;

      // Group by month
      const byMonth: Record<string, number> = {};
      (data ?? []).forEach((s) => {
        const month = s.enrollment_date.slice(0, 7); // YYYY-MM
        byMonth[month] = (byMonth[month] ?? 0) + 1;
      });

      const sorted = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => ({
          month: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          inscrits: count,
        }));

      return sorted;
    },
  });
}

/* ───────────── WIDGET: FINANCE (COMPTABLE) ───────────── */

export function useFinanceChart(schoolId?: string | null) {
  return useQuery({
    queryKey: ["finance-chart", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("fee_payments")
        .select("amount, paid_at")
        .eq("school_id", schoolId!)
        .gte("paid_at", thirtyDaysAgo.toISOString().split("T")[0])
        .order("paid_at");
      if (error) throw error;

      const byDay: Record<string, number> = {};
      (data ?? []).forEach((p) => {
        const day = p.paid_at.slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + (p.amount ?? 0);
      });

      return Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          montant: amount,
        }));
    },
  });
}

/* ───────────── WIDGET: NOTIFICATIONS ───────────── */

export function useRecentNotifications(userId?: string | null) {
  return useQuery({
    queryKey: ["recent-notifications", userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, created_at, read_at, link")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ───────────── WIDGET: ABSENCES DU JOUR ───────────── */

export function useTodayAbsences(schoolId?: string | null) {
  return useQuery({
    queryKey: ["today-absences", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, class:classes(name), attendances(id, status, student:students(first_name, last_name))")
        .eq("school_id", schoolId!)
        .eq("session_date", today);
      if (error) throw error;

      // Flatten absences
      const absences: { name: string; class: string; status: string }[] = [];
      (data ?? []).forEach((session: any) => {
        (session.attendances ?? []).forEach((a: any) => {
          if (a.status === "absent" || a.status === "late") {
            absences.push({
              name: `${a.student?.first_name ?? ""} ${a.student?.last_name ?? ""}`.trim(),
              class: session.class?.name ?? "—",
              status: a.status,
            });
          }
        });
      });
      return absences.slice(0, 10);
    },
  });
}

/* ───────────── WIDGET: ENFANTS (PARENT) ───────────── */

export function useChildrenOverview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["children-overview", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("students(id, first_name, last_name, photo_url, status, enrollments(status, class:classes(name)))")
        .eq("guardian_user_id", user!.id);
      if (error) throw error;

      return (data ?? [])
        .map((r: any) => r.students)
        .filter(Boolean)
        .map((s: any) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          photo_url: s.photo_url,
          status: s.status,
          className:
            s.enrollments?.find((e: any) =>
              ["enrolled", "reenrolled"].includes(e.status)
            )?.class?.name ?? "—",
        }));
    },
  });
}

/* ───────────── STATS RÉELLES POUR L'ENSEIGNANT ─────────────── */

export function useTeacherStats(schoolId?: string | null) {
  const { user } = useAuth();
  const day = todayWeekday();

  return useQuery({
    queryKey: ["teacher-stats", schoolId, user?.id],
    enabled: !!schoolId && !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [slotsRes, assessmentsRes, gradesRes, messagesRes] = await Promise.all([
        supabase.from("timetable_slots").select("id", { count: "exact", head: true })
          .eq("school_id", schoolId!).eq("teacher_id", user!.id).eq("day", day),
        supabase.from("assessments").select("id", { count: "exact", head: true })
          .eq("school_id", schoolId!).eq("teacher_id", user!.id),
        supabase.from("grades").select("id", { count: "exact", head: true })
          .eq("assessments.school_id", schoolId!),
        supabase.from("messages").select("id", { count: "exact", head: true })
          .contains("members", [user!.id]).is("read_at", null),
      ]);

      return {
        coursesToday: slotsRes.count ?? 0,
        assessmentsTotal: assessmentsRes.count ?? 0,
        unreadMessages: messagesRes.count ?? 0,
      };
    },
  });
}

/* ───────────── STATS RÉELLES POUR L'ÉLÈVE ──────────────────── */

export function useStudentStats(studentId?: string | null) {
  const day = todayWeekday();

  return useQuery({
    queryKey: ["student-stats", studentId],
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      // Enrollment for class
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("class_id, classes(school_id)")
        .eq("student_id", studentId!)
        .in("status", ["enrolled", "reenrolled"])
        .limit(1)
        .maybeSingle();

      const classId = (enrollment as any)?.class_id;
      const schoolId = (enrollment as any)?.classes?.school_id;

      const [slotsCount, gradesCount, notifCount] = await Promise.all([
        classId
          ? supabase.from("timetable_slots").select("id", { count: "exact", head: true })
              .eq("class_id", classId).eq("day", day)
          : Promise.resolve({ count: 0 }),
        supabase.from("grades").select("id", { count: "exact", head: true })
          .eq("student_id", studentId!).not("score", "is", null),
        supabase.from("notifications").select("id", { count: "exact", head: true })
          .eq("user_id", studentId!).is("read_at", null),
      ]);

      return {
        coursesToday: slotsCount.count ?? 0,
        gradesCount: gradesCount.count ?? 0,
        unreadNotifications: notifCount.count ?? 0,
      };
    },
  });
}

/* ───────────── WIDGET: ÉVALUATIONS EN ATTENTE (PROF) ───────────── */

export function usePendingAssessments(schoolId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-assessments", schoolId, user?.id],
    enabled: !!schoolId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, name, assessment_date, max_score, subject:subjects(name, color), class:classes(name, capacity)")
        .eq("school_id", schoolId!)
        .eq("teacher_id", user!.id)
        .order("assessment_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
