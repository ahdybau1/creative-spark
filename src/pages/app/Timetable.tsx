import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Calendar as CalIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS: { v: any; label: string }[] = [
  { v: "monday", label: "Lundi" },
  { v: "tuesday", label: "Mardi" },
  { v: "wednesday", label: "Mercredi" },
  { v: "thursday", label: "Jeudi" },
  { v: "friday", label: "Vendredi" },
  { v: "saturday", label: "Samedi" },
];

export default function TimetablePage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, year?.id);
  const [classId, setClassId] = useState<string>("");
  const qc = useQueryClient();

  const cId = classId || classes?.[0]?.id || "";

  const subjectsQ = useQuery({
    queryKey: ["subjects", school?.id],
    enabled: !!school?.id,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("school_id", school!.id).order("name")).data ?? [],
  });
  const teachersQ = useQuery({
    queryKey: ["staff-teachers", school?.id],
    enabled: !!school?.id,
    queryFn: async () => (await supabase.from("profiles").select("id, full_name").eq("school_id", school!.id)).data ?? [],
  });
  const slotsQ = useQuery({
    queryKey: ["timetable", cId],
    enabled: !!cId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("*, subject:subjects(name, color), teacher:profiles(full_name)")
        .eq("class_id", cId)
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const grouped = useMemo(() => {
    const m: Record<string, any[]> = {};
    DAYS.forEach((d) => (m[d.v] = []));
    (slotsQ.data ?? []).forEach((s: any) => m[s.day]?.push(s));
    return m;
  }, [slotsQ.data]);

  const [open, setOpen] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    const { error } = await supabase.from("timetable_slots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["timetable"] }); }
  };

  if (!school) return <div className="container py-10">Aucune école.</div>;
  if (!classes?.length) return <div className="container py-10 text-muted-foreground">Créez une classe d'abord.</div>;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Emploi du temps</h1>
          <p className="text-muted-foreground mt-1">Gérer les créneaux par classe.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-10 px-3 rounded-md border bg-background text-sm" value={cId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Créneau</Button></DialogTrigger>
            <SlotDialog
              schoolId={school.id}
              classId={cId}
              subjects={subjectsQ.data ?? []}
              teachers={teachersQ.data ?? []}
              onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["timetable"] }); }}
            />
          </Dialog>
        </div>
      </div>

      {slotsQ.isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((d) => (
            <div key={d.v} className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
              <div className="font-semibold mb-3 flex items-center gap-2"><CalIcon className="h-4 w-4 text-primary" />{d.label}</div>
              {grouped[d.v].length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun cours.</p>
              ) : (
                <div className="space-y-2">
                  {grouped[d.v].map((s: any) => (
                    <div key={s.id} className="rounded-lg border bg-background p-2 text-sm flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{s.subject?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)} · {s.room ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.teacher?.full_name ?? ""}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotDialog({ schoolId, classId, subjects, teachers, onSaved }: any) {
  const [day, setDay] = useState<any>("monday");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.from("timetable_slots").insert({
      school_id: schoolId, class_id: classId, day, start_time: start, end_time: end,
      subject_id: subjectId || null, teacher_id: teacherId || null, room: room || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Ajouté"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouveau créneau</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Jour</Label>
            <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Début</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="space-y-2"><Label>Fin</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Matière</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">—</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Enseignant</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">—</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Salle</Label><Input value={room} onChange={(e) => setRoom(e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Ajouter</Button></DialogFooter>
    </DialogContent>
  );
}
