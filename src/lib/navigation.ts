import {
  Home, Users, GraduationCap, ClipboardList, BookOpen, Calendar, FileText,
  CreditCard, Calculator, Bus, Utensils, HeartPulse, Library, MessageSquare,
  Bell, BarChart3, Settings, Shield, Briefcase, Eye, ShieldCheck, Network,
  Building2, Wallet, FileSpreadsheet, UserPlus, ClipboardCheck, AlertCircle,
  Trophy, MapPin, Wrench, Brain, Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppRole } from "@/providers/AuthProvider";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const COMMON_BOTTOM: NavItem[] = [
  { label: "Notifications", href: "/app/notifications", icon: Bell },
  { label: "Messagerie", href: "/app/messages", icon: MessageSquare },
  { label: "Paramètres", href: "/app/settings", icon: Settings },
];

export const NAV_BY_ROLE: Record<AppRole, NavGroup[]> = {
  super_admin: [
    {
      label: "Vue d'ensemble",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Établissements", href: "/app/schools", icon: Building2 },
        { label: "Statistiques globales", href: "/app/stats", icon: BarChart3 },
      ],
    },
    {
      label: "Administration",
      items: [
        { label: "Utilisateurs & Rôles", href: "/app/users", icon: Shield },
        { label: "Sécurité & Audit", href: "/app/audit", icon: ShieldCheck },
        { label: "Intégrations", href: "/app/integrations", icon: Network },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  director: [
    {
      label: "Pilotage",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Statistiques", href: "/app/stats", icon: BarChart3 },
        { label: "Analyse IA", href: "/app/ai-insights", icon: Brain },
      ],
    },
    {
      label: "Vie scolaire",
      items: [
        { label: "Élèves", href: "/app/students", icon: GraduationCap },
        { label: "Classes", href: "/app/classes", icon: BookOpen },
        { label: "Matières", href: "/app/subjects", icon: BookOpen },
        { label: "Emplois du temps", href: "/app/timetable", icon: Calendar },
        { label: "Présences", href: "/app/attendance", icon: ClipboardCheck },
        { label: "Notes", href: "/app/grades", icon: FileText },
        { label: "Personnel", href: "/app/staff", icon: Briefcase },
        { label: "Conseil de classe", href: "/app/council", icon: ClipboardCheck },
      ],
    },
    {
      label: "Gestion",
      items: [
        { label: "Finances", href: "/app/finance", icon: Wallet },
        { label: "Communication", href: "/app/announcements", icon: Bell },
        { label: "Paramètres école", href: "/app/school-settings", icon: Settings },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  deputy_director: [
    {
      label: "Académique",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Emplois du temps", href: "/app/timetable", icon: Calendar },
        { label: "Discipline", href: "/app/discipline", icon: AlertCircle },
        { label: "Examens", href: "/app/exams", icon: FileText },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  secretary: [
    {
      label: "Inscriptions",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Nouvel élève", href: "/app/students/new", icon: UserPlus },
        { label: "Liste élèves", href: "/app/students", icon: GraduationCap },
        { label: "Documents", href: "/app/documents", icon: FileText },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  accountant: [
    {
      label: "Finance",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Caisse", href: "/app/cashbox", icon: Wallet },
        { label: "Frais & Paiements", href: "/app/fees", icon: CreditCard },
        { label: "Salaires", href: "/app/payroll", icon: Calculator },
        { label: "Comptabilité", href: "/app/accounting", icon: FileSpreadsheet },
        { label: "Budget", href: "/app/budget", icon: BarChart3 },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  teacher: [
    {
      label: "Mon enseignement",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Mes classes", href: "/app/my-classes", icon: BookOpen },
        { label: "Saisie des notes", href: "/app/grades", icon: FileText },
        { label: "Cahier de textes", href: "/app/coursebook", icon: ClipboardList },
        { label: "Pointage", href: "/app/attendance", icon: ClipboardCheck },
        { label: "Devoirs", href: "/app/homework", icon: FileText },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  main_teacher: [
    {
      label: "Ma classe principale",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Ma classe", href: "/app/my-class", icon: Users },
        { label: "Bulletins", href: "/app/reports", icon: FileText },
        { label: "Conseil de classe", href: "/app/council", icon: ClipboardCheck },
      ],
    },
    {
      label: "Enseignement",
      items: [
        { label: "Mes cours", href: "/app/my-classes", icon: BookOpen },
        { label: "Saisie des notes", href: "/app/grades", icon: FileText },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  supervisor: [
    {
      label: "Surveillance",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Pointage", href: "/app/attendance", icon: ClipboardCheck },
        { label: "Justificatifs", href: "/app/justifications", icon: FileText },
        { label: "Incidents", href: "/app/incidents", icon: AlertCircle },
        { label: "Planning surveillance", href: "/app/duty", icon: Calendar },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  librarian: [
    {
      label: "Bibliothèque",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Catalogue", href: "/app/library", icon: Library },
        { label: "Emprunts", href: "/app/loans", icon: BookOpen },
        { label: "Bibliothèque numérique", href: "/app/digital-library", icon: FileText },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  nurse: [
    {
      label: "Infirmerie",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Visites", href: "/app/visits", icon: HeartPulse },
        { label: "Suivi médical", href: "/app/medical", icon: ClipboardList },
        { label: "Stock médicaments", href: "/app/medical-stock", icon: AlertCircle },
        { label: "Urgences", href: "/app/emergencies", icon: AlertCircle },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  transport_manager: [
    {
      label: "Transport",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Bus & Circuits", href: "/app/buses", icon: Bus },
        { label: "Suivi GPS", href: "/app/gps", icon: MapPin },
        { label: "Chauffeurs", href: "/app/drivers", icon: Truck },
        { label: "Maintenance", href: "/app/maintenance", icon: Wrench },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  canteen_manager: [
    {
      label: "Cantine",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Menu de la semaine", href: "/app/menu", icon: Utensils },
        { label: "Présences", href: "/app/canteen-attendance", icon: ClipboardCheck },
        { label: "Stocks", href: "/app/canteen-stock", icon: AlertCircle },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  student: [
    {
      label: "Mon espace",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Emploi du temps", href: "/app/my-timetable", icon: Calendar },
        { label: "Mes notes", href: "/app/my-grades", icon: FileText },
        { label: "Devoirs", href: "/app/my-homework", icon: ClipboardList },
        { label: "E-learning", href: "/app/elearning", icon: BookOpen },
        { label: "Ressources", href: "/app/resources", icon: Library },
        { label: "Mes badges", href: "/app/badges", icon: Trophy },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  parent: [
    {
      label: "Mes enfants",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Mes enfants", href: "/app/children", icon: Users },
        { label: "Notes & Bulletins", href: "/app/children-grades", icon: FileText },
        { label: "Absences", href: "/app/children-absences", icon: ClipboardCheck },
        { label: "Paiements", href: "/app/payments", icon: CreditCard },
        { label: "Suivi bus", href: "/app/bus-tracking", icon: Bus },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  driver: [
    {
      label: "Mon circuit",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Mon circuit du jour", href: "/app/route", icon: MapPin },
        { label: "Mes passagers", href: "/app/passengers", icon: Users },
        { label: "Signaler incident", href: "/app/incident", icon: AlertCircle },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  hr_manager: [
    {
      label: "Ressources Humaines",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Personnel", href: "/app/staff", icon: Briefcase },
        { label: "Recrutement", href: "/app/recruitment", icon: UserPlus },
        { label: "Congés", href: "/app/leaves", icon: Calendar },
        { label: "Évaluations", href: "/app/evaluations", icon: ClipboardCheck },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  alumni_manager: [
    {
      label: "Réseau Alumni",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Anciens élèves", href: "/app/alumni", icon: Network },
        { label: "Événements", href: "/app/alumni-events", icon: Calendar },
        { label: "Offres d'emploi", href: "/app/jobs", icon: Briefcase },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],

  security_agent: [
    {
      label: "Sécurité",
      items: [
        { label: "Tableau de bord", href: "/app", icon: Home },
        { label: "Visiteurs", href: "/app/visitors", icon: Users },
        { label: "Contrôle d'accès", href: "/app/access", icon: ShieldCheck },
        { label: "Incidents", href: "/app/incidents", icon: AlertCircle },
      ],
    },
    { label: "", items: COMMON_BOTTOM },
  ],
};
