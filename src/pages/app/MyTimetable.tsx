import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudent, useCurrentEnrollment } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
] as const;

export default function MyTimetable() {
  const { data: student, isLoading: sLoading } = useMyStudent();
  const { data: enrollment } = useCurrentEnrollment(student?.id);
  const classId = enrollment?.class_id;

  const { data: slots, isLoading } = useQuery({
    queryKey: ["my-timetable", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("id, day, start_time, end_time, room, subjects(name, color), profiles:teacher_id(full_name)")
        .eq("class_id", classId!)
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (sLoading) return <div className="container py-8 text-muted-foreground">Chargement…</div>;

  if (!student) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Votre compte n'est pas encore rattaché à un dossier élève.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mon emploi du temps</h1>
        <p className="text-muted-foreground">
          {(enrollment as any)?.classes?.name ? `Classe ${(enrollment as any).classes.name}` : "Aucune classe active"}
        </p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((d) => {
            const daySlots = (slots ?? []).filter((s: any) => s.day === d.key);
            return (
              <Card key={d.key}>
                <CardContent className="p-4">
                  <h2 className="font-display font-semibold mb-3">{d.label}</h2>
                  {daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Pas de cours</p>
                  ) : (
                    <ul className="space-y-2">
                      {daySlots.map((s: any) => (
                        <li key={s.id} className="rounded-xl border border-border/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{s.subjects?.name ?? "Cours"}</span>
                            <Badge variant="outline">
                              {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.profiles?.full_name ?? "Enseignant à définir"}
                            {s.room ? ` · Salle ${s.room}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
