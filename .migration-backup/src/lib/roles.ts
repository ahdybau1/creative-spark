import { AppRole } from "@/providers/AuthProvider";
import {
  Shield, Crown, UserCog, ClipboardList, Calculator, GraduationCap,
  BookOpen, Eye, Library, HeartPulse, Bus, Utensils, User, Users,
  Car, Briefcase, Network, ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RoleMeta {
  key: AppRole;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  color: string; // tailwind text color
}

export const ROLE_META: Record<AppRole, RoleMeta> = {
  super_admin: {
    key: "super_admin",
    label: "Super Administrateur",
    shortLabel: "Super Admin",
    description: "Accès total, gestion multi-établissements",
    icon: Crown,
    color: "text-amber-500",
  },
  director: {
    key: "director",
    label: "Directeur / Proviseur",
    shortLabel: "Directeur",
    description: "Pilotage pédagogique et administratif",
    icon: Shield,
    color: "text-primary",
  },
  deputy_director: {
    key: "deputy_director",
    label: "Sous-Directeur / Censeur",
    shortLabel: "Sous-Directeur",
    description: "Gestion académique et discipline",
    icon: UserCog,
    color: "text-info",
  },
  secretary: {
    key: "secretary",
    label: "Secrétaire Principal(e)",
    shortLabel: "Secrétaire",
    description: "Inscriptions, courrier, dossiers",
    icon: ClipboardList,
    color: "text-violet-500",
  },
  accountant: {
    key: "accountant",
    label: "Comptable / Économe",
    shortLabel: "Comptable",
    description: "Finances, frais, salaires, caisse",
    icon: Calculator,
    color: "text-success",
  },
  teacher: {
    key: "teacher",
    label: "Enseignant / Professeur",
    shortLabel: "Enseignant",
    description: "Notes, présences, cahier de textes",
    icon: GraduationCap,
    color: "text-blue-500",
  },
  main_teacher: {
    key: "main_teacher",
    label: "Professeur Principal",
    shortLabel: "Prof. Principal",
    description: "Sa classe + conseil de classe",
    icon: BookOpen,
    color: "text-indigo-500",
  },
  supervisor: {
    key: "supervisor",
    label: "Surveillant / Éducateur",
    shortLabel: "Surveillant",
    description: "Présences, discipline, incidents",
    icon: Eye,
    color: "text-orange-500",
  },
  librarian: {
    key: "librarian",
    label: "Bibliothécaire",
    shortLabel: "Bibliothécaire",
    description: "Bibliothèque physique et numérique",
    icon: Library,
    color: "text-rose-500",
  },
  nurse: {
    key: "nurse",
    label: "Médecin / Infirmier(ère)",
    shortLabel: "Infirmier",
    description: "Module santé et infirmerie",
    icon: HeartPulse,
    color: "text-destructive",
  },
  transport_manager: {
    key: "transport_manager",
    label: "Responsable Transport",
    shortLabel: "Resp. Transport",
    description: "Bus, circuits, chauffeurs",
    icon: Bus,
    color: "text-yellow-500",
  },
  canteen_manager: {
    key: "canteen_manager",
    label: "Responsable Cantine",
    shortLabel: "Resp. Cantine",
    description: "Menus, présences, stocks",
    icon: Utensils,
    color: "text-emerald-500",
  },
  student: {
    key: "student",
    label: "Élève / Étudiant(e)",
    shortLabel: "Élève",
    description: "Notes, devoirs, e-learning",
    icon: User,
    color: "text-cyan-500",
  },
  parent: {
    key: "parent",
    label: "Parent / Tuteur",
    shortLabel: "Parent",
    description: "Suivi de l'enfant, paiements",
    icon: Users,
    color: "text-teal-500",
  },
  driver: {
    key: "driver",
    label: "Chauffeur",
    shortLabel: "Chauffeur",
    description: "Circuit et passagers du jour",
    icon: Car,
    color: "text-stone-500",
  },
  hr_manager: {
    key: "hr_manager",
    label: "Responsable RH",
    shortLabel: "Resp. RH",
    description: "Personnel, contrats, congés",
    icon: Briefcase,
    color: "text-fuchsia-500",
  },
  alumni_manager: {
    key: "alumni_manager",
    label: "Responsable Alumni",
    shortLabel: "Alumni",
    description: "Anciens élèves, réseau",
    icon: Network,
    color: "text-pink-500",
  },
  security_agent: {
    key: "security_agent",
    label: "Agent de Sécurité",
    shortLabel: "Sécurité",
    description: "Accès campus, visiteurs",
    icon: ShieldCheck,
    color: "text-slate-500",
  },
};

export const ALL_ROLES: AppRole[] = Object.keys(ROLE_META) as AppRole[];
