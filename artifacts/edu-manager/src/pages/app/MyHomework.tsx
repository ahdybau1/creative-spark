import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudent, useCurrentEnrollment } from "@/hooks/useMyStudent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ClipboardList } from "lucide-react";

const db = supabase as any;

export default function MyHomework() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: student, isLoading } = useMyStudent();
  const { data: enrollment } = useCurrentEnrollment(student?.id);
  const classId = enrollment?.class_id;
  const [openHw, setOpenHw] = useState<any>(null);
  const [answer, setAnswer] = useState("");

  const homeworks = useQuery({
    queryKey: ["my-homeworks", classId, student?.id],
    enabled: !!classId && !!student?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("homeworks")
        .select("*, subjects(name), homework_submissions(id, content, score, feedback, submitted_at, student_id)")
        .eq("class_id", classId)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((h: any) => ({
        ...h,
        mine: (h.homework_submissions ?? []).find((s: any) => s.student_id === student!.id) ?? null,
      }));
    },
  });

  const lessons = useQuery({
    queryKey: ["my-lessons", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await db
        .from("lesson_entries")
        .select("*, subjects(name)")
        .eq("class_id", classId)
        .order("lesson_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!answer.trim()) throw new Error("Saisissez votre réponse avant d'envoyer.");
      const { error } = await db.from("homework_submissions").upsert(
        {
          homework_id: openHw.id,
          student_id: student!.id,
          content: answer.trim(),
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "homework_id,student_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Devoir envoyé" });
      setOpenHw(null);
      setAnswer("");
      qc.invalidateQueries({ queryKey: ["my-homeworks"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="container py-8 text-muted-foreground">Chargement…</div>;

  if (!student || !classId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Votre compte n'est pas encore rattaché à une classe.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Devoirs</h1>
        <p className="text-muted-foreground">Travail à faire et cahier de textes de ma classe.</p>
      </header>

      <Tabs defaultValue="homeworks">
        <TabsList>
          <TabsTrigger value="homeworks">
            <ClipboardList className="mr-2 h-4 w-4" /> Mes devoirs
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <BookOpen className="mr-2 h-4 w-4" /> Cahier de textes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homeworks" className="mt-4 space-y-3">
          {!homeworks.data?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Aucun devoir en cours.</CardContent>
            </Card>
          ) : (
            homeworks.data.map((h: any) => (
              <Card key={h.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline">{h.subjects?.name ?? "Général"}</Badge>
                      <span className="text-sm text-muted-foreground">À rendre le {h.due_date}</span>
                    </div>
                    <p className="font-medium">{h.title}</p>
                    {h.instructions && <p className="text-sm text-muted-foreground">{h.instructions}</p>}
                    {h.mine?.score != null && (
                      <p className="mt-2 text-sm font-medium">
                        Note : {h.mine.score}
                        {h.max_score ? `/${h.max_score}` : ""}
                        {h.mine.feedback ? ` — ${h.mine.feedback}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {h.mine ? <Badge variant="secondary">Remis</Badge> : <Badge variant="outline">À faire</Badge>}
                    <Dialog
                      open={openHw?.id === h.id}
                      onOpenChange={(o) => {
                        setOpenHw(o ? h : null);
                        setAnswer(o ? (h.mine?.content ?? "") : "");
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant={h.mine ? "outline" : "default"} size="sm">
                          {h.mine ? "Modifier" : "Rendre"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{h.title}</DialogTitle>
                        </DialogHeader>
                        <div>
                          <Label>Ma réponse</Label>
                          <Textarea rows={8} value={answer} onChange={(e) => setAnswer(e.target.value)} />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                            Envoyer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="lessons" className="mt-4 space-y-3">
          {!lessons.data?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucune séance enregistrée pour le moment.
              </CardContent>
            </Card>
          ) : (
            lessons.data.map((l: any) => (
              <Card key={l.id}>
                <CardContent className="p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline">{l.subjects?.name ?? "Général"}</Badge>
                    <span className="text-sm text-muted-foreground">{l.lesson_date}</span>
                  </div>
                  <p className="font-medium">{l.title}</p>
                  {l.content && <p className="text-sm text-muted-foreground">{l.content}</p>}
                  {l.homework_note && <p className="mt-2 text-sm">Travail à faire : {l.homework_note}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
