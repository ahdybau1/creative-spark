import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ClipboardList, Plus, Trash2 } from "lucide-react";

// Les tables lesson_entries / homeworks sont récentes : accès non typé en attendant la régénération des types.
const db = supabase as any;

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Homework() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);
  const [classId, setClassId] = useState<string>("");

  const { data: subjects } = useQuery({
    queryKey: ["subjects", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("school_id", school!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const effectiveClass = classId || classes?.[0]?.id || "";

  const lessons = useQuery({
    queryKey: ["lesson-entries", effectiveClass],
    enabled: !!effectiveClass,
    queryFn: async () => {
      const { data, error } = await db
        .from("lesson_entries")
        .select("*, subjects(name)")
        .eq("class_id", effectiveClass)
        .order("lesson_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const homeworks = useQuery({
    queryKey: ["homeworks", effectiveClass],
    enabled: !!effectiveClass,
    queryFn: async () => {
      const { data, error } = await db
        .from("homeworks")
        .select("*, subjects(name), homework_submissions(id, score)")
        .eq("class_id", effectiveClass)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [lessonForm, setLessonForm] = useState({
    subject_id: "",
    lesson_date: todayISO(),
    title: "",
    content: "",
    homework_note: "",
  });
  const [hwForm, setHwForm] = useState({
    subject_id: "",
    title: "",
    instructions: "",
    due_date: todayISO(),
    max_score: "",
  });
  const [openLesson, setOpenLesson] = useState(false);
  const [openHw, setOpenHw] = useState(false);

  const createLesson = useMutation({
    mutationFn: async () => {
      if (!lessonForm.title.trim()) throw new Error("Le titre de la séance est obligatoire.");
      const { error } = await db.from("lesson_entries").insert({
        school_id: school!.id,
        class_id: effectiveClass,
        subject_id: lessonForm.subject_id || null,
        teacher_id: user!.id,
        lesson_date: lessonForm.lesson_date,
        title: lessonForm.title.trim(),
        content: lessonForm.content || null,
        homework_note: lessonForm.homework_note || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Séance enregistrée" });
      setOpenLesson(false);
      setLessonForm({ subject_id: "", lesson_date: todayISO(), title: "", content: "", homework_note: "" });
      qc.invalidateQueries({ queryKey: ["lesson-entries"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const createHw = useMutation({
    mutationFn: async () => {
      if (!hwForm.title.trim()) throw new Error("L'intitulé du devoir est obligatoire.");
      const max = hwForm.max_score ? Number(hwForm.max_score) : null;
      if (max != null && (Number.isNaN(max) || max <= 0)) throw new Error("Le barème doit être un nombre positif.");
      const { error } = await db.from("homeworks").insert({
        school_id: school!.id,
        class_id: effectiveClass,
        subject_id: hwForm.subject_id || null,
        teacher_id: user!.id,
        title: hwForm.title.trim(),
        instructions: hwForm.instructions || null,
        due_date: hwForm.due_date,
        max_score: max,
        is_published: true,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Devoir publié" });
      setOpenHw(false);
      setHwForm({ subject_id: "", title: "", instructions: "", due_date: todayISO(), max_score: "" });
      qc.invalidateQueries({ queryKey: ["homeworks"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async ({ table, id }: { table: "lesson_entries" | "homeworks"; id: string }) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
      return table;
    },
    onSuccess: (table) => {
      toast({ title: "Supprimé" });
      qc.invalidateQueries({ queryKey: [table === "homeworks" ? "homeworks" : "lesson-entries"] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: async (hw: any) => {
      const { error } = await db.from("homeworks").update({ is_published: !hw.is_published }).eq("id", hw.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homeworks"] }),
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="container py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Cahier de textes &amp; devoirs</h1>
          <p className="text-muted-foreground">Séances réalisées et travail à faire par classe.</p>
        </div>
        <div className="w-full max-w-xs">
          <Label className="mb-1 block">Classe</Label>
          <Select value={effectiveClass} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.section ? ` – ${c.section}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {!effectiveClass ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Créez d'abord une classe pour utiliser le cahier de textes.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">
              <BookOpen className="mr-2 h-4 w-4" /> Cahier de textes
            </TabsTrigger>
            <TabsTrigger value="homeworks">
              <ClipboardList className="mr-2 h-4 w-4" /> Devoirs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="mt-4 space-y-4">
            <Dialog open={openLesson} onOpenChange={setOpenLesson}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle séance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une séance</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Matière</Label>
                      <Select
                        value={lessonForm.subject_id}
                        onValueChange={(v) => setLessonForm({ ...lessonForm, subject_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Matière" />
                        </SelectTrigger>
                        <SelectContent>
                          {(subjects ?? []).map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={lessonForm.lesson_date}
                        onChange={(e) => setLessonForm({ ...lessonForm, lesson_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Titre de la séance</Label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Ex. Les fonctions affines"
                    />
                  </div>
                  <div>
                    <Label>Contenu / déroulé</Label>
                    <Textarea
                      rows={4}
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Travail à faire</Label>
                    <Textarea
                      rows={2}
                      value={lessonForm.homework_note}
                      onChange={(e) => setLessonForm({ ...lessonForm, homework_note: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createLesson.mutate()} disabled={createLesson.isPending}>
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                {!lessons.data?.length ? (
                  <p className="p-8 text-center text-muted-foreground">Aucune séance enregistrée.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Séance</TableHead>
                        <TableHead>Travail à faire</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessons.data.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.lesson_date}</TableCell>
                          <TableCell>{l.subjects?.name ?? "—"}</TableCell>
                          <TableCell>
                            <span className="font-medium">{l.title}</span>
                            {l.content && <p className="text-sm text-muted-foreground">{l.content}</p>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.homework_note ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remove.mutate({ table: "lesson_entries", id: l.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homeworks" className="mt-4 space-y-4">
            <Dialog open={openHw} onOpenChange={setOpenHw}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nouveau devoir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un devoir</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Matière</Label>
                      <Select value={hwForm.subject_id} onValueChange={(v) => setHwForm({ ...hwForm, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Matière" />
                        </SelectTrigger>
                        <SelectContent>
                          {(subjects ?? []).map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>À rendre le</Label>
                      <Input
                        type="date"
                        value={hwForm.due_date}
                        onChange={(e) => setHwForm({ ...hwForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Intitulé</Label>
                    <Input value={hwForm.title} onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Consignes</Label>
                    <Textarea
                      rows={4}
                      value={hwForm.instructions}
                      onChange={(e) => setHwForm({ ...hwForm, instructions: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Barème (optionnel)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hwForm.max_score}
                      onChange={(e) => setHwForm({ ...hwForm, max_score: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createHw.mutate()} disabled={createHw.isPending}>
                    Publier
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                {!homeworks.data?.length ? (
                  <p className="p-8 text-center text-muted-foreground">Aucun devoir pour cette classe.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Devoir</TableHead>
                        <TableHead className="text-right">Remises</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {homeworks.data.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.due_date}</TableCell>
                          <TableCell>{h.subjects?.name ?? "—"}</TableCell>
                          <TableCell>
                            <span className="font-medium">{h.title}</span>
                            {h.instructions && <p className="text-sm text-muted-foreground">{h.instructions}</p>}
                          </TableCell>
                          <TableCell className="text-right">{h.homework_submissions?.length ?? 0}</TableCell>
                          <TableCell>
                            <Badge
                              variant={h.is_published ? "secondary" : "outline"}
                              className="cursor-pointer"
                              onClick={() => togglePublish.mutate(h)}
                            >
                              {h.is_published ? "Publié" : "Brouillon"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remove.mutate({ table: "homeworks", id: h.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
