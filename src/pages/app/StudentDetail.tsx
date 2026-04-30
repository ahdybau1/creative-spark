import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Upload,
  User,
  Users,
  GraduationCap,
  AlertTriangle,
  Download,
  Trash2,
  ShieldAlert,
  History,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudent } from "@/hooks/useStudents";
import { StudentActions } from "@/components/StudentActions";
import { StudentDocuments } from "@/components/StudentDocuments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type DocumentType = Database["public"]["Enums"]["document_type"];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "birth_certificate", label: "Acte de naissance" },
  { value: "id_card", label: "Pièce d'identité" },
  { value: "passport", label: "Passeport" },
  { value: "previous_report", label: "Bulletins précédents" },
  { value: "medical_certificate", label: "Certificat médical" },
  { value: "vaccination_record", label: "Carnet de vaccination" },
  { value: "photo", label: "Photo d'identité" },
  { value: "address_proof", label: "Justificatif de domicile" },
  { value: "parent_id", label: "Pièce d'identité parent" },
  { value: "other", label: "Autre" },
];

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container max-w-3xl py-12 px-4">
        <Card className="p-12 text-center">
          <h2 className="font-display text-xl font-bold mb-2">Élève introuvable</h2>
          <p className="text-muted-foreground mb-6">
            Ce dossier n'existe pas ou vous n'y avez pas accès.
          </p>
          <Button onClick={() => navigate("/app/students")}>Retour à la liste</Button>
        </Card>
      </div>
    );
  }

  const fullName = `${student.first_name} ${student.last_name}`;
  const age = useMemo(() => {
    const dob = new Date(student.date_of_birth);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }, [student.date_of_birth]);

  const currentEnrollment = (student as any).enrollments?.find(
    (e: any) => e.status === "enrolled"
  );

  return (
    <div className="container max-w-6xl py-6 px-4">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/app/students">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <StudentActions student={student} />
      </div>

      {/* Header card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
            {student.photo_url && <AvatarImage src={student.photo_url} />}
            <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground font-bold">
              {student.first_name[0]}
              {student.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              <GraduationCap className="h-3.5 w-3.5" />
              Dossier élève
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className="font-mono text-xs">
                {student.matricule}
              </Badge>
              <Badge variant="secondary">
                {student.gender === "male" ? "Garçon" : student.gender === "female" ? "Fille" : "Autre"} · {age} ans
              </Badge>
              {currentEnrollment?.class && (
                <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                  {currentEnrollment.class.name}
                </Badge>
              )}
              <StatusBadge status={student.status} />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="identity" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Identité
          </TabsTrigger>
          <TabsTrigger value="family" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Famille
          </TabsTrigger>
          <TabsTrigger value="medical" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" /> Médical
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Scolarité
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Parcours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-6">
          <IdentityTab student={student} />
        </TabsContent>
        <TabsContent value="family" className="mt-6">
          <FamilyTab student={student} />
        </TabsContent>
        <TabsContent value="medical" className="mt-6">
          <MedicalTab student={student} />
        </TabsContent>
        <TabsContent value="academic" className="mt-6">
          <AcademicTab student={student} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsTab student={student} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistoryTab student={student} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ Identity Tab ============ */
function IdentityTab({ student }: { student: any }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: student.first_name ?? "",
    last_name: student.last_name ?? "",
    middle_name: student.middle_name ?? "",
    preferred_name: student.preferred_name ?? "",
    date_of_birth: student.date_of_birth ?? "",
    place_of_birth: student.place_of_birth ?? "",
    nationality: student.nationality ?? "",
    mother_tongue: student.mother_tongue ?? "",
    religion: student.religion ?? "",
    address: student.address ?? "",
    city: student.city ?? "",
    region: student.region ?? "",
    country: student.country ?? "",
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("students")
        .update(form)
        .eq("id", student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Identité mise à jour");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      qc.invalidateQueries({ queryKey: ["students"] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg">Informations personnelles</h3>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Prénom" value={form.first_name} editing={editing} onChange={(v) => setForm({ ...form, first_name: v })} />
        <Field label="Nom" value={form.last_name} editing={editing} onChange={(v) => setForm({ ...form, last_name: v })} />
        <Field label="Deuxième prénom" value={form.middle_name} editing={editing} onChange={(v) => setForm({ ...form, middle_name: v })} />
        <Field label="Surnom / Nom d'usage" value={form.preferred_name} editing={editing} onChange={(v) => setForm({ ...form, preferred_name: v })} />
        <Field label="Date de naissance" type="date" value={form.date_of_birth} editing={editing} onChange={(v) => setForm({ ...form, date_of_birth: v })} icon={<Calendar className="h-3.5 w-3.5" />} />
        <Field label="Lieu de naissance" value={form.place_of_birth} editing={editing} onChange={(v) => setForm({ ...form, place_of_birth: v })} />
        <Field label="Nationalité" value={form.nationality} editing={editing} onChange={(v) => setForm({ ...form, nationality: v })} />
        <Field label="Langue maternelle" value={form.mother_tongue} editing={editing} onChange={(v) => setForm({ ...form, mother_tongue: v })} />
        <Field label="Religion" value={form.religion} editing={editing} onChange={(v) => setForm({ ...form, religion: v })} />
      </div>

      <h4 className="font-display font-bold mt-8 mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Adresse
      </h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Adresse" value={form.address} editing={editing} onChange={(v) => setForm({ ...form, address: v })} className="sm:col-span-2" />
        <Field label="Ville" value={form.city} editing={editing} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="Région" value={form.region} editing={editing} onChange={(v) => setForm({ ...form, region: v })} />
        <Field label="Pays" value={form.country} editing={editing} onChange={(v) => setForm({ ...form, country: v })} />
      </div>
    </Card>
  );
}

/* ============ Family Tab ============ */
function FamilyTab({ student }: { student: any }) {
  const guardians = student.guardians ?? [];
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg">Tuteurs & contacts famille</h3>
        <Badge variant="secondary">{guardians.length} contact{guardians.length > 1 ? "s" : ""}</Badge>
      </div>

      {guardians.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun tuteur enregistré.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {guardians.map((g: any) => (
            <Card key={g.id} className="p-4 bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{g.full_name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {guardianTypeLabel(g.guardian_type)}
                    {g.occupation ? ` · ${g.occupation}` : ""}
                  </div>
                </div>
                {g.is_primary && <Badge className="text-[10px]">Principal</Badge>}
              </div>
              <div className="space-y-1.5 text-sm">
                {g.phone && (
                  <a href={`tel:${g.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Phone className="h-3.5 w-3.5" /> {g.phone}
                  </a>
                )}
                {g.email && (
                  <a href={`mailto:${g.email}`} className="flex items-center gap-2 text-foreground hover:text-primary truncate">
                    <Mail className="h-3.5 w-3.5" /> {g.email}
                  </a>
                )}
                {g.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span>{g.address}</span>
                  </div>
                )}
              </div>
              {!g.is_pickup_authorized && (
                <Badge variant="destructive" className="mt-3 text-[10px]">
                  <ShieldAlert className="h-3 w-3 mr-1" /> Non autorisé à récupérer
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

function guardianTypeLabel(type: string) {
  const map: Record<string, string> = {
    father: "Père",
    mother: "Mère",
    legal_guardian: "Tuteur légal",
    grandparent: "Grand-parent",
    sibling: "Fratrie",
    other: "Autre",
  };
  return map[type] ?? type;
}

/* ============ Medical Tab ============ */
function MedicalTab({ student }: { student: any }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    blood_type: student.blood_type ?? "unknown",
    allergies: student.allergies ?? "",
    chronic_conditions: student.chronic_conditions ?? "",
    disability: student.disability ?? "",
    treating_doctor_name: student.treating_doctor_name ?? "",
    treating_doctor_phone: student.treating_doctor_phone ?? "",
    emergency_contact_name: student.emergency_contact_name ?? "",
    emergency_contact_phone: student.emergency_contact_phone ?? "",
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").update(form).eq("id", student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informations médicales mises à jour");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" /> Informations médicales
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Données confidentielles · accès restreint au personnel autorisé
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Groupe sanguin</Label>
          {editing ? (
            <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v as any })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["unknown", "a_pos", "a_neg", "b_pos", "b_neg", "ab_pos", "ab_neg", "o_pos", "o_neg"].map((b) => (
                  <SelectItem key={b} value={b}>{formatBlood(b)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="mt-1.5 font-medium">{formatBlood(form.blood_type)}</div>
          )}
        </div>
        <FieldArea label="Allergies" value={form.allergies} editing={editing} onChange={(v) => setForm({ ...form, allergies: v })} />
        <FieldArea label="Maladies chroniques" value={form.chronic_conditions} editing={editing} onChange={(v) => setForm({ ...form, chronic_conditions: v })} />
        <FieldArea label="Handicap / besoins spécifiques" value={form.disability} editing={editing} onChange={(v) => setForm({ ...form, disability: v })} />
      </div>

      <h4 className="font-display font-bold mt-8 mb-4">Médecin traitant</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom du médecin" value={form.treating_doctor_name} editing={editing} onChange={(v) => setForm({ ...form, treating_doctor_name: v })} />
        <Field label="Téléphone" value={form.treating_doctor_phone} editing={editing} onChange={(v) => setForm({ ...form, treating_doctor_phone: v })} />
      </div>

      <h4 className="font-display font-bold mt-8 mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" /> Contact d'urgence
      </h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom" value={form.emergency_contact_name} editing={editing} onChange={(v) => setForm({ ...form, emergency_contact_name: v })} />
        <Field label="Téléphone" value={form.emergency_contact_phone} editing={editing} onChange={(v) => setForm({ ...form, emergency_contact_phone: v })} />
      </div>
    </Card>
  );
}

function formatBlood(b: string) {
  const map: Record<string, string> = {
    unknown: "Inconnu", a_pos: "A+", a_neg: "A−", b_pos: "B+", b_neg: "B−",
    ab_pos: "AB+", ab_neg: "AB−", o_pos: "O+", o_neg: "O−",
  };
  return map[b] ?? b;
}

/* ============ Academic Tab ============ */
function AcademicTab({ student }: { student: any }) {
  const enrollments = student.enrollments ?? [];
  return (
    <Card className="p-6">
      <h3 className="font-display font-bold text-lg mb-6">Parcours scolaire</h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Field label="Date d'inscription" value={new Date(student.enrollment_date).toLocaleDateString()} editing={false} onChange={() => {}} />
        <Field label="École précédente" value={student.previous_school ?? "—"} editing={false} onChange={() => {}} />
        <Field label="Classe précédente" value={student.previous_class ?? "—"} editing={false} onChange={() => {}} />
        <Field label="Résultats antérieurs" value={student.previous_results ?? "—"} editing={false} onChange={() => {}} />
      </div>

      <h4 className="font-display font-bold mb-3">Historique des inscriptions</h4>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune inscription en classe pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
              <div>
                <div className="font-medium text-sm">
                  {e.class?.name ?? "Classe"}
                  {e.class?.level?.name && (
                    <span className="text-muted-foreground"> · {e.class.level.name}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Inscrit le {new Date(e.enrolled_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant={e.status === "enrolled" ? "default" : "secondary"}>
                {e.status === "enrolled" ? "Inscrit" : e.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============ Documents Tab ============ */
function DocumentsTab({ student }: { student: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("birth_certificate");
  const [uploading, setUploading] = useState(false);

  const documents = student.documents ?? [];

  const upload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${student.school_id}/${student.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("student-documents")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("student_documents").insert({
        student_id: student.id,
        document_type: docType,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insErr) throw insErr;

      toast.success("Document ajouté");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Échec de l'envoi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage
      .from("student-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (doc: any) => {
    try {
      await supabase.storage.from("student-documents").remove([doc.file_path]);
      const { error } = await supabase.from("student_documents").delete().eq("id", doc.id);
      if (error) throw error;
      toast.success("Document supprimé");
      qc.invalidateQueries({ queryKey: ["student", student.id] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-display font-bold text-lg mb-6">Documents administratifs</h3>

      <div className="rounded-lg border-2 border-dashed p-4 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <Label className="text-xs">Type de document</Label>
          <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Téléverser
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun document pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any) => {
            const type = DOCUMENT_TYPES.find((d) => d.value === doc.document_type);
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{doc.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {type?.label ?? doc.document_type}
                    {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} Ko`}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le fichier "{doc.file_name}" sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDoc(doc)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ============ Helpers ============ */
function Field({
  label, value, editing, onChange, type = "text", icon, className,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {editing ? (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
      ) : (
        <div className="mt-1.5 font-medium text-sm min-h-[1.5rem]">
          {value || <span className="text-muted-foreground italic font-normal">non renseigné</span>}
        </div>
      )}
    </div>
  );
}

function FieldArea({
  label, value, editing, onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {editing ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" rows={2} />
      ) : (
        <div className="mt-1.5 text-sm min-h-[1.5rem]">
          {value || <span className="text-muted-foreground italic">non renseigné</span>}
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

/* ============ History Tab (transferts / radiations) ============ */
function HistoryTab({ student }: { student: any }) {
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfers", student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_transfers")
        .select("*")
        .eq("student_id", student.id)
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enrollments = (student.enrollments ?? []).slice().sort(
    (a: any, b: any) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
  );

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      incoming: "Arrivée (transfert entrant)",
      outgoing: "Transfert sortant",
      expulsion: "Radiation / Renvoi",
      graduation: "Fin de scolarité",
    };
    return map[t] ?? t;
  };

  const typeClass = (t: string) =>
    t === "expulsion"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : t === "outgoing"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-info/15 text-info border-info/30";

  return (
    <Card className="p-6">
      <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        Parcours administratif
      </h3>

      {/* Transferts */}
      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
        Transferts & radiations
      </h4>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !transfers || transfers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Aucun transfert ni radiation enregistré.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {transfers.map((t: any) => (
            <div key={t.id} className="rounded-lg border p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Badge className={cn("mb-2", typeClass(t.transfer_type))}>{typeLabel(t.transfer_type)}</Badge>
                  <div className="font-medium text-sm">
                    {t.destination_school ?? t.origin_school ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Effectif le {new Date(t.effective_date).toLocaleDateString()}
                    {t.certificate_number && (
                      <> · N° certificat <span className="font-mono">{t.certificate_number}</span></>
                    )}
                  </div>
                </div>
              </div>
              {t.reason && (
                <div className="mt-3 text-sm text-foreground/80 border-l-2 border-primary/30 pl-3">
                  {t.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inscriptions */}
      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
        Historique des inscriptions
      </h4>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Aucune inscription en classe.</p>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <div className="font-medium text-sm">
                  {e.class?.name ?? "Classe"}
                  {e.class?.level?.name && (
                    <span className="text-muted-foreground"> · {e.class.level.name}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Du {new Date(e.enrolled_at).toLocaleDateString()}
                  {e.ended_at && ` au ${new Date(e.ended_at).toLocaleDateString()}`}
                </div>
              </div>
              <Badge variant={e.status === "enrolled" ? "default" : "secondary"} className="text-[10px]">
                {e.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
