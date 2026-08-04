import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  present: "Présent",
  absent: "Absent",
  late: "Retard",
  excused: "Excusé",
};

function ChildAbsences({ child }: { child: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ["child-absences", child.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("id, status, comment, attendance_sessions(session_date, start_time, subjects(name))")
        .eq("student_id", child.id)
        .neq("status", "present");
      if (error) throw error;
      return (data ?? []).sort(
        (a: any, b: any) =>
          (b.attendance_sessions?.session_date ?? "").localeCompare(a.attendance_sessions?.session_date ?? "")
      );
    },
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-display font-semibold">
            {child.first_name} {child.last_name}
          </h2>
          <Badge variant="secondary">{data?.length ?? 0} évènement(s)</Badge>
        </div>
        {isLoading ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Chargement…</p>
        ) : !data?.length ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Aucune absence ni retard. 🎉</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.attendance_sessions?.session_date}</TableCell>
                  <TableCell>{a.attendance_sessions?.subjects?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "absent" ? "destructive" : "outline"}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.comment ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChildrenAbsences() {
  const { data: children, isLoading } = useMyChildren();

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Absences & retards</h1>
        <p className="text-muted-foreground">Suivi de l'assiduité de vos enfants.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !children?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun enfant rattaché à votre compte.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {children.map((c: any) => (
            <ChildAbsences key={c.id} child={c} />
          ))}
        </div>
      )}
    </div>
  );
}
