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

export type WidgetType =
  | "timetable-teacher"
  | "timetable-student"
  | "grades-recent"
  | "enrollment-chart"
  | "finance-chart"
  | "notifications"
  | "absences-today"
  | "children-overview"
  | "assessments-pending";

interface Widget {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  span?: 1 | 2;
  link?: string;
  type?: WidgetType;
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
      { title: "Carte des établissements", description: "Localisation géographique et performance par école.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType },
      { title: "Comparatif établissements", description: "Performance académique et financière comparée.", icon: BarChart3, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "notifications" as WidgetType },
      { title: "Santé du système", description: "État des serveurs, latence, disponibilité.", icon: ShieldCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, type: "notifications" as WidgetType },
      { title: "Connexions suspectes", description: "Tentatives d'intrusion détectées.", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive, span: 2, type: "notifications" as WidgetType },
    ],
  },

  director: {
    subtitle: "Pilotage de votre établissement aujourd'hui.",
    stats: [
      { label: "Élèves présents", value: "— / —", icon: GraduationCap, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Taux paiement", value: "—", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Moyenne école", value: "— / 20", icon: Trophy, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Notifications", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Évolution des effectifs", description: "Inscriptions par mois.", icon: BarChart3, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "enrollment-chart" as WidgetType, link: "/app/students" },
      { title: "Absences du jour", description: "Élèves absents ou en retard aujourd'hui.", icon: Briefcase, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "absences-today" as WidgetType, link: "/app/attendance" },
      { title: "Notifications récentes", description: "Alertes et messages non lus.", icon: Bell, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Évaluations en cours", description: "Évaluations récentes à saisir.", icon: Calendar, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "assessments-pending" as WidgetType, link: "/app/grades" },
    ],
  },

  deputy_director: {
    subtitle: "Gestion académique et discipline du jour.",
    stats: [
      { label: "Cours du jour", value: "—", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Incidents ouverts", value: "—", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Examens cette semaine", value: "—", icon: FileText, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Notifications", value: "—", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Absences du jour", description: "Élèves absents ou en retard.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "absences-today" as WidgetType, link: "/app/attendance" },
      { title: "Notifications récentes", description: "Alertes et messages.", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  secretary: {
    subtitle: "Inscriptions, courrier et dossiers à traiter.",
    stats: [
      { label: "Inscriptions à valider", value: "—", icon: UserPlus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Documents en attente", value: "—", icon: FileText, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Courrier reçu", value: "—", icon: MessageSquare, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Réinscriptions OK", value: "—", icon: ClipboardCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Effectifs de l'école", description: "Évolution mensuelle des inscriptions.", icon: UserPlus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "enrollment-chart" as WidgetType, link: "/app/students" },
      { title: "Notifications récentes", description: "Messages et alertes non lus.", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  accountant: {
    subtitle: "État financier en temps réel.",
    stats: [
      { label: "Recettes du jour", value: "—", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Impayés", value: "—", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Solde caisse", value: "—", icon: Calculator, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Salaires à payer", value: "—", icon: Briefcase, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Encaissements — 30 derniers jours", description: "Graphique des paiements reçus.", icon: BarChart3, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, span: 2, type: "finance-chart" as WidgetType, link: "/app/finance" },
      { title: "Notifications récentes", description: "Alertes financières et messages.", icon: Bell, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  teacher: {
    subtitle: "Vos cours et tâches du jour.",
    stats: [
      { label: "Cours aujourd'hui", value: "—", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Notes à saisir", value: "—", icon: FileText, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Devoirs à corriger", value: "—", icon: ClipboardList, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Messages parents", value: "—", icon: MessageSquare, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Mon emploi du temps aujourd'hui", description: "Cours du jour.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "timetable-teacher" as WidgetType, link: "/app/timetable" },
      { title: "Mes évaluations récentes", description: "Notes à saisir.", icon: ClipboardList, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "assessments-pending" as WidgetType, link: "/app/grades" },
    ],
  },

  main_teacher: {
    subtitle: "Suivi de votre classe principale.",
    stats: [
      { label: "Élèves de ma classe", value: "—", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Moyenne classe", value: "—", icon: Trophy, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Absents aujourd'hui", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Bulletins prêts", value: "—", icon: FileText, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Mon emploi du temps aujourd'hui", description: "Cours du jour et de la semaine.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "timetable-teacher" as WidgetType, link: "/app/timetable" },
      { title: "Mes évaluations récentes", description: "Notes à saisir.", icon: Brain, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent, type: "assessments-pending" as WidgetType, link: "/app/grades" },
    ],
  },

  supervisor: {
    subtitle: "Surveillance et discipline du jour.",
    stats: [
      { label: "Absents non justifiés", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Retards du jour", value: "—", icon: ClipboardCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents ouverts", value: "—", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Visiteurs présents", value: "—", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
    ],
    widgets: [
      { title: "Absences et retards du jour", description: "Liste en temps réel.", icon: ClipboardCheck, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "absences-today" as WidgetType, link: "/app/attendance" },
      { title: "Notifications récentes", description: "Alertes de discipline.", icon: Eye, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  librarian: {
    subtitle: "Activité de la bibliothèque.",
    stats: [
      { label: "Livres au catalogue", value: "—", icon: Library, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Emprunts du jour", value: "—", icon: BookOpen, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Retards", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Amendes en cours", value: "—", icon: Wallet, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Rappels et alertes.", icon: Trophy, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Effectifs élèves", description: "Évolution du nombre d'élèves.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "enrollment-chart" as WidgetType },
    ],
  },

  nurse: {
    subtitle: "Suivi médical et urgences.",
    stats: [
      { label: "Visites aujourd'hui", value: "—", icon: HeartPulse, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Vaccinations à jour", value: "—", icon: ClipboardCheck, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Médicaments en stock", value: "—", icon: AlertCircle, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Élèves à surveiller", value: "—", icon: Users, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Alertes médicales et messages.", icon: HeartPulse, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Effectifs élèves", description: "Données de santé globales.", icon: ClipboardList, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "enrollment-chart" as WidgetType },
    ],
  },

  transport_manager: {
    subtitle: "Bus, circuits et chauffeurs.",
    stats: [
      { label: "Bus en service", value: "—", icon: Bus, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Élèves abonnés", value: "—", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents jour", value: "—", icon: AlertCircle, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Maintenance due", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Alertes transport et retards.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Effectifs abonnés", description: "Évolution des abonnements.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "enrollment-chart" as WidgetType },
    ],
  },

  canteen_manager: {
    subtitle: "Cantine et restauration.",
    stats: [
      { label: "Repas servis aujourd'hui", value: "—", icon: Utensils, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Abonnés actifs", value: "—", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Stock critique", value: "—", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Recettes du jour", value: "—", icon: Wallet, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Encaissements cantine", description: "Paiements des 30 derniers jours.", icon: Utensils, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "finance-chart" as WidgetType, link: "/app/finance" },
      { title: "Notifications récentes", description: "Alertes stock et messages.", icon: AlertCircle, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  student: {
    subtitle: "Votre journée d'aujourd'hui.",
    stats: [
      { label: "Cours du jour", value: "—", icon: BookOpen, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Devoirs à rendre", value: "—", icon: ClipboardList, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Ma moyenne", value: "—", icon: Trophy, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Notifications", value: "—", icon: Bell, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Mon emploi du temps aujourd'hui", description: "Cours et salles d'aujourd'hui.", icon: Calendar, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "timetable-student" as WidgetType, link: "/app/my-timetable" },
      { title: "Mes dernières notes", description: "Évolution par matière.", icon: FileText, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "grades-recent" as WidgetType, link: "/app/my-grades" },
    ],
  },

  parent: {
    subtitle: "Suivi de vos enfants.",
    stats: [
      { label: "Mes enfants", value: "—", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Solde à payer", value: "—", icon: CreditCard, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Absences semaine", value: "—", icon: AlertCircle, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Notifications", value: "—", icon: Bell, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
    ],
    widgets: [
      { title: "Mes enfants", description: "Vue rapide de chaque enfant.", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "children-overview" as WidgetType, link: "/app/children" },
      { title: "Notifications récentes", description: "Messages de l'école.", icon: Bus, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "notifications" as WidgetType, link: "/app/notifications" },
    ],
  },

  driver: {
    subtitle: "Votre circuit du jour.",
    stats: [
      { label: "Passagers prévus", value: "—", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Arrêts du circuit", value: "—", icon: MapPin, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Distance totale", value: "—", icon: Bus, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Notifications", value: "—", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Instructions et alertes du jour.", icon: MapPin, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType },
      { title: "Effectifs élèves", description: "Passagers inscrits.", icon: Users, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "enrollment-chart" as WidgetType },
    ],
  },

  hr_manager: {
    subtitle: "Gestion du personnel.",
    stats: [
      { label: "Effectif total", value: "—", icon: Briefcase, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Demandes congés", value: "—", icon: Calendar, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
      { label: "Contrats à expirer", value: "—", icon: AlertCircle, iconBg: ICON_BG.destructive, iconColor: ICON_COLOR.destructive },
      { label: "Candidatures", value: "—", icon: UserPlus, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Demandes et alertes RH.", icon: Calendar, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Évolution des effectifs", description: "Inscriptions par mois.", icon: ClipboardCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "enrollment-chart" as WidgetType },
    ],
  },

  alumni_manager: {
    subtitle: "Réseau des anciens élèves.",
    stats: [
      { label: "Alumni inscrits", value: "—", icon: Network, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Événements à venir", value: "—", icon: Calendar, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Offres d'emploi", value: "—", icon: Briefcase, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Mentors actifs", value: "—", icon: Users, iconBg: ICON_BG.accent, iconColor: ICON_COLOR.accent },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Messages et événements alumni.", icon: Network, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Évolution des effectifs", description: "Anciennes promotions.", icon: Briefcase, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success, type: "enrollment-chart" as WidgetType },
    ],
  },

  security_agent: {
    subtitle: "Contrôle d'accès et sécurité.",
    stats: [
      { label: "Visiteurs présents", value: "—", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary },
      { label: "Entrées du jour", value: "—", icon: ShieldCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info },
      { label: "Incidents ouverts", value: "—", icon: AlertCircle, iconBg: ICON_BG.success, iconColor: ICON_COLOR.success },
      { label: "Alertes système", value: "—", icon: Bell, iconBg: ICON_BG.warning, iconColor: ICON_COLOR.warning },
    ],
    widgets: [
      { title: "Notifications récentes", description: "Alertes de sécurité.", icon: Users, iconBg: ICON_BG.primary, iconColor: ICON_COLOR.primary, span: 2, type: "notifications" as WidgetType, link: "/app/notifications" },
      { title: "Absences du jour", description: "Pointage de présence.", icon: ShieldCheck, iconBg: ICON_BG.info, iconColor: ICON_COLOR.info, type: "absences-today" as WidgetType, link: "/app/attendance" },
    ],
  },
};
