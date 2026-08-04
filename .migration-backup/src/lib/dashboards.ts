import {
  Users, GraduationCap, Wallet, Bell, AlertCircle, BookOpen, Calendar,
  ClipboardCheck, FileText, Building2, Brain, Trophy, HeartPulse, Bus,
  MapPin, Library, Briefcase, ShieldCheck, MessageSquare, CreditCard,
  BarChart3, Utensils, UserPlus, Network, Eye, Calculator, ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppRole } from "@/providers/AuthProvider";

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: string;
}

interface Widget {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  span?: 1 | 2;
}

interface DashboardConfig {
  subtitle: string;
  stats: Stat[];
  widgets: Widget[];
}

const ICON_BG = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
  info: "bg-info/10",
  accent: "bg-accent/10",
};
const ICON_COLOR = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
  accent: "text-accent",
};

export const DASHBOARD_CONFIGS: Record<AppRole, DashboardConfig> = {
  super_admin: {
    subtitle: "Vue consolidée de tous les établissements gérés.",
    stats: [
      { label: "Établissements", value: "12", icon: Building2, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, trend: "+2" },
      { label: "Utilisateurs totaux", value: "8 247", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, trend: "+124" },
      { label: "Revenus du mois", value: "€ 184k", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, trend: "+12%" },
      { label: "Alertes critiques", value: "3", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
    ],
    widgets: [
      { title: "Carte des établissements", description: "Localisation géographique et performance par école.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Comparatif établissements", description: "Performance académique et financière comparée.", icon: BarChart3, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { title: "Santé du système", description: "État des serveurs, latence, disponibilité.", icon: ShieldCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { title: "Connexions suspectes", description: "Tentatives d'intrusion détectées.", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive, span: 2 },
    ],
  },

  director: {
    subtitle: "Pilotage de votre établissement aujourd'hui.",
    stats: [
      { label: "Élèves présents", value: "847 / 892", icon: GraduationCap, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, trend: "95%" },
      { label: "Taux paiement", value: "78%", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, trend: "+3%" },
      { label: "Moyenne école", value: "13.4/20", icon: Trophy, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, trend: "+0.4" },
      { label: "Alertes prioritaires", value: "5", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Évolution des effectifs", description: "Graphique mensuel des inscriptions et départs.", icon: BarChart3, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Enseignants absents", description: "Liste du jour avec remplaçants proposés.", icon: Briefcase, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { title: "Élèves en difficulté (IA)", description: "5 élèves identifiés à risque ce trimestre.", icon: Brain, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent, span: 2 },
      { title: "Calendrier 7 jours", description: "Examens, réunions, événements à venir.", icon: Calendar, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  deputy_director: {
    subtitle: "Gestion académique et discipline du jour.",
    stats: [
      { label: "Cours du jour", value: "42", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Incidents ouverts", value: "3", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Examens cette semaine", value: "8", icon: FileText, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Conflits emploi du temps", value: "0", icon: Calendar, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Emplois du temps", description: "Vue par classe / professeur / salle.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Sanctions en attente", description: "Décisions disciplinaires à valider.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  secretary: {
    subtitle: "Inscriptions, courrier et dossiers à traiter.",
    stats: [
      { label: "Inscriptions à valider", value: "12", icon: UserPlus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Documents en attente", value: "27", icon: FileText, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Courrier reçu", value: "8", icon: MessageSquare, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Réinscriptions OK", value: "342", icon: ClipboardCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Demandes d'inscription en ligne", description: "Nouvelles candidatures à examiner.", icon: UserPlus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Documents urgents", description: "Certificats, attestations à éditer.", icon: FileText, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  accountant: {
    subtitle: "État financier en temps réel.",
    stats: [
      { label: "Recettes du jour", value: "€ 4 280", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, trend: "+15%" },
      { label: "Impayés", value: "€ 18 450", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Solde caisse", value: "€ 28 740", icon: Calculator, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Salaires à payer", value: "€ 42 000", icon: Briefcase, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Recettes du mois", description: "Graphique en temps réel des encaissements.", icon: BarChart3, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, span: 2 },
      { title: "Top impayés", description: "10 plus gros soldes en attente.", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
    ],
  },

  teacher: {
    subtitle: "Vos cours et tâches du jour.",
    stats: [
      { label: "Cours aujourd'hui", value: "4", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Notes à saisir", value: "23", icon: FileText, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Devoirs à corriger", value: "47", icon: ClipboardList, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Messages parents", value: "6", icon: MessageSquare, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Mon emploi du temps", description: "Cours du jour et de la semaine.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Cahier de textes à remplir", description: "Rappel des séances non saisies.", icon: ClipboardList, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  main_teacher: {
    subtitle: "Suivi de votre classe principale.",
    stats: [
      { label: "Élèves de ma classe", value: "32", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Moyenne classe", value: "12.8/20", icon: Trophy, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Absents aujourd'hui", value: "3", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Bulletins prêts", value: "28 / 32", icon: FileText, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Conseil de classe à venir", description: "Préparation des décisions.", icon: ClipboardCheck, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Élèves en difficulté", description: "Identifiés par l'IA pédagogique.", icon: Brain, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
  },

  supervisor: {
    subtitle: "Surveillance et discipline du jour.",
    stats: [
      { label: "Absents non justifiés", value: "12", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Retards du jour", value: "8", icon: ClipboardCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents ouverts", value: "2", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Visiteurs présents", value: "4", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
    ],
    widgets: [
      { title: "Pointages en cours", description: "Liste des absents et retards à traiter.", icon: ClipboardCheck, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Planning surveillance", description: "Couloirs, cour, examens.", icon: Eye, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  librarian: {
    subtitle: "Activité de la bibliothèque.",
    stats: [
      { label: "Livres au catalogue", value: "4 287", icon: Library, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Emprunts du jour", value: "47", icon: BookOpen, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Retards", value: "12", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Amendes en cours", value: "€ 84", icon: Wallet, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
    ],
    widgets: [
      { title: "Livres les plus empruntés", description: "Top du mois.", icon: Trophy, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Retours en attente", description: "Liste à relancer.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  nurse: {
    subtitle: "Suivi médical et urgences.",
    stats: [
      { label: "Visites aujourd'hui", value: "7", icon: HeartPulse, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Vaccinations à jour", value: "94%", icon: ClipboardCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Médicaments en stock", value: "127", icon: AlertCircle, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Élèves à surveiller", value: "5", icon: Users, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Visites du jour", description: "Registre détaillé.", icon: HeartPulse, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive, span: 2 },
      { title: "Maladies chroniques", description: "Élèves avec suivi régulier.", icon: ClipboardList, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  transport_manager: {
    subtitle: "Bus, circuits et chauffeurs.",
    stats: [
      { label: "Bus en service", value: "12", icon: Bus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Élèves abonnés", value: "284", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents jour", value: "0", icon: AlertCircle, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Maintenance due", value: "2", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Suivi GPS en direct", description: "Position de tous les bus en temps réel.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Maintenance à prévoir", description: "Révisions, contrôles techniques.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  canteen_manager: {
    subtitle: "Cantine et restauration.",
    stats: [
      { label: "Repas servis aujourd'hui", value: "412", icon: Utensils, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Abonnés actifs", value: "534", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Stock critique", value: "3 produits", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Coût moyen / repas", value: "€ 3.20", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Menu de la semaine", description: "Planification des repas.", icon: Utensils, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Allergies à respecter", description: "Liste des élèves concernés.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
  },

  student: {
    subtitle: "Votre journée d'aujourd'hui.",
    stats: [
      { label: "Cours du jour", value: "5", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Devoirs à rendre", value: "3", icon: ClipboardList, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Ma moyenne", value: "14.2/20", icon: Trophy, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Mes badges", value: "12", icon: Trophy, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Mon emploi du temps", description: "Cours et salles d'aujourd'hui.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Mes dernières notes", description: "Évolution par matière.", icon: FileText, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  parent: {
    subtitle: "Suivi de vos enfants.",
    stats: [
      { label: "Mes enfants", value: "2", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Solde à payer", value: "€ 320", icon: CreditCard, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Absences semaine", value: "1", icon: AlertCircle, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Bulletins reçus", value: "2", icon: FileText, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Mes enfants", description: "Vue rapide de chaque enfant.", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Bus en approche", description: "Suivi GPS du bus scolaire.", icon: Bus, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  driver: {
    subtitle: "Votre circuit du jour.",
    stats: [
      { label: "Passagers prévus", value: "32", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Arrêts du circuit", value: "8", icon: MapPin, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Distance totale", value: "42 km", icon: Bus, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Heure de départ", value: "06:30", icon: Calendar, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Mon circuit", description: "Itinéraire et arrêts du jour.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Liste passagers", description: "Élèves à prendre en charge.", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  hr_manager: {
    subtitle: "Gestion du personnel.",
    stats: [
      { label: "Effectif total", value: "87", icon: Briefcase, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Demandes congés", value: "5", icon: Calendar, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Contrats à expirer", value: "3", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Candidatures", value: "14", icon: UserPlus, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
    widgets: [
      { title: "Demandes en attente", description: "Congés et permissions à valider.", icon: Calendar, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, span: 2 },
      { title: "Évaluations annuelles", description: "Calendrier des entretiens.", icon: ClipboardCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },

  alumni_manager: {
    subtitle: "Réseau des anciens élèves.",
    stats: [
      { label: "Alumni inscrits", value: "1 247", icon: Network, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Événements à venir", value: "2", icon: Calendar, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Offres d'emploi", value: "18", icon: Briefcase, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Mentors actifs", value: "42", icon: Users, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Annuaire alumni", description: "Anciens élèves par promotion.", icon: Network, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Offres d'emploi", description: "Postes proposés par les alumni.", icon: Briefcase, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
  },

  security_agent: {
    subtitle: "Contrôle d'accès et sécurité.",
    stats: [
      { label: "Visiteurs présents", value: "6", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Entrées du jour", value: "284", icon: ShieldCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents ouverts", value: "0", icon: AlertCircle, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Alertes système", value: "1", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Visiteurs en cours", description: "Personnes actuellement dans l'enceinte.", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2 },
      { title: "Caméras / accès", description: "État des points d'accès.", icon: ShieldCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
  },
};
