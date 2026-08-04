import { Navigate } from "react-router-dom";
import Staff from "./Staff";

// Page "Utilisateurs & Rôles" = réutilisation du module Personnel (gestion comptes + rôles).
export default function Users() {
  return <Staff />;
}
