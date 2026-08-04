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
        <CalendarGrid days={DAYS} grouped={grouped} onRemove={remove} />
      )}
    </div>
  );
}

function CalendarGrid({ days, grouped, onRemove }: any) {
  // Hourly grid 7h → 19h
  const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMin = HOURS[0] * 60;
  const pxPerMin = 0.9;

  return (
    <div className="rounded-2xl border bg-card overflow-x-auto">
      <div className="min-w-[800px] grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
        <div className="border-b border-r bg-muted/30 h-10"></div>
        {days.map((d: any) => (
          <div key={d.v} className="border-b border-r last:border-r-0 px-2 py-2 text-sm font-semibold text-center bg-muted/30">{d.label}</div>
        ))}
        <div className="relative border-r" style={{ height: `${HOURS.length * 60 * pxPerMin}px` }}>
          {HOURS.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 text-[10px] text-muted-foreground px-1" style={{ top: `${i * 60 * pxPerMin}px` }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((d: any) => (
          <div key={d.v} className="relative border-r last:border-r-0 border-t" style={{ height: `${HOURS.length * 60 * pxPerMin}px`, backgroundImage: "linear-gradient(to bottom, transparent 59px, hsl(var(--border)) 60px)", backgroundSize: `100% ${60 * pxPerMin}px` }}>
            {(grouped[d.v] ?? []).map((s: any) => {
              const top = (toMin(s.start_time) - startMin) * pxPerMin;
              const height = Math.max(28, (toMin(s.end_time) - toMin(s.start_time)) * pxPerMin - 2);
              return (
                <div key={s.id} className="absolute left-1 right-1 rounded-md border bg-primary/10 border-primary/30 p-1 text-[11px] overflow-hidden group"
                  style={{ top: `${top}px`, height: `${height}px` }}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.subject?.name ?? "—"}</div>
                      <div className="text-muted-foreground truncate">{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</div>
                      {s.room && <div className="text-muted-foreground truncate">{s.room}</div>}
                      {s.teacher?.full_name && <div className="text-muted-foreground truncate">{s.teacher.full_name}</div>}
                    </div>
                    <button onClick={() => onRemove(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
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
