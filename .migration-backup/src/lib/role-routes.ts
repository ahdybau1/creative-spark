import { NAV_BY_ROLE } from "@/lib/navigation";
import type { AppRole } from "@/providers/AuthProvider";

// Routes communes accessibles à TOUS les profils connectés (profil, hors-nav)
const ALWAYS_ALLOWED = new Set<string>([
  "/app",
  "/app/profile",
  "/app/onboarding",
  "/app/school-setup",
]);

/**
 * Retourne l'ensemble des préfixes de routes autorisés pour un rôle donné,
 * en se basant sur sa navigation déclarée dans NAV_BY_ROLE.
 */
export function allowedRoutesForRole(role: AppRole | null): Set<string> {
  const set = new Set<string>(ALWAYS_ALLOWED);
  if (!role) return set;
  const groups = NAV_BY_ROLE[role] ?? [];
  groups.forEach((g) => g.items.forEach((it) => set.add(it.href)));
  return set;
}

/**
 * Vérifie si une URL pathname est autorisée pour le rôle.
 * Match par préfixe le plus long (ex: /app/students/123 → /app/students).
 */
export function isPathAllowed(pathname: string, role: AppRole | null): boolean {
  if (role === "super_admin") return true; // super_admin = accès total
  const allowed = allowedRoutesForRole(role);
  // exact + préfixe
  if (allowed.has(pathname)) return true;
  for (const p of allowed) {
    if (p !== "/app" && pathname.startsWith(p + "/")) return true;
  }
  return pathname === "/app";
}
