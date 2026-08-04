import { Network, Mail, MessageSquare, CreditCard, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { icon: Brain, name: "Lovable AI", desc: "Modèles IA intégrés (Gemini, GPT) pour analyses et assistance.", status: "active" },
  { icon: Mail, name: "Email transactionnel", desc: "Envoi automatisé via le backend. Configurable par établissement.", status: "available" },
  { icon: MessageSquare, name: "SMS / WhatsApp", desc: "Notifications parents par SMS ou WhatsApp.", status: "soon" },
  { icon: CreditCard, name: "Mobile Money", desc: "Orange Money, MTN, Wave pour paiements scolaires.", status: "soon" },
];

export default function Integrations() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><Network className="h-7 w-7 text-primary" />Intégrations</h1>
      <p className="text-muted-foreground mb-6">Connectez votre école aux services externes.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {integrations.map((i) => (
          <div key={i.name} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <i.icon className="h-5 w-5 text-primary" />
              <Badge variant={i.status === "active" ? "default" : i.status === "available" ? "secondary" : "outline"}>
                {i.status === "active" ? "Activé" : i.status === "available" ? "Disponible" : "Bientôt"}
              </Badge>
            </div>
            <div className="mt-3 font-semibold">{i.name}</div>
            <div className="text-sm text-muted-foreground mt-1">{i.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
