import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, FileDown, GraduationCap, Trophy, BookOpen, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

/* ─── Types ──────────────────────────────────────────────── */
interface SubjectResult {
  subjectId: string;
  subjectName: string;
  color: string;
  grades: { name: string; score: number; maxScore: number; coefficient: number; date: string }[];
  average: number;            // /20
  coef: number;               // max coefficient for subject
  weightedTotal: number;
}

/* ─── Helpers ────────────────────────────────────────────── */
function avg20(score: number, max: number) {
  return parseFloat(((score / max) * 20).toFixed(2));
}

function gradeLabel(avg: number) {
  if (avg >= 16) return { label: "Très Bien", color: "text-success" };
  if (avg >= 14) return { label: "Bien", color: "text-info" };
  if (avg >= 12) return { label: "Assez Bien", color: "text-primary" };
  if (avg >= 10) return { label: "Passable", color: "text-warning" };
  return { label: "Insuffisant", color: "text-destructive" };
}

function buildResults(rawGrades: any[]): SubjectResult[] {
  const bySubject: Record<string, SubjectResult> = {};
  for (const g of rawGrades) {
    const a = g.assessment;
    if (!a?.subject) continue;
    const sId = a.subject.id;
    if (!bySubject[sId]) {
      bySubject[sId] = { subjectId: sId, subjectName: a.subject.name, color: a.subject.color ?? "#3b82f6", grades: [], average: 0, coef: 0, weightedTotal: 0 };
    }
    if (!g.is_absent && g.score !== null) {
      bySubject[sId].grades.push({ name: a.name, score: g.score, maxScore: a.max_score ?? 20, coefficient: a.coefficient ?? 1, date: a.assessment_date });
    }
  }
  return Object.values(bySubject).map((s) => {
    if (s.grades.length === 0) return { ...s, average: 0, coef: 0, weightedTotal: 0 };
    const totalCoef = s.grades.reduce((acc, g) => acc + g.coefficient, 0);
    const weighted = s.grades.reduce((acc, g) => acc + avg20(g.score, g.maxScore) * g.coefficient, 0);
    const average = totalCoef > 0 ? parseFloat((weighted / totalCoef).toFixed(2)) : 0;
    const maxCoef = Math.max(...s.grades.map((g) => g.coefficient));
    return { ...s, average, coef: maxCoef, weightedTotal: average * maxCoef };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

function generalAverage(results: SubjectResult[]) {
  const totalCoef = results.reduce((acc, r) => acc + r.coef, 0);
  const totalWeighted = results.reduce((acc, r) => acc + r.weightedTotal, 0);
  if (totalCoef === 0) return 0;
  return parseFloat((totalWeighted / totalCoef).toFixed(2));
}

/* ─── PDF generation ─────────────────────────────────────── */
async function exportPDF(student: any, school: any, results: SubjectResult[], genAvg: number) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFillColor(15, 52, 96);
  doc.rect(0, 0, W, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(school?.name ?? "École", W / 2, 14, { align: "center" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("BULLETIN SCOLAIRE", W / 2, 23, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Année scolaire · ${new Date().getFullYear()}`, W / 2, 30, { align: "center" });

  y = 45;
  doc.setTextColor(30, 30, 30);

  // Student info box
  doc.setFillColor(245, 247, 255);
  doc.roundedRect(10, y, W - 20, 20, 3, 3, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${student.first_name} ${student.last_name}`.toUpperCase(), 16, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Matricule : ${student.matricule ?? "—"}`, 16, y + 15);
  doc.text(`Classe : ${student.className ?? "—"}`, W / 2, y + 8, { align: "center" });

  y += 28;

  // General avg box
  const { label } = gradeLabel(genAvg);
  doc.setFillColor(15, 52, 96);
  doc.roundedRect(W - 55, y - 28 + 8, 45, 18, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${genAvg}/20`, W - 32.5, y - 28 + 18, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(label, W - 32.5, y - 28 + 24, { align: "center" });

  doc.setTextColor(30, 30, 30);

  // Table header
  doc.setFillColor(30, 64, 175);
  doc.rect(10, y, W - 20, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MATIÈRE", 14, y + 5.5);
  doc.text("NOTES", 90, y + 5.5);
  doc.text("MOY/20", 135, y + 5.5);
  doc.text("COEF", 157, y + 5.5);
  doc.text("MENTION", 172, y + 5.5);
  y += 8;

  doc.setFont("helvetica", "normal");
  let row = 0;
  for (const r of results) {
    const rowH = Math.max(8, Math.ceil(r.grades.length / 3) * 5 + 3);
    if (y + rowH > 270) {
      doc.addPage();
      y = 15;
    }
    if (row % 2 === 0) {
      doc.setFillColor(248, 250, 255);
      doc.rect(10, y, W - 20, rowH, "F");
    }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(r.subjectName, 14, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const noteStr = r.grades.map((g) => `${avg20(g.score, g.maxScore)}`).join("  ") || "—";
    doc.text(noteStr.substring(0, 40), 90, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${r.average}`, 135, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${r.coef}`, 157, y + 5.5);
    const { label: ml, color: mc } = gradeLabel(r.average);
    doc.text(ml, 172, y + 5.5);
    y += rowH;
    row++;
  }

  // Footer general average
  y += 4;
  doc.setFillColor(15, 52, 96);
  doc.rect(10, y, W - 20, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MOYENNE GÉNÉRALE", 14, y + 7);
  doc.text(`${genAvg} / 20`, W - 14, y + 7, { align: "right" });

  y += 20;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} via EduMaster Pro`, W / 2, y, { align: "center" });

  doc.save(`bulletin_${student.last_name}_${student.first_name}.pdf`);
  toast.success("Bulletin exporté en PDF !");
}

/* ─── Main page ──────────────────────────────────────────── */
export default function BulletinsPage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);

  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState(searchParams.get("class") ?? "");
  const [studentId, setStudentId] = useState(searchParams.get("student") ?? "");
  const [exporting, setExporting] = useState(false);

  // Sync URL params on first load
  useEffect(() => {
    const c = searchParams.get("class");
    const s = searchParams.get("student");
    if (c) setClassId(c);
    if (s) setStudentId(s);
  }, []);

  const effectiveClassId = classId || classes?.[0]?.id || "";

  // Load students in class via enrollments
  const studentsQ = useQuery({
    queryKey: ["bulletin-students", effectiveClassId, year?.id],
    enabled: !!effectiveClassId && !!year?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("student:students(id, first_name, last_name, matricule, photo_url)")
        .eq("class_id", effectiveClassId)
        .eq("academic_year_id", year!.id)
        .in("status", ["enrolled", "reenrolled", "repeating"]);
      if (error) throw error;
      return (data ?? []).map((e: any) => e.student).filter(Boolean) as any[];
    },
  });

  const effectiveStudentId = studentId || studentsQ.data?.[0]?.id || "";

  // Load grades for chosen student
  const gradesQ = useQuery({
    queryKey: ["bulletin-grades", effectiveStudentId, effectiveClassId],
    enabled: !!effectiveStudentId && !!effectiveClassId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("score, is_absent, assessment:assessments(id, name, assessment_date, max_score, coefficient, subject:subjects(id, name, color))")
        .eq("student_id", effectiveStudentId)
        .not("assessment", "is", null);
      if (error) throw error;
      // Filter by class
      const classAssessments = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", effectiveClassId);
      const classAssIds = new Set((classAssessments.data ?? []).map((a: any) => a.id));
      return (data ?? []).filter((g: any) => classAssIds.has(g.assessment?.id));
    },
  });

  const student = studentsQ.data?.find((s: any) => s.id === effectiveStudentId) ?? studentsQ.data?.[0];
  const className = classes?.find((c) => c.id === effectiveClassId)?.name ?? "—";
  const results = buildResults(gradesQ.data ?? []);
  const genAvg = generalAverage(results);
  const { label: mention, color: mentionColor } = gradeLabel(genAvg);

  const handleExport = async () => {
    if (!student || !school) return;
    setExporting(true);
    try {
      await exportPDF({ ...student, className }, school, results, genAvg);
    } finally {
      setExporting(false);
    }
  };

  if (!school) return <div className="container py-10 text-muted-foreground">Aucune école configurée.</div>;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Bulletins scolaires</h1>
          <p className="text-muted-foreground mt-1">Générer et exporter les bulletins au format PDF.</p>
        </div>
        <Button onClick={handleExport} disabled={!student || exporting || results.length === 0} className="gap-2 shadow-glow">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Exporter PDF
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Classe</label>
          <Select value={effectiveClassId} onValueChange={(v) => { setClassId(v); setStudentId(""); }}>
            <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Élève</label>
          <Select value={effectiveStudentId} onValueChange={setStudentId}>
            <SelectTrigger>
              {studentsQ.isLoading
                ? <span className="text-muted-foreground">Chargement…</span>
                : <SelectValue placeholder="Choisir un élève" />}
            </SelectTrigger>
            <SelectContent>
              {(studentsQ.data ?? []).map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulletin preview */}
      {gradesQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Chargement des notes…
        </div>
      ) : !effectiveStudentId ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <GraduationCap className="h-12 w-12 opacity-20" />
          <p>Sélectionnez une classe et un élève pour afficher le bulletin.</p>
        </div>
      ) : (
        <Card className="border-border/50 shadow-card overflow-hidden">
          {/* Bulletin header */}
          <div className="bg-gradient-primary px-8 py-6 text-primary-foreground">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-white/20">
                  <AvatarImage src={student?.photo_url ?? undefined} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                    {student ? (student.first_name[0] + student.last_name[0]).toUpperCase() : "—"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-display text-xl font-bold">
                    {student?.first_name} {student?.last_name}
                  </h2>
                  <p className="text-primary-foreground/70 text-sm">Matricule : {student?.matricule ?? "—"}</p>
                  <p className="text-primary-foreground/70 text-sm">Classe : {className}</p>
                </div>
              </div>
              <div className="text-center bg-white/10 rounded-2xl px-6 py-3">
                <div className="font-display text-3xl font-bold">{genAvg}/20</div>
                <div className="text-sm text-primary-foreground/80 font-medium">{mention}</div>
                <div className="text-xs text-primary-foreground/60 mt-0.5">Moyenne générale</div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto opacity-20 mb-3" />
                <p>Aucune note enregistrée pour cet élève dans cette classe.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {/* Table header */}
                <div className="grid grid-cols-12 px-6 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="col-span-4">Matière</span>
                  <span className="col-span-4">Notes (/ barème)</span>
                  <span className="col-span-2 text-center">Moy./20</span>
                  <span className="col-span-1 text-center">Coef</span>
                  <span className="col-span-1 text-right">Mention</span>
                </div>
                {results.map((r) => {
                  const { label: ml, color: mc } = gradeLabel(r.average);
                  return (
                    <div key={r.subjectId} className="grid grid-cols-12 px-6 py-3 hover:bg-muted/20 transition-smooth items-center">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="font-medium text-sm">{r.subjectName}</span>
                      </div>
                      <div className="col-span-4 flex flex-wrap gap-1.5">
                        {r.grades.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : r.grades.map((g, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {avg20(g.score, g.maxScore)}/{g.maxScore > 20 ? g.maxScore : 20}
                          </Badge>
                        ))}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-bold font-mono">{r.grades.length > 0 ? r.average : "—"}</span>
                      </div>
                      <div className="col-span-1 text-center text-muted-foreground text-sm">{r.coef}</div>
                      <div className={`col-span-1 text-right text-xs font-semibold ${mc}`}>{r.grades.length > 0 ? ml : "—"}</div>
                    </div>
                  );
                })}

                {/* Summary row */}
                <div className="grid grid-cols-12 px-6 py-4 bg-primary/5 border-t-2 border-primary/20">
                  <div className="col-span-8 flex items-center">
                    <div className="flex items-center gap-2 font-display font-bold text-sm">
                      <Trophy className="h-4 w-4 text-primary" />
                      MOYENNE GÉNÉRALE
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`font-display font-bold text-lg ${mentionColor}`}>{genAvg}/20</span>
                  </div>
                  <div className="col-span-1 text-center text-muted-foreground text-sm">
                    {results.reduce((acc, r) => acc + r.coef, 0)}
                  </div>
                  <div className={`col-span-1 text-right text-xs font-bold ${mentionColor}`}>{mention}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
