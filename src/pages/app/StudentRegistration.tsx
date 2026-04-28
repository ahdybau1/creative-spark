import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HeartPulse,
  Loader2,
  School as SchoolIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCurrentSchool,
  useActiveAcademicYear,
  useLevels,
  useClasses,
} from "@/hooks/useSchool";
import { useCreateStudent } from "@/hooks/useStudents";
import { PhotoUpload } from "@/components/PhotoUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { key: "identity", label: "Identité", icon: UserPlus },
  { key: "medical", label: "Médical", icon: HeartPulse },
  { key: "family", label: "Famille", icon: Users },
  { key: "academic", label: "Scolarité", icon: SchoolIcon },
  { key: "review", label: "Confirmation", icon: CheckCircle2 },
] as const;

interface GuardianForm {
  full_name: string;
  guardian_type: "father" | "mother" | "legal_guardian" | "other";
  phone: string;
  email: string;
  occupation: string;
  is_primary: boolean;
  is_pickup_authorized: boolean;
}

const emptyGuardian = (primary = false): GuardianForm => ({
  full_name: "",
  guardian_type: primary ? "father" : "mother",
  phone: "",
  email: "",
  occupation: "",
  is_primary: primary,
  is_pickup_authorized: true,
});

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: school, isLoading: schoolLoading } = useCurrentSchool();
  const { data: activeYear } = useActiveAcademicYear(school?.id);
  const { data: levels } = useLevels(school?.id);
  const { data: classes } = useClasses(school?.id, activeYear?.id);
  const createStudent = useCreateStudent();

  const [step, setStep] = useState<Step>(0);

  // Identity
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [dob, setDob] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [nationality, setNationality] = useState(school?.country ?? "");
  const [motherTongue, setMotherTongue] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Medical
  const [bloodType, setBloodType] = useState<string>("");
  const [allergies, setAllergies] = useState("");
  const [chronic, setChronic] = useState("");
  const [disability, setDisability] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Family
  const [guardians, setGuardians] = useState<GuardianForm[]>([emptyGuardian(true)]);

  // Academic
  const [previousSchool, setPreviousSchool] = useState("");
  const [previousClass, setPreviousClass] = useState("");
  const [classId, setClassId] = useState<string>("");

  const selectedClass = useMemo(
    () => classes?.find((c) => c.id === classId),
    [classes, classId]
  );
  const selectedLevel = useMemo(
    () => levels?.find((l) => l.id === selectedClass?.level_id),
    [levels, selectedClass]
  );

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!firstName.trim() && !!lastName.trim() && !!dob && !!gender;
      case 1:
        return true;
      case 2:
        return guardians.length > 0 && guardians.every((g) => g.full_name.trim());
      case 3:
        return true;
      default:
        return true;
    }
  };

  const fullName = `${firstName} ${lastName}`.trim();

  const handleSubmit = async () => {
    if (!school) return;
    try {
      const created = await createStudent.mutateAsync({
        student: {
          school_id: school.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          middle_name: middleName.trim() || null,
          gender,
          date_of_birth: dob,
          place_of_birth: placeOfBirth || null,
          nationality: nationality || null,
          mother_tongue: motherTongue || null,
          address: address || null,
          city: city || null,
          country: school.country ?? null,
          photo_url: photoUrl,
          blood_type: (bloodType as any) || null,
          allergies: allergies || null,
          chronic_conditions: chronic || null,
          disability: disability || null,
          treating_doctor_name: doctorName || null,
          treating_doctor_phone: doctorPhone || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
          previous_school: previousSchool || null,
          previous_class: previousClass || null,
          status: "active",
          created_by: user?.id ?? null,
        },
        level_short_code: selectedLevel?.short_code ?? null,
        guardians: guardians.map((g) => ({
          full_name: g.full_name.trim(),
          guardian_type: g.guardian_type,
          phone: g.phone || null,
          email: g.email || null,
          occupation: g.occupation || null,
          is_primary: g.is_primary,
          is_pickup_authorized: g.is_pickup_authorized,
        })),
        class_id: classId || null,
        academic_year_id: activeYear?.id ?? null,
      });
      toast.success(`Élève ${fullName} inscrit • Matricule ${created.matricule}`);
      navigate("/app/students");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'inscription");
    }
  };

  if (schoolLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <h1 className="text-2xl font-display font-bold mb-3">Aucun établissement</h1>
        <p className="text-muted-foreground mb-6">
          Vous devez d'abord configurer votre établissement avant d'inscrire des élèves.
        </p>
        <Button asChild>
          <Link to="/app/school-setup">Configurer maintenant</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            Nouvelle inscription
          </h1>
          <p className="text-sm text-muted-foreground">
            {school.name} · Année {activeYear?.name ?? "non définie"}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <ol className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex items-center gap-1 md:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i as Step)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition",
                    active && "bg-primary text-primary-foreground shadow-glow",
                    done && "bg-success/15 text-success hover:bg-success/25 cursor-pointer",
                    !active && !done && "bg-muted text-muted-foreground"
                  )}
                  disabled={i > step}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden text-xs">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px w-4 md:w-8", done ? "bg-success" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <Card className="p-6 md:p-8">
        {/* === Step 0 : Identity === */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Identité de l'élève</h2>

            <div className="grid md:grid-cols-[auto_1fr] gap-8">
              <PhotoUpload
                schoolId={school.id}
                value={photoUrl}
                onChange={setPhotoUrl}
                fallback={`${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}` || "EL"}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Prénom *" htmlFor="firstName">
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Nom *" htmlFor="lastName">
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
                <Field label="Deuxième prénom" htmlFor="middleName">
                  <Input id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                </Field>
                <Field label="Genre *" htmlFor="gender">
                  <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                    <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculin</SelectItem>
                      <SelectItem value="female">Féminin</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Date de naissance *" htmlFor="dob">
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </Field>
                <Field label="Lieu de naissance" htmlFor="pob">
                  <Input id="pob" value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
                </Field>
                <Field label="Nationalité" htmlFor="nat">
                  <Input id="nat" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                </Field>
                <Field label="Langue maternelle" htmlFor="mt">
                  <Input id="mt" value={motherTongue} onChange={(e) => setMotherTongue(e.target.value)} />
                </Field>
                <Field label="Ville" htmlFor="city">
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                <Field label="Adresse" htmlFor="address" className="sm:col-span-2">
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* === Step 1 : Medical === */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Informations médicales</h2>
              <p className="text-sm text-muted-foreground">Toutes les infos sont confidentielles. Champs optionnels.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Groupe sanguin" htmlFor="blood">
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger id="blood"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {["a_pos", "a_neg", "b_pos", "b_neg", "ab_pos", "ab_neg", "o_pos", "o_neg", "unknown"].map((b) => (
                      <SelectItem key={b} value={b}>
                        {b.replace("_pos", "+").replace("_neg", "-").toUpperCase().replace("UNKNOWN", "Inconnu")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Handicap / situation particulière" htmlFor="dis">
                <Input id="dis" value={disability} onChange={(e) => setDisability(e.target.value)} />
              </Field>
              <Field label="Allergies" htmlFor="alg" className="sm:col-span-2">
                <Textarea id="alg" rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Aliments, médicaments, environnement..." />
              </Field>
              <Field label="Maladies chroniques" htmlFor="chr" className="sm:col-span-2">
                <Textarea id="chr" rows={2} value={chronic} onChange={(e) => setChronic(e.target.value)} placeholder="Asthme, diabète..." />
              </Field>

              <Field label="Médecin traitant — nom" htmlFor="docn">
                <Input id="docn" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
              </Field>
              <Field label="Médecin traitant — téléphone" htmlFor="docp">
                <Input id="docp" value={doctorPhone} onChange={(e) => setDoctorPhone(e.target.value)} />
              </Field>

              <Field label="Contact d'urgence — nom" htmlFor="ergn">
                <Input id="ergn" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              </Field>
              <Field label="Contact d'urgence — téléphone" htmlFor="ergp">
                <Input id="ergp" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* === Step 2 : Family === */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Parents & tuteurs</h2>
                <p className="text-sm text-muted-foreground">Au moins un parent / tuteur est requis.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGuardians((g) => [...g, emptyGuardian(false)])}
              >
                + Ajouter
              </Button>
            </div>

            <div className="space-y-4">
              {guardians.map((g, idx) => (
                <Card key={idx} className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={g.is_primary ? "default" : "secondary"}>
                        {g.is_primary ? "Principal" : `Tuteur ${idx + 1}`}
                      </Badge>
                    </div>
                    {guardians.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuardians((arr) => arr.filter((_, i) => i !== idx))}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nom complet *" htmlFor={`gn${idx}`}>
                      <Input
                        id={`gn${idx}`}
                        value={g.full_name}
                        onChange={(e) =>
                          setGuardians((arr) => arr.map((x, i) => (i === idx ? { ...x, full_name: e.target.value } : x)))
                        }
                      />
                    </Field>
                    <Field label="Type" htmlFor={`gt${idx}`}>
                      <Select
                        value={g.guardian_type}
                        onValueChange={(v) =>
                          setGuardians((arr) => arr.map((x, i) => (i === idx ? { ...x, guardian_type: v as any } : x)))
                        }
                      >
                        <SelectTrigger id={`gt${idx}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Père</SelectItem>
                          <SelectItem value="mother">Mère</SelectItem>
                          <SelectItem value="legal_guardian">Tuteur légal</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Téléphone" htmlFor={`gp${idx}`}>
                      <Input
                        id={`gp${idx}`}
                        value={g.phone}
                        onChange={(e) =>
                          setGuardians((arr) => arr.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)))
                        }
                      />
                    </Field>
                    <Field label="Email" htmlFor={`ge${idx}`}>
                      <Input
                        id={`ge${idx}`}
                        type="email"
                        value={g.email}
                        onChange={(e) =>
                          setGuardians((arr) => arr.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)))
                        }
                      />
                    </Field>
                    <Field label="Profession" htmlFor={`go${idx}`} className="sm:col-span-2">
                      <Input
                        id={`go${idx}`}
                        value={g.occupation}
                        onChange={(e) =>
                          setGuardians((arr) => arr.map((x, i) => (i === idx ? { ...x, occupation: e.target.value } : x)))
                        }
                      />
                    </Field>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* === Step 3 : Academic === */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Affectation scolaire</h2>

            {!activeYear && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
                Aucune année scolaire active.{" "}
                <Link to="/app/academic-years" className="font-semibold underline">
                  Créez-en une
                </Link>{" "}
                pour permettre l'inscription en classe.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Classe d'affectation" htmlFor="class">
                <Select value={classId} onValueChange={setClassId} disabled={!activeYear}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder={classes?.length ? "Choisir une classe" : "Aucune classe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.level && `· ${(c.level as any).short_code}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div />
              <Field label="École précédente" htmlFor="ps">
                <Input id="ps" value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} />
              </Field>
              <Field label="Classe précédente" htmlFor="pc">
                <Input id="pc" value={previousClass} onChange={(e) => setPreviousClass(e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* === Step 4 : Review === */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">Vérification</h2>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 col-span-1 flex flex-col items-center text-center bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="h-24 w-24 rounded-full bg-muted overflow-hidden mb-3 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-display font-bold text-muted-foreground">
                      {(firstName[0] ?? "") + (lastName[0] ?? "")}
                    </span>
                  )}
                </div>
                <div className="font-display font-bold">{fullName || "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {gender === "male" ? "Masculin" : gender === "female" ? "Féminin" : "Autre"} · né(e) le {dob || "?"}
                </div>
                {selectedClass && (
                  <Badge className="mt-3" variant="secondary">
                    {selectedClass.name}
                  </Badge>
                )}
              </Card>

              <div className="md:col-span-2 space-y-3">
                <ReviewRow label="Lieu de naissance" value={placeOfBirth} />
                <ReviewRow label="Nationalité" value={nationality} />
                <ReviewRow label="Adresse" value={[address, city].filter(Boolean).join(", ")} />
                <ReviewRow label="Allergies" value={allergies} />
                <ReviewRow label="Conditions chroniques" value={chronic} />
                <ReviewRow label="Contact d'urgence" value={emergencyName ? `${emergencyName} (${emergencyPhone})` : ""} />
                <ReviewRow
                  label="Tuteurs"
                  value={guardians.map((g) => `${g.full_name}${g.phone ? ` · ${g.phone}` : ""}`).join(" • ")}
                />
                <ReviewRow label="École précédente" value={previousSchool} />
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <strong>Matricule :</strong> il sera généré automatiquement au format{" "}
              <code className="rounded bg-background px-1.5 py-0.5 text-xs">
                {school.matricule_format ?? "{YEAR}-{LEVEL}-{SEQ4}"}
              </code>
            </div>
          </div>
        )}

        {/* Footer (form actions) */}
        <div className="mt-8 pt-6 border-t flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="gap-2"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createStudent.isPending}
              className="gap-2"
            >
              {createStudent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Valider l'inscription
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 text-sm border-b border-border/50 pb-2">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="font-medium flex-1">{value || <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}
