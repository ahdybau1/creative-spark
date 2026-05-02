import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool } from "@/hooks/useSchool";
import { useAuth, type AppRole } from "@/providers/AuthProvider";
import { ROLE_META, ALL_ROLES } from "@/lib/roles";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Copy, Loader2, Briefcase, ShieldOff, Trash2 } from "lucide-react";

interface StaffRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  created_at: string;
}

const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== "super_admin" && r !== "student" && r !== "parent");

export default function Staff() {
  const { activeRole } = useAuth();
  const { data: school, isLoading: schoolLoading } = useCurrentSchool();
  const qc = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState<{ email: string; password: string } | null>(null);

  const canManage = activeRole === "director" || activeRole === "hr_manager" || activeRole === "super_admin";

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", school?.id],
    enabled: !!school?.id && canManage,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_school_staff", { _school_id: school!.id });
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (payload: { email: string; full_name: string; phone?: string; role: AppRole }) => {
      const { data, error } = await supabase.functions.invoke("invite-staff", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { email: string; temp_password: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff", school?.id] });
      setInviteOpen(false);
      setCredentialsDialog({ email: data.email, password: data.temp_password });
      toast({ title: "Compte créé", description: "Identifiants générés avec succès." });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role)
        .eq("school_id", school!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", school?.id] });
      toast({ title: "Rôle retiré" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id,
        role,
        school_id: school!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", school?.id] });
      toast({ title: "Rôle ajouté" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const removeAllRolesMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("school_id", school!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", school?.id] });
      toast({ title: "Membre retiré du personnel" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (schoolLoading) {
    return <div className="p-8 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>;
  }

  if (!canManage) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>Seuls les directeurs et responsables RH peuvent gérer le personnel.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Personnel & Comptes
          </h1>
          <p className="text-muted-foreground">Invitez vos enseignants et personnel administratif et gérez leurs rôles.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste du personnel</CardTitle>
          <CardDescription>{staff?.length ?? 0} compte(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement du personnel…
            </div>
          ) : !staff || staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun membre du personnel. Cliquez sur « Nouvel utilisateur » pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <StaffRowItem
                      key={s.user_id}
                      staff={s}
                      onRemoveRole={(role) => removeRoleMutation.mutate({ user_id: s.user_id, role })}
                      onAddRole={(role) => addRoleMutation.mutate({ user_id: s.user_id, role })}
                      onRemoveAll={() => {
                        if (confirm(`Retirer ${s.full_name ?? s.email} du personnel ?\nTous ses rôles dans cette école seront supprimés.`)) {
                          removeAllRolesMutation.mutate(s.user_id);
                        }
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={(p) => inviteMutation.mutate(p)}
        loading={inviteMutation.isPending}
      />

      {/* Credentials dialog */}
      <Dialog open={!!credentialsDialog} onOpenChange={(o) => !o && setCredentialsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Identifiants générés</DialogTitle>
            <DialogDescription>
              Communiquez ces identifiants à l'utilisateur. Ce mot de passe ne sera plus affiché.
            </DialogDescription>
          </DialogHeader>
          {credentialsDialog && (
            <div className="space-y-3">
              <CopyField label="Email" value={credentialsDialog.email} />
              <CopyField label="Mot de passe temporaire" value={credentialsDialog.password} />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentialsDialog(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input readOnly value={value} className="font-mono" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast({ title: "Copié" });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StaffRowItem({
  staff,
  onRemoveRole,
  onAddRole,
}: {
  staff: StaffRow;
  onRemoveRole: (r: AppRole) => void;
  onAddRole: (r: AppRole) => void;
}) {
  const initials = (staff.full_name ?? staff.email ?? "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const availableRoles = ASSIGNABLE_ROLES.filter((r) => !staff.roles.includes(r));

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={staff.avatar_url ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{staff.full_name ?? "—"}</div>
            {staff.phone && <div className="text-xs text-muted-foreground">{staff.phone}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{staff.email ?? "—"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {staff.roles.length === 0 && <span className="text-xs text-muted-foreground">Aucun rôle</span>}
          {staff.roles.map((r) => {
            const meta = ROLE_META[r];
            return (
              <Badge key={r} variant="secondary" className="gap-1">
                <meta.icon className={`h-3 w-3 ${meta.color}`} />
                {meta.shortLabel}
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={() => onRemoveRole(r)}
                  title="Retirer ce rôle"
                >
                  <ShieldOff className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {availableRoles.length > 0 && (
          <Select onValueChange={(v) => onAddRole(v as AppRole)}>
            <SelectTrigger className="w-[180px] inline-flex">
              <SelectValue placeholder="+ Ajouter un rôle" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => {
                const meta = ROLE_META[r];
                return (
                  <SelectItem key={r} value={r}>
                    {meta.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </TableCell>
    </TableRow>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (p: { email: string; full_name: string; phone?: string; role: AppRole }) => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("teacher");

  const reset = () => { setEmail(""); setFullName(""); setPhone(""); setRole("teacher"); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    onSubmit({ email: email.trim(), full_name: fullName.trim(), phone: phone.trim() || undefined, role });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un compte personnel</DialogTitle>
          <DialogDescription>
            Un mot de passe temporaire sera généré. Vous pourrez le copier puis le transmettre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Rôle initial *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => {
                  const meta = ROLE_META[r];
                  return <SelectItem key={r} value={r}>{meta.label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={loading || !email || !fullName}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
