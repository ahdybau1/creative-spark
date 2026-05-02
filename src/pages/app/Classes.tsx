import { useState } from "react";
import {
  useCurrentSchool,
  useActiveAcademicYear,
  useLevels,
  useClasses,
} from "@/hooks/useSchool";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  Layers,
  Users as UsersIcon,
  School as SchoolIcon,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ClassesPage() {
  const { data: school } = useCurrentSchool();
  const { data: year } = useActiveAcademicYear(school?.id);
  const { data: levels, isLoading: lvlLoading } = useLevels(school?.id);
  const { data: classes, isLoading: clsLoading } = useClasses(school?.id, year?.id);
  const qc = useQueryClient();

  const [openLvl, setOpenLvl] = useState(false);
  const [openCls, setOpenCls] = useState(false);

  if (!school) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <SchoolIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold">Aucune école associée</h1>
        <Button asChild className="mt-6 shadow-glow">
          <Link to="/app/school-setup">Configurer mon établissement</Link>
        </Button>
      </div>
    );
  }

  if (!year) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold">Aucune année scolaire active</h1>
        <p className="mt-2 text-muted-foreground">
          Créez et activez une année scolaire avant d'ajouter des classes.
        </p>
        <Button asChild className="mt-6 shadow-glow">
          <Link to="/app/academic-years">Gérer les années scolaires</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 lg:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Niveaux & Classes</h1>
        <p className="mt-2 text-muted-foreground">
          Année active : <span className="font-semibold text-foreground">{year.name}</span>
        </p>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">
            <UsersIcon className="h-4 w-4 mr-2" />
            Classes ({classes?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="levels">
            <Layers className="h-4 w-4 mr-2" />
            Niveaux ({levels?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* CLASSES */}
        <TabsContent value="classes" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openCls} onOpenChange={setOpenCls}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-glow" disabled={!levels?.length}>
                  <Plus className="h-4 w-4" /> Nouvelle classe
                </Button>
              </DialogTrigger>
              <NewClassDialog
                schoolId={school.id}
                yearId={year.id}
                levels={levels ?? []}
                onCreated={() => {
                  setOpenCls(false);
                  qc.invalidateQueries({ queryKey: ["classes"] });
                }}
              />
            </Dialog>
          </div>

          {clsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-10" />
          ) : !classes?.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
              <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">Aucune classe créée pour cette année.</p>
              {!levels?.length && (
                <p className="text-xs text-muted-foreground">
                  Commencez par créer des niveaux dans l'onglet « Niveaux ».
                </p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display font-bold text-lg">{c.name}</div>
                      {c.section && (
                        <div className="text-xs text-muted-foreground mt-0.5">{c.section}</div>
                      )}
                    </div>
                    {c.level && <Badge variant="secondary">{c.level.short_code}</Badge>}
                  </div>
                  <div className="mt-4 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Capacité</span>
                      <span className="font-medium text-foreground">{c.capacity} élèves</span>
                    </div>
                    {c.room && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Salle</span>
                        <span className="font-medium text-foreground">{c.room}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* LEVELS */}
        <TabsContent value="levels" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={openLvl} onOpenChange={setOpenLvl}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-glow" variant="outline">
                  <Plus className="h-4 w-4" /> Nouveau niveau
                </Button>
              </DialogTrigger>
              <NewLevelDialog
                schoolId={school.id}
                onCreated={() => {
                  setOpenLvl(false);
                  qc.invalidateQueries({ queryKey: ["levels"] });
                }}
              />
            </Dialog>
          </div>

          {lvlLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-10" />
          ) : !levels?.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun niveau créé.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">Nom</th>
                    <th className="text-left px-4 py-3">Cycle</th>
                    <th className="text-right px-4 py-3 w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((l) => (
                    <tr key={l.id} className="border-t border-border/50">
                      <td className="px-4 py-3 font-semibold">{l.short_code}</td>
                      <td className="px-4 py-3">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.cycle ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(`Supprimer le niveau « ${l.name} » ?`)) return;
                            const { error } = await supabase.from("levels").delete().eq("id", l.id);
                            if (error) toast.error("Erreur", { description: error.message });
                            else {
                              toast.success("Supprimé");
                              qc.invalidateQueries({ queryKey: ["levels"] });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewLevelDialog({ schoolId, onCreated }: { schoolId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [cycle, setCycle] = useState("");
  const [order, setOrder] = useState(1);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !code) return;
    setLoading(true);
    const { error } = await supabase.from("levels").insert({
      school_id: schoolId,
      name,
      short_code: code.toUpperCase(),
      cycle: cycle || null,
      order_index: order,
    });
    setLoading(false);
    if (error) toast.error("Erreur", { description: error.message });
    else {
      toast.success("Niveau créé");
      onCreated();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nouveau niveau</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Nom complet *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sixième" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Code court *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6E" />
          </div>
          <div className="space-y-2">
            <Label>Ordre</Label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cycle (optionnel)</Label>
          <Input
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="Premier cycle"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={loading || !name || !code} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NewClassDialog({
  schoolId,
  yearId,
  levels,
  onCreated,
}: {
  schoolId: string;
  yearId: string;
  levels: { id: string; name: string; short_code: string }[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const [capacity, setCapacity] = useState(30);
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !levelId) return;
    setLoading(true);
    const { error } = await supabase.from("classes").insert({
      school_id: schoolId,
      academic_year_id: yearId,
      level_id: levelId,
      name,
      section: section || null,
      capacity,
      room: room || null,
    });
    setLoading(false);
    if (error) toast.error("Erreur", { description: error.message });
    else {
      toast.success("Classe créée");
      onCreated();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nouvelle classe</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Nom de la classe *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="6ème A" />
        </div>
        <div className="space-y-2">
          <Label>Niveau *</Label>
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.short_code} — {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Section / Filière (optionnel)</Label>
          <Input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Sciences, Lettres…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Capacité</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Salle (optionnel)</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="A102" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={loading || !name || !levelId} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
