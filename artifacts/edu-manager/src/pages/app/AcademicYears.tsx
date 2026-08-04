import { useState } from "react";
import { useCurrentSchool, useAcademicYears } from "@/hooks/useSchool";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar as CalendarIcon, CheckCircle2, Archive, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AcademicYears() {
  const { data: school } = useCurrentSchool();
  const { data: years, isLoading } = useAcademicYears(school?.id);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement l'année « ${name} » ?\nCela ne fonctionnera pas si des classes ou inscriptions y sont attachées.`)) return;
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) toast.error("Erreur", { description: error.message });
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["academic-years"] }); }
  };

  const setActive = async (id: string) => {
    if (!school) return;
    // Désactiver toutes
    await supabase.from("academic_years").update({ is_active: false }).eq("school_id", school.id);
    // Activer celle-ci
    const { error } = await supabase.from("academic_years").update({ is_active: true }).eq("id", id);
    if (error) toast.error("Erreur", { description: error.message });
    else {
      toast.success("Année active mise à jour");
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      qc.invalidateQueries({ queryKey: ["active-year"] });
    }
  };

  const archive = async (id: string) => {
    const { error } = await supabase
      .from("academic_years")
      .update({ is_archived: true, is_active: false })
      .eq("id", id);
    if (error) toast.error("Erreur", { description: error.message });
    else {
      toast.success("Année archivée");
      qc.invalidateQueries({ queryKey: ["academic-years"] });
    }
  };

  return (
    <div className="container max-w-4xl py-8 lg:py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Années scolaires</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez les années de votre établissement. Une seule peut être active.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-glow">
              <Plus className="h-4 w-4" /> Nouvelle année
            </Button>
          </DialogTrigger>
          <NewYearDialog
            schoolId={school?.id}
            onCreated={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["academic-years"] });
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !years?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune année scolaire pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((y) => (
            <div
              key={y.id}
              className="rounded-2xl border border-border/50 bg-card p-5 flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-lg">{y.name}</span>
                  {y.is_active && (
                    <Badge className="bg-success text-success-foreground hover:bg-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {y.is_archived && <Badge variant="secondary">Archivée</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Du {format(new Date(y.start_date), "PPP", { locale: fr })} au{" "}
                  {format(new Date(y.end_date), "PPP", { locale: fr })}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!y.is_active && !y.is_archived && (
                  <Button variant="outline" size="sm" onClick={() => setActive(y.id)}>
                    Activer
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setEditing(y)} title="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
                {!y.is_archived && (
                  <Button variant="ghost" size="icon" onClick={() => archive(y.id)} title="Archiver">
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(y.id, y.name)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <EditYearDialog
            year={editing}
            onSaved={() => {
              setEditing(null);
              qc.invalidateQueries({ queryKey: ["academic-years"] });
              qc.invalidateQueries({ queryKey: ["active-year"] });
            }}
          />
        </Dialog>
      )}
    </div>
  );
}

function NewYearDialog({
  schoolId,
  onCreated,
}: {
  schoolId: string | undefined;
  onCreated: () => void;
}) {
  const today = new Date();
  const startYear =
    today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  const [name, setName] = useState(`${startYear}-${startYear + 1}`);
  const [start, setStart] = useState(`${startYear}-09-01`);
  const [end, setEnd] = useState(`${startYear + 1}-07-15`);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!schoolId) return;
    setLoading(true);
    if (active) {
      await supabase.from("academic_years").update({ is_active: false }).eq("school_id", schoolId);
    }
    const { error } = await supabase.from("academic_years").insert({
      school_id: schoolId,
      name,
      start_date: start,
      end_date: end,
      is_active: active,
    });
    setLoading(false);
    if (error) toast.error("Erreur", { description: error.message });
    else {
      toast.success("Année créée");
      onCreated();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nouvelle année scolaire</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2025-2026" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Début</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Définir comme année active
        </label>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditYearDialog({ year, onSaved }: { year: any; onSaved: () => void }) {
  const [name, setName] = useState(year.name);
  const [start, setStart] = useState(year.start_date);
  const [end, setEnd] = useState(year.end_date);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("academic_years")
      .update({ name, start_date: start, end_date: end })
      .eq("id", year.id);
    setLoading(false);
    if (error) toast.error("Erreur", { description: error.message });
    else { toast.success("Année mise à jour"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Modifier l'année scolaire</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Début</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
