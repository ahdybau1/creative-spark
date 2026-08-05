import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentSchool } from "@/hooks/useSchool";
import { ROLE_META } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Phone, Mail, Shield, Camera, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, roles } = useAuth();
  const { data: school } = useCurrentSchool();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");

  const profileQ = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, school_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<{ full_name: string; phone: string }>({
    full_name: "",
    phone: "",
  });

  // Sync form when profile loads
  const profile = profileQ.data;
  const displayName = form.full_name || profile?.full_name || "";
  const displayPhone = form.phone || profile?.phone || "";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name || profile?.full_name || "",
          phone: form.phone || profile?.phone || "",
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profil mis à jour !");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setForm({ full_name: "", phone: "" });
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);
      if (updateErr) throw updateErr;
      toast.success("Photo de profil mise à jour !");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erreur upload photo.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError("");
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    if (pwdForm.next.length < 8) { setPwdError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwdForm.next });
      if (error) throw error;
      toast.success("Mot de passe mis à jour !");
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message ?? "Erreur changement de mot de passe.");
    } finally {
      setChangingPwd(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "—";

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Avatar + basic info */}
      <Card className="border-border/50 shadow-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Informations personnelles</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-smooth"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.full_name ?? user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.map((r) => {
                  const meta = ROLE_META[r];
                  return (
                    <Badge key={r} variant="outline" className="text-xs gap-1">
                      {meta?.label ?? r}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Form fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input
                placeholder={profile?.full_name ?? "Votre nom"}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                placeholder={profile?.phone ?? "+33 6 …"}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse e-mail</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>École</Label>
              <Input value={school?.name ?? "—"} disabled className="opacity-60" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || (!form.full_name && !form.phone)} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles */}
      <Card className="border-border/50 shadow-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Mes rôles</CardTitle></CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun rôle attribué.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta?.icon;
                return (
                  <div key={r} className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 bg-muted/30">
                    {Icon && <Icon className={`h-4 w-4 ${meta.color}`} />}
                    <span className="text-sm font-medium">{meta?.label ?? r}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border/50 shadow-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Changer de mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                placeholder="Minimum 8 caractères"
                value={pwdForm.next}
                onChange={(e) => setPwdForm((f) => ({ ...f, next: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Confirmer le mot de passe</Label>
              <Input
                type="password"
                placeholder="Répétez le mot de passe"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </div>
          </div>
          {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handlePasswordChange}
              disabled={changingPwd || !pwdForm.next || !pwdForm.confirm}
              className="gap-2"
            >
              {changingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Mettre à jour le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
