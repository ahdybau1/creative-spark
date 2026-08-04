import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { ROLE_META, ALL_ROLES } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (role: string) => {
    if (!user) return;
    setLoading(role);

    // Create demo school if user has none
    let schoolId: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.school_id) {
      schoolId = profile.school_id;
    } else {
      const { data: school, error: schoolErr } = await supabase
        .from("schools")
        .insert({
          name: "École de démonstration",
          school_type: "high_school",
          country: "FR",
          currency: "EUR",
          default_language: "fr",
        })
        .select("id")
        .single();

      if (schoolErr || !school) {
        setLoading(null);
        toast.error("Impossible de créer l'école de démo", { description: schoolErr?.message });
        return;
      }
      schoolId = school.id;
      await supabase.from("profiles").update({ school_id: schoolId }).eq("id", user.id);
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: role as any, school_id: schoolId });

    setLoading(null);
    if (error) {
      toast.error("Impossible d'ajouter ce rôle", { description: error.message });
      return;
    }
    toast.success("Rôle ajouté !");
    localStorage.setItem("edu-active-role", role);
    window.location.href = "/app";
  };

  return (
    <div className="container max-w-5xl py-10 lg:py-14">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
          Choisissez un rôle de démonstration
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Sélectionnez l'un des 18 rôles d'EduMaster Pro pour explorer le tableau de bord correspondant.
          En production, c'est l'administration de votre école qui attribue les rôles.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_ROLES.map((roleKey) => {
          const meta = ROLE_META[roleKey];
          const Icon = meta.icon;
          const already = roles.includes(roleKey);
          return (
            <button
              key={roleKey}
              onClick={() => !already && handleSelect(roleKey)}
              disabled={already || loading !== null}
              className={`group text-left rounded-2xl border bg-card p-5 transition-smooth ${
                already
                  ? "border-success/40 bg-success/5"
                  : "border-border/50 hover:border-primary/50 hover:shadow-glow hover:-translate-y-0.5"
              } ${loading === roleKey ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${meta.color}`}>
                  {loading === roleKey ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold">{meta.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{meta.description}</div>
                  {already && (
                    <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-success">
                      ✓ Déjà attribué
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Button variant="ghost" onClick={() => navigate("/app")}>Retour au tableau de bord</Button>
      </div>
    </div>
  );
}
