import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool, useActiveAcademicYear, useClasses } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRightLeft,
  GraduationCap,
  Loader2,
  MoreVertical,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type DialogKind = null | "reenroll" | "transfer" | "expel";

export function StudentActions({ student }: { student: any }) {
  const [open, setOpen] = useState<DialogKind>(null);
  const close = () => setOpen(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MoreVertical className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setOpen("reenroll")} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réinscrire / Changer de classe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("transfer")} className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transférer vers une autre école
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("expel")} className="gap-2 text-destructive focus:text-destructive">
            <XCircle className="h-4 w-4" />
            Radier l'élève
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReenrollDialog open={open === "reenroll"} onClose={close} student={student} />
      <TransferDialog open={open === "transfer"} onClose={close} student={student} />
      <ExpelDialog open={open === "expel"} onClose={close} student={student} />
    </>
  );
}

/* ============= Réinscription ============= */
function ReenrollDialog({ open, onClose, student }: { open: boolean; onClose: () => void; student: any }) {
  const qc = useQueryClient();
  const { data: school } = useCurrentSchool();
  const { data: activeYear } = useActiveAcademicYear(school?.id);
  const { data: classes } = useClasses(school?.id, activeYear?.id);

  const [classId, setClassId] = useState<string>("");

  const reenroll = useMutation({
    mutationFn: async () => {
      if (!classId || !activeYear) throw new Error("Sélection requise");

      // Clore l'inscription active actuelle
      const { error: closeErr } = await supabase
        .from("enrollments")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("student_id", student.id)
        .eq("status", "enrolled");
      if (closeErr) throw closeErr;

      // Créer une nouvelle inscription
      const { error: insErr } = await supabase.from("enrollments").insert({
        student_id: student.id,
        class_id: classId,
        academic_year_id: activeYear.id,
        status: "enrolled",
      });
      if (insErr) throw insErr;

      // Réactiver l'élève si besoin
      if (student.status !== "active") {
        await supabase.from("students").update({ status: "active" }).eq("id", student.id);
      }
    },
    onSuccess: () => {
      toast.success("Élève réinscrit avec succès");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
      setClassId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Réinscrire / Changer de classe
          </DialogTitle>
          <DialogDescription>
            L'inscription actuelle sera clôturée et une nouvelle sera créée pour l'année scolaire active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Année scolaire active</div>
            <div className="font-medium">{activeYear?.name ?? "Aucune année active"}</div>
          </div>

          <div>
            <Label>Nouvelle classe</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {(classes ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.level?.short_code && ` · ${c.level.short_code}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(classes ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Aucune classe disponible. Créez d'abord une classe pour cette année.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => reenroll.mutate()}
            disabled={!classId || !activeYear || reenroll.isPending}
            className="gap-2"
          >
            {reenroll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============= Transfert ============= */
function TransferDialog({ open, onClose, student }: { open: boolean; onClose: () => void; student: any }) {
  const qc = useQueryClient();
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const transfer = useMutation({
    mutationFn: async () => {
      if (!destination || !reason || !date) throw new Error("Tous les champs sont requis");

      const certificate_number = `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;

      const { error: trfErr } = await supabase.from("student_transfers").insert({
        student_id: student.id,
        transfer_type: "outgoing",
        destination_school: destination,
        reason,
        effective_date: date,
        certificate_number,
      });
      if (trfErr) throw trfErr;

      // Clore inscription active
      await supabase
        .from("enrollments")
        .update({ status: "transferred", ended_at: new Date().toISOString() })
        .eq("student_id", student.id)
        .eq("status", "enrolled");

      // Mettre à jour statut élève
      const { error: stuErr } = await supabase
        .from("students")
        .update({ status: "transferred" })
        .eq("id", student.id);
      if (stuErr) throw stuErr;
    },
    onSuccess: () => {
      toast.success("Transfert enregistré");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      onClose();
      setDestination("");
      setReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transférer vers une autre école
          </DialogTitle>
          <DialogDescription>
            Un certificat de transfert sera généré et l'élève passera au statut "transféré".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>École de destination</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Nom complet de l'école"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Date effective</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Motif du transfert</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Déménagement, choix familial, etc."
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => transfer.mutate()}
            disabled={!destination || !reason || transfer.isPending}
            className="gap-2"
          >
            {transfer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer le transfert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============= Radiation ============= */
function ExpelDialog({ open, onClose, student }: { open: boolean; onClose: () => void; student: any }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expelled" | "archived">("expelled");

  const expel = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error("Le motif est requis");

      const certificate_number = `RAD-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;

      const { error: trfErr } = await supabase.from("student_transfers").insert({
        student_id: student.id,
        transfer_type: type === "expelled" ? "expulsion" : "archive",
        reason,
        effective_date: date,
        certificate_number,
      });
      if (trfErr) throw trfErr;

      // Clore inscription
      await supabase
        .from("enrollments")
        .update({ status: type === "expelled" ? "expelled" : "withdrawn", ended_at: new Date().toISOString() })
        .eq("student_id", student.id)
        .eq("status", "enrolled");

      // Statut élève
      const { error: stuErr } = await supabase
        .from("students")
        .update({ status: type })
        .eq("id", student.id);
      if (stuErr) throw stuErr;
    },
    onSuccess: () => {
      toast.success(type === "expelled" ? "Radiation enregistrée" : "Élève archivé");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      onClose();
      setReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Radier l'élève
          </DialogTitle>
          <DialogDescription>
            Cette action clôt la scolarité de l'élève. Son dossier reste accessible en consultation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Type de radiation</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expelled">Renvoi disciplinaire</SelectItem>
                <SelectItem value="archived">Archivage / Abandon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date effective</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Motif</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Détaillez le motif de la radiation"
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            variant="destructive"
            onClick={() => expel.mutate()}
            disabled={!reason || expel.isPending}
            className="gap-2"
          >
            {expel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer la radiation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
