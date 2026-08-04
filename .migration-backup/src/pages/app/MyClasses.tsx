import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ClipboardCheck, FileText } from "lucide-react";

export default function MyClasses() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-classes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select("id, coefficient, weekly_hours, subjects(name, short_code), classes(id, name, section, room, capacity)")
        .eq("teacher_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["my-classes-counts", data?.length],
    enabled: !!data?.length,
    queryFn: async () => {
      const ids = [...new Set(data!.map((r: any) => r.classes?.id).filter(Boolean))];
      const { data: rows, error } = await supabase
        .from("enrollments")
        .select("class_id")
        .in("class_id", ids)
        .eq("status", "enrolled");
      if (error) throw error;
      return (rows ?? []).reduce<Record<string, number>>((acc, r: any) => {
        acc[r.class_id] = (acc[r.class_id] ?? 0) + 1;
        return acc;
      }, {});
    },
  });

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mes classes</h1>
        <p className="text-muted-foreground">Les classes et matières qui vous sont affectées.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune affectation pour le moment. L'administration doit vous affecter des matières et classes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((row: any) => (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {row.classes?.name}
                  {row.classes?.section ? <span className="text-muted-foreground">· {row.classes.section}</span> : null}
                </CardTitle>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">{row.subjects?.name}</Badge>
                  <Badge variant="outline">Coef. {row.coefficient}</Badge>
                  {row.weekly_hours ? <Badge variant="outline">{row.weekly_hours}h/sem</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {counts?.[row.classes?.id] ?? 0} élève(s)
                  {row.classes?.room ? <span>· Salle {row.classes.room}</span> : null}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link to="/app/attendance">
                      <ClipboardCheck className="h-3.5 w-3.5" /> Pointage
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link to="/app/grades">
                      <FileText className="h-3.5 w-3.5" /> Notes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
