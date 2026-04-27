import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  SCHOOL_TYPES,
  ALL_SCHOOL_TYPES,
  COUNTRIES,
  CALENDAR_SYSTEMS,
  GRADING_SYSTEMS,
  type SchoolType,
  type CalendarSystem,
  type GradingSystem,
} from "@/lib/school-types";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const STEPS = ["Type", "Identité", "Localisation", "Paramètres", "Confirmation"] as const;

export default function SchoolSetupWizard() {
  const { user, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    school_type: "high_school" as SchoolType,
    name: "",
    motto: "",
    founded_year: new Date().getFullYear(),
    country: "FR",
    address: "",
    phone: "",
    email: "",
    website: "",
    default_language: "fr",
    calendar_system: "trimester" as const,
    grading_system: "out_of_20" as const,
  });

  const update = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const onChooseType = (type: SchoolType) => {
    const meta = SCHOOL_TYPES[type];
    setData((d) => ({
      ...d,
      school_type: type,
      calendar_system: meta.recommendedCalendar,
      grading_system: meta.recommendedGrading,
    }));
    setStep(1);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const canContinue = () => {
    if (step === 1) return data.name.trim().length >= 2;
    if (step === 2) return !!data.country;
    return true;
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const country = COUNTRIES.find((c) => c.code === data.country);
      const currency = country?.currency ?? "EUR";

      // 1. Create school
      const { data: school, error: schoolErr } = await supabase
        .from("schools")
        .insert({
          name: data.name,
          school_type: data.school_type,
          motto: data.motto || null,
          founded_year: data.founded_year || null,
          country: data.country,
          currency,
          default_language: data.default_language,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          calendar_system: data.calendar_system,
          grading_system: data.grading_system,
        })
        .select()
        .single();

      if (schoolErr || !school) throw schoolErr ?? new Error("Création école impossible");

      // 2. Link profile to school
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ school_id: school.id })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      // 3. Assign director role to current user
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "director", school_id: school.id });
      if (roleErr && roleErr.code !== "23505") throw roleErr;

      // 4. Create default levels for this school type
      const meta = SCHOOL_TYPES[data.school_type];
      const { error: levelsErr } = await supabase.from("levels").insert(
        meta.defaultLevels.map((l) => ({
          school_id: school.id,
          name: l.name,
          short_code: l.short_code,
          cycle: l.cycle ?? null,
          order_index: l.order_index,
        })),
      );
      if (levelsErr) throw levelsErr;

      // 5. Create current academic year (active)
      const today = new Date();
      const isSecondHalf = today.getMonth() >= 6; // Jul-Dec → start of new year
      const startYear = isSecondHalf ? today.getFullYear() : today.getFullYear() - 1;
      const yearName = `${startYear}-${startYear + 1}`;
      const { error: yearErr } = await supabase.from("academic_years").insert({
        school_id: school.id,
        name: yearName,
        start_date: `${startYear}-09-01`,
        end_date: `${startYear + 1}-07-15`,
        is_active: true,
      });
      if (yearErr) throw yearErr;

      // 6. Refresh state
      await qc.invalidateQueries();
      setActiveRole("director");
      toast.success("École créée avec succès !", {
        description: `${meta.defaultLevels.length} niveaux et l'année ${yearName} initialisés.`,
      });
      navigate("/app");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la création", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex">
            <Logo size="lg" />
          </div>
          <h1 className="mt-6 font-display text-3xl lg:text-4xl font-bold tracking-tight">
            Configurez votre établissement
          </h1>
          <p className="mt-3 text-muted-foreground">
            5 étapes rapides pour personnaliser EduMaster Pro selon votre école.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 px-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-smooth",
                  i < step && "bg-success text-success-foreground",
                  i === step && "bg-primary text-primary-foreground shadow-glow",
                  i > step && "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "ml-2 text-xs font-medium hidden sm:inline",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 sm:w-12 h-0.5 mx-2 transition-smooth",
                    i < step ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 lg:p-10 shadow-card">
          {/* Step 0: Type */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Type d'établissement</h2>
              <p className="text-muted-foreground mb-6">
                EduMaster Pro s'adapte automatiquement à votre type d'école.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_SCHOOL_TYPES.map((key) => {
                  const meta = SCHOOL_TYPES[key];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => onChooseType(key)}
                      className={cn(
                        "text-left rounded-2xl border p-4 transition-smooth",
                        data.school_type === key
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border/50 hover:border-primary/50 hover:-translate-y-0.5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0",
                            meta.color,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-semibold">{meta.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{meta.ageRange}</div>
                          <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {meta.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Identité de l'école</h2>
                <p className="text-muted-foreground">Comment s'appelle votre établissement ?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'établissement *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Lycée Lumière de Dakar"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">Devise / Slogan (optionnel)</Label>
                <Input
                  id="motto"
                  value={data.motto}
                  onChange={(e) => update("motto", e.target.value)}
                  placeholder="L'excellence à portée de tous"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="founded">Année de fondation</Label>
                <Input
                  id="founded"
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={data.founded_year}
                  onChange={(e) => update("founded_year", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Localisation & contact</h2>
                <p className="text-muted-foreground">
                  Définit la devise par défaut et les options Mobile Money disponibles.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <select
                  id="country"
                  value={data.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Avenue Léopold Sédar Senghor, Dakar"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+221 33 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="contact@ecole.sn"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={data.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://ecole.sn"
                />
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Paramètres pédagogiques</h2>
                <p className="text-muted-foreground">
                  Présélectionnés selon votre type d'école — modifiables à tout moment.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Langue principale</Label>
                <select
                  value={data.default_language}
                  onChange={(e) => update("default_language", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="ar">🇸🇦 العربية</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="sw">🇰🇪 Kiswahili</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Système de calendrier</Label>
                <div className="grid gap-2">
                  {CALENDAR_SYSTEMS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => update("calendar_system", c.key)}
                      className={cn(
                        "text-left rounded-xl border p-3 transition-smooth",
                        data.calendar_system === c.key
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="font-medium text-sm">{c.label}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Système de notation</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {GRADING_SYSTEMS.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => update("grading_system", g.key)}
                      className={cn(
                        "text-left rounded-xl border p-3 transition-smooth",
                        data.grading_system === g.key
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="font-medium text-sm">{g.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {g.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold">Tout est prêt !</h2>
                <p className="mt-2 text-muted-foreground">
                  Vérifiez les informations puis lancez la création.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 border border-border/50 p-5 space-y-3">
                <Row label="Type" value={SCHOOL_TYPES[data.school_type].label} />
                <Row label="Nom" value={data.name} />
                {data.motto && <Row label="Devise" value={data.motto} />}
                <Row
                  label="Pays"
                  value={
                    COUNTRIES.find((c) => c.code === data.country)?.flag +
                    " " +
                    COUNTRIES.find((c) => c.code === data.country)?.name
                  }
                />
                <Row
                  label="Devise"
                  value={COUNTRIES.find((c) => c.code === data.country)?.currency ?? "EUR"}
                />
                <Row
                  label="Calendrier"
                  value={CALENDAR_SYSTEMS.find((c) => c.key === data.calendar_system)?.label ?? ""}
                />
                <Row
                  label="Notation"
                  value={GRADING_SYSTEMS.find((g) => g.key === data.grading_system)?.label ?? ""}
                />
                <Row
                  label="Niveaux pré-créés"
                  value={`${SCHOOL_TYPES[data.school_type].defaultLevels.length} niveaux`}
                />
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                <strong className="text-primary">Vous serez automatiquement défini comme Directeur</strong>
                <p className="mt-1 text-muted-foreground">
                  Vous pourrez ensuite créer des comptes pour le personnel, les élèves et les parents.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canContinue()} className="gap-2 shadow-glow">
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="gap-2 shadow-glow">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Créer mon établissement
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
