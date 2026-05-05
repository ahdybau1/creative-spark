import { useAuth } from "@/providers/AuthProvider";
import { ShieldCheck, Lock, KeyRound, FileCheck2 } from "lucide-react";

export default function Audit() {
  const { user } = useAuth();
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" />Sécurité & Audit</h1>
      <p className="text-muted-foreground mb-6">Suivi de l'accès et de la conformité de votre établissement.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card icon={Lock} title="Authentification" desc="Connexion par email/mot de passe avec session sécurisée. Réinitialisation possible." />
        <Card icon={KeyRound} title="Rôles & permissions" desc="Accès cloisonné par rôle (RLS). Les directeurs gèrent l'attribution des rôles." />
        <Card icon={ShieldCheck} title="Données" desc="Stockées de façon chiffrée. Chaque école est isolée." />
        <Card icon={FileCheck2} title="Journal" desc="Les actions sensibles sont horodatées (création comptes, modifications notes/paiements)." />
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5">
        <div className="text-sm font-semibold mb-2">Votre session</div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Utilisateur : <span className="font-mono">{user?.email}</span></div>
          <div>ID : <span className="font-mono">{user?.id}</span></div>
          <div>Dernière connexion : {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, desc }: any) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
