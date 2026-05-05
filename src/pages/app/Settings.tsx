import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(null);

  const q = useQuery({
    queryKey: ["prefs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_preferences").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);

  if (q.isLoading || !form) return <Loader2 className="mx-auto h-6 w-6 animate-spin mt-20" />;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    const { error } = await supabase.from("user_preferences").update({
      theme_mode: form.theme_mode,
      language: form.language,
      use_school_palette: form.use_school_palette,
      custom_primary_color: form.custom_primary_color,
      custom_accent_color: form.custom_accent_color,
    }).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Préférences enregistrées");
    qc.invalidateQueries({ queryKey: ["prefs"] });
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><SettingsIcon className="h-7 w-7 text-primary" />Paramètres</h1>
      <p className="text-muted-foreground mb-6">Personnalisez votre expérience.</p>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label>Thème</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            value={form.theme_mode} onChange={(e) => set("theme_mode", e.target.value)}>
            <option value="system">Automatique (système)</option>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Langue</Label>
          <select className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            value={form.language} onChange={(e) => set("language", e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.use_school_palette}
            onChange={(e) => set("use_school_palette", e.target.checked)} />
          Utiliser la palette de l'école
        </label>
        <div className="flex justify-end">
          <Button onClick={save} className="gap-2"><Save className="h-4 w-4" />Enregistrer</Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <h2 className="font-semibold mb-2">Établissement</h2>
        <p className="text-sm text-muted-foreground mb-3">Configuration globale (logo, couleurs, calendrier, notation).</p>
        <Button asChild variant="outline"><Link to="/app/school">Ouvrir les paramètres de l'école</Link></Button>
      </div>
    </div>
  );
}
