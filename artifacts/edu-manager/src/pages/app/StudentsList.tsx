import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  Search,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useStudents } from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudentsList() {
  const navigate = useNavigate();
  const { data: school } = useCurrentSchool();
  const { data: students, isLoading } = useStudents(school?.id);
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement l'élève « ${name} » ?\nCette action retire aussi inscriptions et documents.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast.error("Erreur", { description: error.message });
    else { toast.success("Élève supprimé"); qc.invalidateQueries({ queryKey: ["students"] }); }
  };

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <div className="container max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Vie scolaire
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Élèves</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {students?.length ?? 0} élève{(students?.length ?? 0) > 1 ? "s" : ""} ·{" "}
            {school?.name ?? "—"}
          </p>
        </div>
        <Button asChild className="gap-2 self-start sm:self-auto">
          <Link to="/app/students/new">
            <UserPlus className="h-4 w-4" />
            Nouvelle inscription
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, matricule)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="h-8 gap-1.5"
          >
            <List className="h-4 w-4" /> Liste
          </Button>
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-8 gap-1.5"
          >
            <LayoutGrid className="h-4 w-4" /> Trombinoscope
          </Button>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSchool={!!school} />
      ) : view === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => {
                const enrollment = s.enrollments?.[0];
                return (
                  <TableRow key={s.id} onClick={() => navigate(`/app/students/${s.id}`)} className="cursor-pointer hover:bg-muted/40">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        {s.photo_url && <AvatarImage src={s.photo_url} />}
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                          {s.first_name[0]}
                          {s.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {s.first_name} {s.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.date_of_birth).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.matricule}</TableCell>
                    <TableCell>
                      {enrollment?.class?.name ?? (
                        <span className="text-muted-foreground">Non affecté</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.gender === "male" ? "M" : s.gender === "female" ? "F" : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/students/${s.id}`)} className="gap-2">
                            <Pencil className="h-4 w-4" /> Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((s: any) => (
            <Card
              key={s.id}
              onClick={() => navigate(`/app/students/${s.id}`)}
              className="p-4 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer"
            >
              <Avatar className="h-20 w-20 mb-3 ring-2 ring-background shadow-md">
                {s.photo_url && <AvatarImage src={s.photo_url} />}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                  {s.first_name[0]}
                  {s.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="font-display font-semibold text-sm leading-tight">
                {s.first_name}
              </div>
              <div className="font-display font-semibold text-sm leading-tight">
                {s.last_name}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                {s.matricule}
              </div>
              {s.enrollments?.[0]?.class?.name && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {s.enrollments[0].class.name}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Actif", className: "bg-success/15 text-success border-success/30" },
    suspended: { label: "Suspendu", className: "bg-warning/15 text-warning border-warning/30" },
    graduated: { label: "Diplômé", className: "bg-info/15 text-info border-info/30" },
    transferred: { label: "Transféré", className: "bg-muted text-muted-foreground" },
    expelled: { label: "Renvoyé", className: "bg-destructive/15 text-destructive border-destructive/30" },
    archived: { label: "Archivé", className: "bg-muted text-muted-foreground" },
  };
  const meta = map[status] ?? { label: status, className: "bg-muted" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.className)}>
      {meta.label}
    </span>
  );
}

function EmptyState({ hasSchool }: { hasSchool: boolean }) {
  if (!hasSchool) {
    return (
      <Card className="p-12 text-center">
        <h3 className="font-display text-xl font-bold mb-2">Aucun établissement</h3>
        <p className="text-muted-foreground mb-6">
          Configurez votre établissement avant de commencer à inscrire des élèves.
        </p>
        <Button asChild>
          <Link to="/app/school-setup">Configurer maintenant</Link>
        </Button>
      </Card>
    );
  }
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2">Aucun élève inscrit</h3>
      <p className="text-muted-foreground mb-6">
        Démarrez par l'inscription du premier élève de votre établissement.
      </p>
      <Button asChild className="gap-2">
        <Link to="/app/students/new">
          <UserPlus className="h-4 w-4" />
          Inscrire un élève
        </Link>
      </Button>
    </Card>
  );
}
