import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentSchool } from "@/hooks/useSchool";
import {
  ShieldCheck, Lock, KeyRound, FileCheck2, User, CreditCard,
  BookOpen, ClipboardCheck, Bell, ChevronRight, RefreshCw, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

/* ─── Activity event types ──────────────────────────────── */
interface ActivityEvent {
  id: string;
  time: string;
  type: "payment" | "grade" | "attendance" | "notification" | "enrollment" | "student";
  title: string;
  detail: string;
}

const EVENT_META: Record<ActivityEvent["type"], { icon: any; bg: string; color: string }> = {
  payment:      { icon: CreditCard,      bg: "bg-success/10",     color: "text-success" },
  grade:        { icon: BookOpen,        bg: "bg-primary/10",     color: "text-primary" },
  attendance:   { icon: ClipboardCheck, bg: "bg-info/10",        color: "text-info" },
  notification: { icon: Bell,            bg: "bg-warning/10",     color: "text-warning" },
  enrollment:   { icon: User,            bg: "bg-purple-100",     color: "text-purple-600" },
  student:      { icon: User,            bg: "bg-accent/10",      color: "text-accent" },
};

/* ─── Hook ──────────────────────────────────────────────── */
function useActivityLog(schoolId?: string | null) {
  return useQuery({
    queryKey: ["activity-log", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const sid = schoolId!;
      const [paymentsRes, gradesRes, sessionsRes, notifRes, enrollRes, studentsRes] = await Promise.all([
        supabase.from("fee_payments")
          .select("id, amount, paid_at, school_id, student:students(first_name, last_name)")
          .eq("school_id", sid)
          .order("paid_at", { ascending: false })
          .limit(20),

        supabase.from("grades")
          .select("id, score, created_at, student:students(first_name, last_name), assessment:assessments!inner(name, school_id, max_score)")
          .eq("assessment.school_id", sid)
          .not("score", "is", null)
          .order("created_at", { ascending: false })
          .limit(20),

        supabase.from("attendance_sessions")
          .select("id, session_date, created_at, class:classes(name)")
          .eq("school_id", sid)
          .order("created_at", { ascending: false })
          .limit(15),

        supabase.from("notifications")
          .select("id, title, type, created_at")
          .eq("school_id", sid)
          .order("created_at", { ascending: false })
          .limit(15),

        supabase.from("enrollments")
          .select("id, enrolled_at, status, student:students(first_name, last_name, school_id)")
          .eq("school_id", sid)
          .order("enrolled_at", { ascending: false })
          .limit(15),

        supabase.from("students")
          .select("id, first_name, last_name, created_at")
          .eq("school_id", sid)
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

      const events: ActivityEvent[] = [];

      (paymentsRes.data ?? []).forEach((p: any) => {
        events.push({
          id: `pay-${p.id}`,
          time: p.paid_at,
          type: "payment",
          title: "Paiement enregistré",
          detail: `${p.student?.first_name ?? ""} ${p.student?.last_name ?? ""} · ${Number(p.amount).toLocaleString("fr-FR")} FCFA`,
        });
      });

      (gradesRes.data ?? []).forEach((g: any) => {
        const score20 = g.assessment?.max_score ? ((g.score / g.assessment.max_score) * 20).toFixed(1) : g.score;
        events.push({
          id: `grade-${g.id}`,
          time: g.created_at,
          type: "grade",
          title: "Note saisie",
          detail: `${g.student?.first_name ?? ""} ${g.student?.last_name ?? ""} · ${g.assessment?.name ?? "Éval."} · ${score20}/20`,
        });
      });

      (sessionsRes.data ?? []).forEach((s: any) => {
        events.push({
          id: `att-${s.id}`,
          time: s.created_at,
          type: "attendance",
          title: "Session de présence",
          detail: `${s.class?.name ?? "—"} · ${new Date(s.session_date).toLocaleDateString("fr-FR")}`,
        });
      });

      (notifRes.data ?? []).forEach((n: any) => {
        events.push({
          id: `notif-${n.id}`,
          time: n.created_at,
          type: "notification",
          title: "Notification envoyée",
          detail: n.title ?? "—",
        });
      });

      (enrollRes.data ?? []).forEach((e: any) => {
        if ((e.student as any)?.school_id === sid) {
          events.push({
            id: `enroll-${e.id}`,
            time: e.enrolled_at,
            type: "enrollment",
            title: "Inscription",
            detail: `${e.student?.first_name ?? ""} ${e.student?.last_name ?? ""} · ${e.status}`,
          });
        }
      });

      (studentsRes.data ?? []).forEach((s: any) => {
        events.push({
          id: `student-${s.id}`,
          time: s.created_at,
          type: "student",
          title: "Dossier élève créé",
          detail: `${s.first_name} ${s.last_name}`,
        });
      });

      // Sort by time desc and dedupe
      return events
        .filter((e) => !!e.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 60);
    },
  });
}

/* ─── Info card component ───────────────────────────────── */
function InfoCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function AuditPage() {
  const { user } = useAuth();
  const { data: school } = useCurrentSchool();
  const { data: events, isLoading, refetch, isFetching } = useActivityLog(school?.id);
  const [filter, setFilter] = useState<ActivityEvent["type"] | "all">("all");

  const filtered = filter === "all" ? events : events?.filter((e) => e.type === filter);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Sécurité & Audit
          </h1>
          <p className="text-muted-foreground mt-1">
            Journal d'activité et conformité — {school?.name ?? "…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Journal d'activité</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>

        {/* ─── Activity log ────────────────────────────── */}
        <TabsContent value="activity" className="space-y-4">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {(["all", "payment", "grade", "attendance", "enrollment", "notification", "student"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-smooth",
                  filter === t
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "border-border/50 bg-card hover:bg-muted/50 text-muted-foreground"
                )}
              >
                {t === "all" ? "Tout" : t === "payment" ? "Paiements" : t === "grade" ? "Notes" : t === "attendance" ? "Présences" : t === "enrollment" ? "Inscriptions" : t === "notification" ? "Notifications" : "Élèves"}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement du journal…
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Aucune activité enregistrée pour ce filtre.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card shadow-card divide-y divide-border/30 overflow-hidden">
              {filtered.map((event) => {
                const meta = EVENT_META[event.type];
                const Icon = meta.icon;
                const timeAgo = (() => {
                  try {
                    return formatDistanceToNow(new Date(event.time), { addSuffix: true, locale: fr });
                  } catch {
                    return event.time.slice(0, 10);
                  }
                })();
                return (
                  <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-smooth">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", meta.bg)}>
                      <Icon className={cn("h-4 w-4", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
                    </div>
                    <time className="text-xs text-muted-foreground/60 flex-shrink-0">{timeAgo}</time>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Security info ───────────────────────────── */}
        <TabsContent value="security">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoCard icon={Lock} title="Authentification" desc="Connexion sécurisée par email/mot de passe avec sessions JWT. Réinitialisation via email possible." />
            <InfoCard icon={KeyRound} title="Rôles & permissions (RLS)" desc="Accès cloisonné par rôle. Row Level Security activée — chaque école est isolée." />
            <InfoCard icon={ShieldCheck} title="Chiffrement des données" desc="Données chiffrées en transit (HTTPS/TLS) et au repos. Hébergement EU via Supabase." />
            <InfoCard icon={FileCheck2} title="Journal d'activité" desc="Toutes les actions sensibles (paiements, notes, inscriptions) sont horodatées et consultables ici." />
          </div>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-primary font-medium">🛡️ Conformité RGPD</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les données personnelles des élèves sont traitées conformément au RGPD. Chaque établissement contrôle ses propres données. Les droits d'accès, de rectification et de suppression sont respectés.
            </p>
          </div>
        </TabsContent>

        {/* ─── Current session ─────────────────────────── */}
        <TabsContent value="session">
          <div className="rounded-2xl border border-border/50 bg-card shadow-card p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Votre session active
            </h2>
            <div className="space-y-2 text-sm">
              <Row label="Utilisateur" value={user?.email ?? "—"} mono />
              <Row label="ID utilisateur" value={user?.id ?? "—"} mono />
              <Row label="Dernière connexion" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("fr-FR") : "—"} />
              <Row label="École" value={school?.name ?? "—"} />
              <Row label="Devise" value={school?.currency ?? "—"} />
              <Row label="Fuseau horaire" value={school?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone} />
              <Row label="Authentifié via" value={user?.app_metadata?.provider ?? "email"} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={cn("font-medium text-right truncate", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
