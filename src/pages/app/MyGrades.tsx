import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudent } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function StudentGradesView({ studentId }: { studentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["student-grades", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select(
          "id, score, is_absent, comment, assessments(name, assessment_type, assessment_date, max_score, coefficient, subjects(name))"
        )
        .eq("student_id", studentId);
      if (error) throw error;
      return (data ?? []).sort(
        (a: any, b: any) =>
          (b.assessments?.assessment_date ?? "").localeCompare(a.assessments?.assessment_date ?? "")
      );
    },
  });

  const graded = (data ?? []).filter((g: any) => !g.is_absent && g.score != null && g.assessments);
  const totalCoef = graded.reduce((s: number, g: any) => s + Number(g.assessments.coefficient || 1), 0);
  const weighted = graded.reduce(
    (s: number, g: any) =>
      s + (Number(g.score) / Number(g.assessments.max_score || 20)) * 20 * Number(g.assessments.coefficient || 1),
    0
  );
  const average = totalCoef > 0 ? weighted / totalCoef : null;

  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Moyenne générale pondérée</p>
            <p className="font-display text-3xl font-bold">
              {average != null ? `${average.toFixed(2)}/20` : "—"}
            </p>
          </div>
          <Badge variant="secondary">{graded.length} note(s)</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!data?.length ? (
            <p className="p-8 text-center text-muted-foreground">Aucune note enregistrée.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Évaluation</TableHead>
                  <TableHead className="text-right">Note</TableHead>
                  <TableHead className="text-right">Coef.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.assessments?.assessment_date}</TableCell>
                    <TableCell>{g.assessments?.subjects?.name}</TableCell>
                    <TableCell>{g.assessments?.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {g.is_absent ? <Badge variant="outline">Absent</Badge> : `${g.score}/${g.assessments?.max_score}`}
                    </TableCell>
                    <TableCell className="text-right">{g.assessments?.coefficient}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyGrades() {
  const { data: student, isLoading } = useMyStudent();

  if (isLoading) return <div className="container py-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mes notes</h1>
        <p className="text-muted-foreground">Résultats et moyenne pondérée.</p>
      </header>
      {student ? (
        <StudentGradesView studentId={student.id} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Votre compte n'est pas encore rattaché à un dossier élève.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
