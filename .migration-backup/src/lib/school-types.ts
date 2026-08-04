import {
  Baby,
  BookOpen,
  GraduationCap,
  Library,
  University,
  Wrench,
  Car,
  Music,
  type LucideIcon,
} from "lucide-react";

export type SchoolType =
  | "preschool"
  | "primary"
  | "middle_school"
  | "high_school"
  | "university"
  | "vocational"
  | "driving_school"
  | "arts_sports_school";

export type CalendarSystem = "trimester" | "semester" | "sequence_6" | "quarter";
export type GradingSystem =
  | "out_of_20"
  | "out_of_100"
  | "out_of_10"
  | "letter"
  | "gpa_4"
  | "competency";

export interface SchoolTypeMeta {
  key: SchoolType;
  label: string;
  shortLabel: string;
  description: string;
  ageRange: string;
  icon: LucideIcon;
  color: string;
  // Niveaux pré-remplis (créés à l'activation du type)
  defaultLevels: { name: string; short_code: string; cycle?: string; order_index: number }[];
  // Modules désactivés pour ce type
  disabledModules: string[];
  // Système recommandé
  recommendedCalendar: CalendarSystem;
  recommendedGrading: GradingSystem;
}

export const SCHOOL_TYPES: Record<SchoolType, SchoolTypeMeta> = {
  preschool: {
    key: "preschool",
    label: "École Maternelle / Préscolaire",
    shortLabel: "Maternelle",
    description: "Crèche, petite/moyenne/grande section. Évaluation par compétences.",
    ageRange: "2 – 5 ans",
    icon: Baby,
    color: "text-pink-500",
    defaultLevels: [
      { name: "Toute Petite Section", short_code: "TPS", cycle: "Maternelle", order_index: 1 },
      { name: "Petite Section", short_code: "PS", cycle: "Maternelle", order_index: 2 },
      { name: "Moyenne Section", short_code: "MS", cycle: "Maternelle", order_index: 3 },
      { name: "Grande Section", short_code: "GS", cycle: "Maternelle", order_index: 4 },
    ],
    disabledModules: ["exams", "classic_grades", "library", "elearning"],
    recommendedCalendar: "trimester",
    recommendedGrading: "competency",
  },
  primary: {
    key: "primary",
    label: "École Primaire",
    shortLabel: "Primaire",
    description: "Apprentissages fondamentaux. Notes et appréciations simples.",
    ageRange: "6 – 11 ans",
    icon: BookOpen,
    color: "text-amber-500",
    defaultLevels: [
      { name: "Cours Préparatoire", short_code: "CP", cycle: "Primaire", order_index: 1 },
      { name: "Cours Élémentaire 1", short_code: "CE1", cycle: "Primaire", order_index: 2 },
      { name: "Cours Élémentaire 2", short_code: "CE2", cycle: "Primaire", order_index: 3 },
      { name: "Cours Moyen 1", short_code: "CM1", cycle: "Primaire", order_index: 4 },
      { name: "Cours Moyen 2", short_code: "CM2", cycle: "Primaire", order_index: 5 },
    ],
    disabledModules: ["filieres", "elearning_advanced"],
    recommendedCalendar: "trimester",
    recommendedGrading: "out_of_20",
  },
  middle_school: {
    key: "middle_school",
    label: "Collège / Premier Cycle",
    shortLabel: "Collège",
    description: "Premier cycle secondaire. Notes avec coefficients.",
    ageRange: "11 – 15 ans",
    icon: BookOpen,
    color: "text-blue-500",
    defaultLevels: [
      { name: "6ème", short_code: "6E", cycle: "Premier cycle", order_index: 1 },
      { name: "5ème", short_code: "5E", cycle: "Premier cycle", order_index: 2 },
      { name: "4ème", short_code: "4E", cycle: "Premier cycle", order_index: 3 },
      { name: "3ème", short_code: "3E", cycle: "Premier cycle", order_index: 4 },
    ],
    disabledModules: [],
    recommendedCalendar: "trimester",
    recommendedGrading: "out_of_20",
  },
  high_school: {
    key: "high_school",
    label: "Lycée / Second Cycle",
    shortLabel: "Lycée",
    description: "Filières spécialisées. Préparation au Baccalauréat.",
    ageRange: "15 – 18 ans",
    icon: GraduationCap,
    color: "text-primary",
    defaultLevels: [
      { name: "Seconde", short_code: "2ND", cycle: "Second cycle", order_index: 1 },
      { name: "Première", short_code: "1ERE", cycle: "Second cycle", order_index: 2 },
      { name: "Terminale", short_code: "TLE", cycle: "Second cycle", order_index: 3 },
    ],
    disabledModules: [],
    recommendedCalendar: "trimester",
    recommendedGrading: "out_of_20",
  },
  university: {
    key: "university",
    label: "Université / Enseignement Supérieur",
    shortLabel: "Université",
    description: "Système LMD avec crédits ECTS, mémoires, stages.",
    ageRange: "18+ ans",
    icon: University,
    color: "text-violet-500",
    defaultLevels: [
      { name: "Licence 1", short_code: "L1", cycle: "Licence", order_index: 1 },
      { name: "Licence 2", short_code: "L2", cycle: "Licence", order_index: 2 },
      { name: "Licence 3", short_code: "L3", cycle: "Licence", order_index: 3 },
      { name: "Master 1", short_code: "M1", cycle: "Master", order_index: 4 },
      { name: "Master 2", short_code: "M2", cycle: "Master", order_index: 5 },
      { name: "Doctorat", short_code: "DOC", cycle: "Doctorat", order_index: 6 },
    ],
    disabledModules: ["main_teacher", "council"],
    recommendedCalendar: "semester",
    recommendedGrading: "out_of_20",
  },
  vocational: {
    key: "vocational",
    label: "École Professionnelle / Technique",
    shortLabel: "Pro / Technique",
    description: "BEP, CAP, BTS. Alternance et compétences pratiques.",
    ageRange: "15 – 25 ans",
    icon: Wrench,
    color: "text-orange-500",
    defaultLevels: [
      { name: "CAP 1ère année", short_code: "CAP1", cycle: "CAP", order_index: 1 },
      { name: "CAP 2ème année", short_code: "CAP2", cycle: "CAP", order_index: 2 },
      { name: "BEP 1ère année", short_code: "BEP1", cycle: "BEP", order_index: 3 },
      { name: "BEP 2ème année", short_code: "BEP2", cycle: "BEP", order_index: 4 },
      { name: "BTS 1ère année", short_code: "BTS1", cycle: "BTS", order_index: 5 },
      { name: "BTS 2ème année", short_code: "BTS2", cycle: "BTS", order_index: 6 },
    ],
    disabledModules: [],
    recommendedCalendar: "semester",
    recommendedGrading: "out_of_20",
  },
  driving_school: {
    key: "driving_school",
    label: "Auto-École",
    shortLabel: "Auto-École",
    description: "Forfaits conduite, code, planning leçons, véhicules.",
    ageRange: "Tous âges",
    icon: Car,
    color: "text-red-500",
    defaultLevels: [
      { name: "Permis B (Voiture)", short_code: "B", order_index: 1 },
      { name: "Permis A (Moto)", short_code: "A", order_index: 2 },
      { name: "Permis C (Camion)", short_code: "C", order_index: 3 },
      { name: "Permis D (Bus)", short_code: "D", order_index: 4 },
    ],
    disabledModules: [
      "classic_grades",
      "timetable",
      "canteen",
      "library",
      "council",
      "main_teacher",
    ],
    recommendedCalendar: "quarter",
    recommendedGrading: "competency",
  },
  arts_sports_school: {
    key: "arts_sports_school",
    label: "École de Musique / Art / Sport",
    shortLabel: "Arts & Sport",
    description: "Cours individuels, instruments, performances, compétitions.",
    ageRange: "Tous âges",
    icon: Music,
    color: "text-emerald-500",
    defaultLevels: [
      { name: "Initiation", short_code: "INIT", order_index: 1 },
      { name: "Niveau 1", short_code: "N1", order_index: 2 },
      { name: "Niveau 2", short_code: "N2", order_index: 3 },
      { name: "Niveau 3", short_code: "N3", order_index: 4 },
      { name: "Perfectionnement", short_code: "PERF", order_index: 5 },
    ],
    disabledModules: ["timetable", "council", "canteen"],
    recommendedCalendar: "trimester",
    recommendedGrading: "competency",
  },
};

export const ALL_SCHOOL_TYPES: SchoolType[] = Object.keys(SCHOOL_TYPES) as SchoolType[];

// ============= Calendars =============
export const CALENDAR_SYSTEMS: { key: CalendarSystem; label: string; description: string }[] = [
  { key: "trimester", label: "Trimestres (3)", description: "1er, 2ème, 3ème trimestre — France & Afrique francophone" },
  { key: "semester", label: "Semestres (2)", description: "Semestre 1 et 2 — Universités et systèmes anglo-saxons" },
  { key: "sequence_6", label: "Séquences (6)", description: "6 séquences par an — courant en Afrique" },
  { key: "quarter", label: "Quarters (4)", description: "4 trimestres courts — système américain" },
];

// ============= Grading =============
export const GRADING_SYSTEMS: { key: GradingSystem; label: string; description: string }[] = [
  { key: "out_of_20", label: "Sur 20", description: "Système français / francophone (mentions)" },
  { key: "out_of_100", label: "Sur 100 (%)", description: "Système anglo-saxon en pourcentage" },
  { key: "out_of_10", label: "Sur 10", description: "Plus simple, utilisé en primaire" },
  { key: "letter", label: "Lettres (A–F)", description: "USA, UK, Afrique anglophone" },
  { key: "gpa_4", label: "GPA sur 4.0", description: "Universités américaines" },
  { key: "competency", label: "Compétences", description: "Acquis / En cours / Non acquis (maternelle, arts, auto-école)" },
];

// ============= Pays + devise =============
export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  callingCode: string;
}

export const COUNTRIES: CountryInfo[] = [
  // Afrique francophone
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "€", flag: "🇫🇷", callingCode: "+33" },
  { code: "BE", name: "Belgique", currency: "EUR", currencySymbol: "€", flag: "🇧🇪", callingCode: "+32" },
  { code: "CH", name: "Suisse", currency: "CHF", currencySymbol: "CHF", flag: "🇨🇭", callingCode: "+41" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "CA$", flag: "🇨🇦", callingCode: "+1" },
  { code: "SN", name: "Sénégal", currency: "XOF", currencySymbol: "FCFA", flag: "🇸🇳", callingCode: "+221" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", currencySymbol: "FCFA", flag: "🇨🇮", callingCode: "+225" },
  { code: "ML", name: "Mali", currency: "XOF", currencySymbol: "FCFA", flag: "🇲🇱", callingCode: "+223" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", currencySymbol: "FCFA", flag: "🇧🇫", callingCode: "+226" },
  { code: "BJ", name: "Bénin", currency: "XOF", currencySymbol: "FCFA", flag: "🇧🇯", callingCode: "+229" },
  { code: "TG", name: "Togo", currency: "XOF", currencySymbol: "FCFA", flag: "🇹🇬", callingCode: "+228" },
  { code: "NE", name: "Niger", currency: "XOF", currencySymbol: "FCFA", flag: "🇳🇪", callingCode: "+227" },
  { code: "CM", name: "Cameroun", currency: "XAF", currencySymbol: "FCFA", flag: "🇨🇲", callingCode: "+237" },
  { code: "GA", name: "Gabon", currency: "XAF", currencySymbol: "FCFA", flag: "🇬🇦", callingCode: "+241" },
  { code: "CG", name: "Congo", currency: "XAF", currencySymbol: "FCFA", flag: "🇨🇬", callingCode: "+242" },
  { code: "CD", name: "RD Congo", currency: "CDF", currencySymbol: "FC", flag: "🇨🇩", callingCode: "+243" },
  { code: "MA", name: "Maroc", currency: "MAD", currencySymbol: "DH", flag: "🇲🇦", callingCode: "+212" },
  { code: "TN", name: "Tunisie", currency: "TND", currencySymbol: "DT", flag: "🇹🇳", callingCode: "+216" },
  { code: "DZ", name: "Algérie", currency: "DZD", currencySymbol: "DA", flag: "🇩🇿", callingCode: "+213" },
  { code: "MG", name: "Madagascar", currency: "MGA", currencySymbol: "Ar", flag: "🇲🇬", callingCode: "+261" },
  // Anglophone
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", flag: "🇺🇸", callingCode: "+1" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", flag: "🇬🇧", callingCode: "+44" },
  { code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "₦", flag: "🇳🇬", callingCode: "+234" },
  { code: "GH", name: "Ghana", currency: "GHS", currencySymbol: "₵", flag: "🇬🇭", callingCode: "+233" },
  { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", flag: "🇰🇪", callingCode: "+254" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", flag: "🇿🇦", callingCode: "+27" },
];

export const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
];
