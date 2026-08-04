import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { isPathAllowed } from "@/lib/role-routes";
import { ShieldAlert } from "lucide-react";

/**
 * Garde une route en fonction du rôle actif.
 * - Si la route n'est pas autorisée → écran "accès refusé"
 * - super_admin a accès partout.
 */
export function RoleGuard({ children }: { children: ReactNode }) {
  const { activeRole } = useAuth();
  const location = useLocation();

  if (!activeRole) return <Navigate to="/auth" replace />;

  if (!isPathAllowed(location.pathname, activeRole)) {
    return (
      <div className="container max-w-xl py-20 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Accès non autorisé</h1>
        <p className="text-muted-foreground">
          Votre profil ne dispose pas des droits pour accéder à ce module.
          Changez de rôle (en haut du menu) si vous en avez plusieurs.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
