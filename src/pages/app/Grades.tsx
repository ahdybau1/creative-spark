import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, FileText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["exam", "quiz", "homework", "project", "oral", "continuous"] as const;

export default function GradesPage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const cId = classId || classes?.[0]?.id || "";

  const subjectsQ = useQuery({
    queryKey: ["subjects", school?.id],
    enabled: !!school?.id,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("school_id", school!.id).order("name")).data ?? [],
  });

  const assessmentsQ = useQuery({
    queryKey: ["assessments", cId],
    enabled: !!cId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessments").select("*, subject:subjects(name)").eq("class_id", cId).order("assessment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<any>(null);

  const removeAssessment = async (id: string) => {
    if (!confirm("Supprimer cette évaluation et toutes ses notes ?")) return;
    await supabase.from("grades").delete().eq("assessment_id", id);
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["assessments"] }); }
  };

  if (!school) return <div className="container py-10">Aucune école.</div>;
  if (!classes?.length) return <div className="container py-10 text-muted-foreground">Créez une classe d'abord.</div>;

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Notes & évaluations</h1>
          <p className="text-muted-foreground mt-1">Créer des évaluations et saisir les notes.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-10 px-3 rounded-md border bg-background text-sm" value={cId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2" disabled={!subjectsQ.data?.length}><Plus className="h-4 w-4" />Évaluation</Button></DialogTrigger>
            <NewAssessmentDialog
              schoolId={school.id} classId={cId} yearId={year?.id ?? null} subjects={subjectsQ.data ?? []}
              onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["assessments"] }); }}
            />
          </Dialog>
        </div>
      </div>

      {assessmentsQ.isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : !assessmentsQ.data?.length ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucune évaluation.</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Nom</th><th className="text-left px-4 py-3">Matière</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Note max</th><th className="text-right px-4 py-3 w-32">Actions</th></tr>
            </thead>
            <tbody>
              {assessmentsQ.data.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.assessment_date}</td>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.subject?.name ?? "—"}</td>
                  <td className="px-4 py-3">{a.assessment_type}</td>
                  <td className="px-4 py-3">/{a.max_score} ×{a.coefficient}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setActiveAssessment(a)}>Saisir</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAssessment(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeAssessment && (
        <Dialog open onOpenChange={(o) => !o && setActiveAssessment(null)}>
          <GradesEntryDialog
            assessment={activeAssessment} classId={cId} yearId={year?.id ?? null}
            onSaved={() => setActiveAssessment(null)}
          />
        </Dialog>
      )}
    </div>
  );
}

function NewAssessmentDialog({ schoolId, classId, yearId, subjects, onSaved }: any) {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [type, setType] = useState<any>("quiz");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [max, setMax] = useState(20);
  const [coef, setCoef] = useState(1);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.from("assessments").insert({
      school_id: schoolId, class_id: classId, academic_year_id: yearId,
      subject_id: subjectId, name, assessment_type: type, assessment_date: date, max_score: max, coefficient: coef,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Créée"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouvelle évaluation</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-2"><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Devoir n°1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Matière</Label>
            <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Type</Label>
            <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Note max</Label><Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Coef</Label><Input type="number" step="0.5" value={coef} onChange={(e) => setCoef(Number(e.target.value))} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={!name || !subjectId || loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Créer</Button></DialogFooter>
    </DialogContent>
  );
}

function GradesEntryDialog({ assessment, classId, yearId, onSaved }: any) {
  const studentsQ = useQuery({
    queryKey: ["class-students", classId, yearId],
    queryFn: async () => {
      const { data } = await supabase.from("enrollments")
        .select("student:students(id, first_name, last_name, matricule)")
        .eq("class_id", classId).eq("academic_year_id", yearId).eq("status", "enrolled");
      return (data ?? []).map((r: any) => r.student).filter(Boolean);
    },
  });
  const gradesQ = useQuery({
    queryKey: ["grades", assessment.id],
    queryFn: async () => (await supabase.from("grades").select("*").eq("assessment_id", assessment.id)).data ?? [],
  });
  const [scores, setScores] = useState<Record<string, string>>({});
  useEffect(() => {
    const m: Record<string, string> = {};
    (gradesQ.data ?? []).forEach((g: any) => (m[g.student_id] = g.score?.toString() ?? ""));
    setScores(m);
  }, [gradesQ.data]);

  const save = async () => {
    const rows = (studentsQ.data ?? []).map((s: any) => {
      const v = scores[s.id]?.trim();
      return {
        assessment_id: assessment.id, student_id: s.id,
        score: v ? Number(v) : null, is_absent: !v,
      };
    });
    await supabase.from("grades").delete().eq("assessment_id", assessment.id);
    const { error } = await supabase.from("grades").insert(rows);
    if (error) toast.error(error.message);
    else { toast.success("Notes enregistrées"); onSaved(); }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Saisir les notes — {assessment.name}</DialogTitle></DialogHeader>
      {studentsQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-2 py-2">
          {studentsQ.data?.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium text-sm">{s.last_name} {s.first_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{s.matricule}</div>
              </div>
              <Input type="number" step="0.25" max={assessment.max_score} placeholder="ABS" className="w-24"
                value={scores[s.id] ?? ""} onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })} />
              <span className="text-xs text-muted-foreground">/{assessment.max_score}</span>
            </div>
          ))}
        </div>
      )}
      <DialogFooter><Button onClick={save} className="gap-2"><Save className="h-4 w-4" />Enregistrer</Button></DialogFooter>
    </DialogContent>
  );
}
