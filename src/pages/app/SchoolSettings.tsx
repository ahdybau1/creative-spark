import { useState, useEffect } from "react";
import { useCurrentSchool, useUpdateSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
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
import { Link } from "react-router-dom";

export default function SchoolSettings() {
  const { data: school, isLoading } = useCurrentSchool();
  const update = useUpdateSchool();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (school) setForm(school);
  }, [school]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold">Aucune école associée</h1>
        <p className="mt-2 text-muted-foreground">Créez d'abord votre établissement.</p>
        <Button asChild className="mt-6 shadow-glow">
          <Link to="/app/school-setup">Configurer mon établissement</Link>
        </Button>
      </div>
    );
  }

  if (!form) return null;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        id: school.id,
        name: form.name,
        school_type: form.school_type,
        motto: form.motto,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        country: form.country,
        currency: form.currency,
        default_language: form.default_language,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website,
        calendar_system: form.calendar_system,
        grading_system: form.grading_system,
        matricule_format: form.matricule_format,
      });
      toast.success("Paramètres enregistrés");
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    }
  };

  return (
    <div className="container max-w-3xl py-8 lg:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Paramètres de l'établissement</h1>
        <p className="mt-2 text-muted-foreground">
          Configurez l'identité, les paramètres pédagogiques et financiers de votre école.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Identité */}
        <Section title="Identité">
          <Field label="Nom de l'établissement *" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Type d'établissement">
            <select
              value={form.school_type}
              onChange={(e) => set("school_type", e.target.value as SchoolType)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {ALL_SCHOOL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SCHOOL_TYPES[t].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Devise / Slogan">
            <Input value={form.motto ?? ""} onChange={(e) => set("motto", e.target.value)} />
          </Field>
          <Field label="Année de fondation">
            <Input
              type="number"
              value={form.founded_year ?? ""}
              onChange={(e) => set("founded_year", e.target.value)}
            />
          </Field>
        </Section>

        {/* Localisation */}
        <Section title="Localisation & contact">
          <Field label="Pays">
            <select
              value={form.country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.code === e.target.value);
                set("country", e.target.value);
                if (c) set("currency", c.currency);
              }}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.currencySymbol})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Adresse">
            <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Téléphone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Site web">
            <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </Section>

        {/* Pédagogie */}
        <Section title="Paramètres pédagogiques">
          <Field label="Langue principale">
            <select
              value={form.default_language}
              onChange={(e) => set("default_language", e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="ar">🇸🇦 العربية</option>
              <option value="pt">🇵🇹 Português</option>
              <option value="es">🇪🇸 Español</option>
              <option value="sw">🇰🇪 Kiswahili</option>
            </select>
          </Field>
          <Field label="Système de calendrier">
            <select
              value={form.calendar_system}
              onChange={(e) => set("calendar_system", e.target.value as CalendarSystem)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {CALENDAR_SYSTEMS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} — {c.description}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Système de notation">
            <select
              value={form.grading_system}
              onChange={(e) => set("grading_system", e.target.value as GradingSystem)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {GRADING_SYSTEMS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label} — {g.description}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Format des matricules"
            hint="Variables : {YEAR}, {YY}, {LEVEL}, {SEQ4}, {SEQ5}, {SEQ6}"
          >
            <Input
              value={form.matricule_format ?? "{YEAR}-{LEVEL}-{SEQ4}"}
              onChange={(e) => set("matricule_format", e.target.value)}
            />
          </Field>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={update.isPending} className="gap-2 shadow-glow">
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-bold mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
