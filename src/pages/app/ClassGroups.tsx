import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClassGroupsPage() {
  const { data: school } = useCurrentSchool();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const groupsQ = useQuery({
    queryKey: ["class-groups", school?.id],
    enabled: !!school,
    queryFn: async () => {
      const { data } = await supabase.from("class_groups")
        .select("*, members:class_group_members(id, class_id, classes(id, name))")
        .eq("school_id", school!.id).order("name");
      return data ?? [];
    },
  });

  const classesQ = useQuery({
    queryKey: ["classes", school?.id],
    enabled: !!school,
    queryFn: async () => (await supabase.from("classes").select("id, name").eq("school_id", school!.id).order("name")).data ?? [],
  });

  const removeGroup = async (id: string) => {
    if (!confirm("Supprimer ce jumelage ?")) return;
    const { error } = await supabase.from("class_groups").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["class-groups"] }); }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Jumelages de classes</h1>
          <p className="text-muted-foreground mt-1">
            Regroupez plusieurs classes pour autoriser un cours commun (même prof, même salle, même créneau).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nouveau jumelage</Button></DialogTrigger>
          {school && <GroupDialog schoolId={school.id} classes={classesQ.data ?? []}
            onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["class-groups"] }); }} />}
        </Dialog>
      </div>

      {groupsQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !groupsQ.data?.length ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Aucun jumelage. Créez-en un pour autoriser des cours communs entre classes.
        </div>
      ) : (
        <div className="grid gap-3">
          {groupsQ.data.map((g: any) => (
            <div key={g.id} className="rounded-2xl border bg-card p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{g.name}</div>
                {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {g.members?.map((m: any) => (
                    <span key={m.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {m.classes?.name}
                    </span>
                  ))}
                  {!g.members?.length && <span className="text-xs text-muted-foreground">Aucune classe</span>}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeGroup(g.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupDialog({ schoolId, classes, onSaved }: { schoolId: string; classes: any[]; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || selected.length < 2) return toast.error("Nom + au moins 2 classes");
    setLoading(true);
    const { data: g, error } = await supabase.from("class_groups")
      .insert({ school_id: schoolId, name: name.trim(), description: desc || null }).select().single();
    if (error || !g) { setLoading(false); return toast.error(error?.message); }
    const rows = selected.map((cid) => ({ group_id: g.id, class_id: cid }));
    const { error: e2 } = await supabase.from("class_group_members").insert(rows);
    setLoading(false);
    if (e2) return toast.error(e2.message);
    toast.success("Jumelage créé");
    onSaved();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouveau jumelage</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5"><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Anglais 6e fusionné" /></div>
        <div className="space-y-1.5"><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>Classes jumelées (≥ 2)</Label>
          <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
            {classes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 p-2 text-sm hover:bg-muted/40 cursor-pointer">
                <input type="checkbox" checked={selected.includes(c.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((x) => x !== c.id))} />
                {c.name}
              </label>
            ))}
            {!classes.length && <div className="p-3 text-xs text-muted-foreground">Aucune classe disponible.</div>}
          </div>
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Créer</Button></DialogFooter>
    </DialogContent>
  );
}
