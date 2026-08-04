import { ArrowLeft, Construction } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Placeholder() {
  const location = useLocation();
  const name = location.pathname.split("/").pop()?.replace(/-/g, " ") || "Module";

  return (
    <div className="container max-w-2xl py-16">
      <div className="rounded-3xl border border-border/50 bg-card p-10 shadow-card text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-warning/15 flex items-center justify-center mb-6">
          <Construction className="h-8 w-8 text-warning" />
        </div>
        <h1 className="font-display text-2xl font-bold capitalize">{name}</h1>
        <p className="mt-3 text-muted-foreground">
          Ce module fait partie des 24 modules d'EduMaster Pro et sera implémenté lors d'une phase ultérieure.
        </p>
        <Button variant="outline" className="mt-6 gap-2" asChild>
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </Button>
      </div>
    </div>
  );
}
