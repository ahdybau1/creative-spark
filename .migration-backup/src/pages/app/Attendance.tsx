import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardCheck, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Status = "present" | "absent" | "late" | "excused";
const STATUSES: { v: Status; label: string; cls: string }[] = [
  { v: "present", label: "P", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { v: "absent", label: "A", cls: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
  { v: "late", label: "R", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { v: "excused", label: "E", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
];

export default function AttendancePage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const cId = classId || classes?.[0]?.id || "";

  const studentsQ = useQuery({
    queryKey: ["class-students", cId, year?.id],
    enabled: !!cId && !!year?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("student:students(id, first_name, last_name, matricule)")
        .eq("class_id", cId).eq("academic_year_id", year!.id).eq("status", "enrolled");
      if (error) throw error;
      return (data ?? []).map((r: any) => r.student).filter(Boolean);
    },
  });

  const sessionsQ = useQuery({
    queryKey: ["att-sessions", cId, date],
    enabled: !!cId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions").select("*").eq("class_id", cId).eq("session_date", date).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (sessionsQ.data?.length && !sessionId) setSessionId(sessionsQ.data[0].id);
    if (sessionsQ.data && sessionsQ.data.length === 0) setSessionId(null);
  }, [sessionsQ.data]);

  const attsQ = useQuery({
    queryKey: ["atts", sessionId],
    enabled: !!sessionId,
    queryFn: async () => (await supabase.from("attendances").select("*").eq("session_id", sessionId!)).data ?? [],
  });

  const [marks, setMarks] = useState<Record<string, Status>>({});
  useEffect(() => {
    const m: Record<string, Status> = {};
    (attsQ.data ?? []).forEach((a: any) => (m[a.student_id] = a.status));
    setMarks(m);
  }, [attsQ.data]);

  const createSession = async () => {
    const { data, error } = await supabase.from("attendance_sessions")
      .insert({ school_id: school!.id, class_id: cId, session_date: date }).select().single();
    if (error) return toast.error(error.message);
    setSessionId(data.id);
    qc.invalidateQueries({ queryKey: ["att-sessions"] });
  };

  const deleteSession = async () => {
    if (!sessionId || !confirm("Supprimer cette session ?")) return;
    await supabase.from("attendances").delete().eq("session_id", sessionId);
    const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionId);
    if (error) return toast.error(error.message);
    setSessionId(null);
    qc.invalidateQueries({ queryKey: ["att-sessions"] });
  };

  const save = async () => {
    if (!sessionId) return;
    const rows = (studentsQ.data ?? []).map((s: any) => ({
      session_id: sessionId, student_id: s.id, status: marks[s.id] ?? "present",
    }));
    // Atomic upsert via unique (session_id, student_id)
    const { error } = await supabase.from("attendances").upsert(rows, {
      onConflict: "session_id,student_id",
    });
    if (error) toast.error(error.message);
    else { toast.success("Pointage enregistré"); qc.invalidateQueries({ queryKey: ["atts"] }); }
  };

  const setAll = (status: Status) => {
    const m: Record<string, Status> = {};
    (studentsQ.data ?? []).forEach((s: any) => (m[s.id] = status));
    setMarks(m);
  };

  if (!school) return <div className="container py-10">Aucune école.</div>;
  if (!classes?.length) return <div className="container py-10 text-muted-foreground">Créez une classe d'abord.</div>;

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Présences</h1>
        <p className="text-muted-foreground mt-1">Pointage par classe et par jour.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="space-y-1"><Label>Classe</Label>
          <select className="h-10 px-3 rounded-md border bg-background text-sm" value={cId} onChange={(e) => { setClassId(e.target.value); setSessionId(null); }}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1"><Label>Date</Label><Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSessionId(null); }} /></div>
        <div className="space-y-1"><Label>Session</Label>
          <select className="h-10 px-3 rounded-md border bg-background text-sm min-w-[200px]" value={sessionId ?? ""} onChange={(e) => setSessionId(e.target.value || null)}>
            <option value="">—</option>
            {sessionsQ.data?.map((s) => <option key={s.id} value={s.id}>Session {new Date(s.created_at).toLocaleTimeString().slice(0,5)}</option>)}
          </select>
        </div>
        <Button onClick={createSession} variant="outline" className="gap-2"><Plus className="h-4 w-4" />Nouvelle session</Button>
        {sessionId && <Button onClick={deleteSession} variant="ghost" className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Supprimer</Button>}
      </div>

      {!sessionId ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Créez une session pour commencer.</p>
        </div>
      ) : studentsQ.isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : !studentsQ.data?.length ? (
        <p className="text-muted-foreground">Aucun élève inscrit.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Tout marquer :</span>
            {STATUSES.map((st) => (
              <button key={st.v} onClick={() => setAll(st.v)} className={`px-2 py-1 rounded border ${st.cls}`}>{st.label}</button>
            ))}
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr><th className="text-left px-4 py-3">Matricule</th><th className="text-left px-4 py-3">Élève</th><th className="text-left px-4 py-3">Statut</th></tr>
              </thead>
              <tbody>
                {studentsQ.data.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{s.matricule}</td>
                    <td className="px-4 py-3">{s.last_name} {s.first_name}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex gap-1">
                        {STATUSES.map((st) => {
                          const active = (marks[s.id] ?? "present") === st.v;
                          return (
                            <button key={st.v} onClick={() => setMarks({ ...marks, [s.id]: st.v })}
                              className={`h-8 w-8 rounded-md border text-xs font-bold transition ${active ? st.cls : "bg-background hover:bg-muted text-muted-foreground"}`}>
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={save} className="gap-2"><Save className="h-4 w-4" />Enregistrer</Button>
          </div>
        </>
      )}
    </div>
  );
}
