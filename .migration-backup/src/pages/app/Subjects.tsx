import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, BookOpen, MoreVertical, Pencil, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function SubjectsPage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);
  const qc = useQueryClient();

  const subjectsQ = useQuery({
    queryKey: ["subjects", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects").select("*").eq("school_id", school!.id).order("name");
      if (error) throw error;
      return data;
    },
  });

  const linksQ = useQuery({
    queryKey: ["class_subjects", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select("*, subject:subjects(*), teacher:profiles(id, full_name)");
      if (error) throw error;
      return data;
    },
  });

  const teachersQ = useQuery({
    queryKey: ["staff-teachers", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("id, full_name").eq("school_id", school!.id);
      if (error) throw error;
      return data;
    },
  });

  const [openNew, setOpenNew] = useState(false);
  const [editSubj, setEditSubj] = useState<any>(null);
  const [openLink, setOpenLink] = useState(false);

  const removeSubject = async (id: string) => {
    if (!confirm("Supprimer cette matière ?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["subjects"] }); }
  };

  const removeLink = async (id: string) => {
    if (!confirm("Retirer cette affectation ?")) return;
    const { error } = await supabase.from("class_subjects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Retirée"); qc.invalidateQueries({ queryKey: ["class_subjects"] }); }
  };

  if (!school) return <div className="container py-10">Aucune école.</div>;

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Matières</h1>
        <p className="text-muted-foreground mt-2">Catalogue de matières et affectation aux classes.</p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalogue ({subjectsQ.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="links">Affectations ({linksQ.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Nouvelle matière</Button>
              </DialogTrigger>
              <SubjectDialog
                schoolId={school.id}
                onSaved={() => { setOpenNew(false); qc.invalidateQueries({ queryKey: ["subjects"] }); }}
              />
            </Dialog>
          </div>

          {subjectsQ.isLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : !subjectsQ.data?.length ? (
            <Empty icon={BookOpen} text="Aucune matière." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjectsQ.data.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display font-bold text-lg">{s.name}</div>
                      {s.short_code && <div className="text-xs text-muted-foreground">{s.short_code}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">×{s.default_coefficient}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditSubj(s)} className="gap-2"><Pencil className="h-4 w-4" />Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeSubject(s.id)} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openLink} onOpenChange={setOpenLink}>
              <DialogTrigger asChild>
                <Button className="gap-2" variant="outline" disabled={!classes?.length || !subjectsQ.data?.length}>
                  <Link2 className="h-4 w-4" />Nouvelle affectation
                </Button>
              </DialogTrigger>
              <LinkDialog
                classes={classes ?? []}
                subjects={subjectsQ.data ?? []}
                teachers={teachersQ.data ?? []}
                onSaved={() => { setOpenLink(false); qc.invalidateQueries({ queryKey: ["class_subjects"] }); }}
              />
            </Dialog>
          </div>

          {linksQ.isLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : !linksQ.data?.length ? (
            <Empty icon={Link2} text="Aucune affectation." />
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Classe</th>
                    <th className="text-left px-4 py-3">Matière</th>
                    <th className="text-left px-4 py-3">Enseignant</th>
                    <th className="text-left px-4 py-3">Coef</th>
                    <th className="text-left px-4 py-3">H/sem</th>
                    <th className="text-right px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {linksQ.data.map((l: any) => {
                    const klass = classes?.find((c) => c.id === l.class_id);
                    return (
                      <tr key={l.id} className="border-t border-border/50">
                        <td className="px-4 py-3">{klass?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-medium">{l.subject?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.teacher?.full_name ?? "—"}</td>
                        <td className="px-4 py-3">×{l.coefficient}</td>
                        <td className="px-4 py-3">{l.weekly_hours ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLink(l.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editSubj && (
        <Dialog open onOpenChange={(o) => !o && setEditSubj(null)}>
          <SubjectDialog
            schoolId={school.id}
            subject={editSubj}
            onSaved={() => { setEditSubj(null); qc.invalidateQueries({ queryKey: ["subjects"] }); }}
          />
        </Dialog>
      )}
    </div>
  );
}

function Empty({ icon: Icon, text }: any) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

function SubjectDialog({ schoolId, subject, onSaved }: { schoolId: string; subject?: any; onSaved: () => void }) {
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.short_code ?? "");
  const [coef, setCoef] = useState<number>(subject?.default_coefficient ?? 1);
  const [color, setColor] = useState(subject?.color ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const payload = { school_id: schoolId, name, short_code: code || null, default_coefficient: coef, color: color || null };
    const { error } = subject
      ? await supabase.from("subjects").update(payload).eq("id", subject.id)
      : await supabase.from("subjects").insert(payload);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(subject ? "Modifiée" : "Créée"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{subject ? "Modifier la matière" : "Nouvelle matière"}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2"><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathématiques" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH" /></div>
          <div className="space-y-2"><Label>Coefficient par défaut</Label><Input type="number" step="0.5" value={coef} onChange={(e) => setCoef(Number(e.target.value))} /></div>
        </div>
        <div className="space-y-2"><Label>Couleur (optionnel)</Label><Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3b82f6" /></div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={!name || loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{subject ? "Enregistrer" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function LinkDialog({ classes, subjects, teachers, onSaved }: any) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [coef, setCoef] = useState(1);
  const [hours, setHours] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.from("class_subjects").insert({
      class_id: classId, subject_id: subjectId, teacher_id: teacherId || null,
      coefficient: coef, weekly_hours: hours === "" ? null : hours,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Affectée"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Affecter une matière</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2"><Label>Classe</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Matière</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Enseignant (optionnel)</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">—</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Coefficient</Label><Input type="number" step="0.5" value={coef} onChange={(e) => setCoef(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Heures/semaine</Label><Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value === "" ? "" : Number(e.target.value))} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={loading || !classId || !subjectId} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Affecter</Button></DialogFooter>
    </DialogContent>
  );
}
