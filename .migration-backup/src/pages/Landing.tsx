import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  ArrowRight, Sparkles, Shield, Globe2, Smartphone, WifiOff, Brain,
  GraduationCap, Users, Calculator, BookOpen, Bus, Utensils, HeartPulse,
  Library, Briefcase, FileText, CreditCard, Bell, BarChart3, MessageSquare,
  Building2, Car, Music, Trophy, Check, Star, Zap,
} from "lucide-react";
import heroImage from "@/assets/hero-platform.jpg";
import patternImage from "@/assets/pattern-mesh.jpg";

const SCHOOL_TYPES = [
  { icon: GraduationCap, label: "Maternelle", desc: "2-5 ans" },
  { icon: BookOpen, label: "Primaire", desc: "6-11 ans" },
  { icon: Users, label: "Collège", desc: "11-15 ans" },
  { icon: Trophy, label: "Lycée", desc: "15-18 ans" },
  { icon: Building2, label: "Université", desc: "Système LMD" },
  { icon: Car, label: "Auto-école", desc: "Permis A, B, C" },
  { icon: Music, label: "Art / Musique", desc: "Conservatoires" },
  { icon: Trophy, label: "Sport", desc: "Académies" },
];

const MODULES = [
  { icon: Shield, title: "Authentification & Sécurité", desc: "18 rôles, 2FA, biométrie, journal d'audit complet" },
  { icon: Users, title: "Gestion des Élèves", desc: "Inscription, dossier complet, trombinoscope, fratries" },
  { icon: BookOpen, title: "Gestion Académique", desc: "Classes, matières, emploi du temps automatique, cahier de textes" },
  { icon: FileText, title: "Évaluations & Bulletins", desc: "Saisie notes, bulletins PDF, conseil de classe, examens en ligne" },
  { icon: CreditCard, title: "Finance & Paiements", desc: "Frais, Mobile Money, caisse, comptabilité, budget IA" },
  { icon: Briefcase, title: "Personnel & Paie", desc: "Dossiers, contrats, congés, salaires, déclarations" },
  { icon: MessageSquare, title: "Communication", desc: "SMS, email, WhatsApp, push, messagerie interne, chatbot 24/7" },
  { icon: Utensils, title: "Cantine", desc: "Menus, présences, stocks, allergies, facturation" },
  { icon: Bus, title: "Transport scolaire", desc: "GPS temps réel, lignes, chauffeurs, abonnements" },
  { icon: Library, title: "Bibliothèque", desc: "Catalogue, prêts QR code, bibliothèque numérique" },
  { icon: HeartPulse, title: "Santé & Infirmerie", desc: "Visites, vaccinations, urgences, dossier médical" },
  { icon: BarChart3, title: "Tableaux de bord & IA", desc: "Statistiques, prédictions, analyse pédagogique" },
];

const INNOVATIONS = [
  { icon: Brain, title: "IA Pédagogique", desc: "Détecte les élèves à risque d'échec avant la fin du trimestre" },
  { icon: Bus, title: "GPS Bus temps réel", desc: "Les parents voient le bus sur une carte, notification à l'arrivée" },
  { icon: Shield, title: "Diplômes Blockchain", desc: "QR code de vérification anti-falsification sur chaque document" },
  { icon: Bell, title: "Panic Button Campus", desc: "Bouton d'urgence géolocalisé pour tout le personnel" },
  { icon: WifiOff, title: "Mode 100% Hors Ligne", desc: "Fonctionne sans internet, sync auto à la reconnexion" },
  { icon: Globe2, title: "Multi-langues & devises", desc: "FR, EN, AR, SW + toutes devises et Mobile Money" },
];

const STATS = [
  { value: "24", label: "Modules complets" },
  { value: "18", label: "Rôles utilisateurs" },
  { value: "100+", label: "Pages fonctionnelles" },
  { value: "8", label: "Types d'établissements" },
];

const PRICING = [
  {
    name: "Starter",
    price: "Gratuit",
    desc: "Pour découvrir la plateforme",
    features: ["Jusqu'à 50 élèves", "3 utilisateurs admin", "Modules de base", "Support email"],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Établissement",
    price: "Sur devis",
    desc: "La solution la plus complète",
    features: [
      "Élèves illimités",
      "Tous les modules + IA",
      "Mobile Money & Stripe",
      "App Mobile iOS/Android",
      "Mode hors ligne",
      "Support prioritaire 24/7",
    ],
    cta: "Demander une démo",
    highlighted: true,
  },
  {
    name: "Multi-Campus",
    price: "Enterprise",
    desc: "Pour groupes scolaires",
    features: [
      "Établissements illimités",
      "Tableau de bord consolidé",
      "API & intégrations sur mesure",
      "SLA 99.9%",
      "Dédié Customer Success",
    ],
    cta: "Nous contacter",
    highlighted: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ============= NAV ============= */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#modules" className="text-muted-foreground hover:text-foreground transition-smooth">Modules</a>
            <a href="#etablissements" className="text-muted-foreground hover:text-foreground transition-smooth">Établissements</a>
            <a href="#innovations" className="text-muted-foreground hover:text-foreground transition-smooth">Innovations</a>
            <a href="#tarifs" className="text-muted-foreground hover:text-foreground transition-smooth">Tarifs</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button size="sm" className="shadow-glow" asChild>
                <Link to="/auth">Demander une démo</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>La plateforme scolaire universelle nouvelle génération</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                Toute votre école.<br />
                <span className="text-gradient">Une seule plateforme.</span>
              </h1>

              <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
                EduMaster Pro centralise inscriptions, notes, bulletins, finances, communication, transport et IA pédagogique — pour tous les types d'établissements, partout dans le monde.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="shadow-glow gap-2" asChild>
                  <Link to="/auth">
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#modules">Découvrir les modules</a>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-3xl font-bold text-gradient">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute -inset-8 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
              <div className="relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-border/50">
                <img
                  src={heroImage}
                  alt="Plateforme EduMaster Pro - vue isométrique d'une classe digitale globale avec étudiants, livres, et données"
                  width={1600}
                  height={1200}
                  className="w-full h-auto"
                  fetchPriority="high"
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-4 top-12 hidden md:flex animate-float items-center gap-3 rounded-2xl bg-card/95 backdrop-blur shadow-xl ring-1 ring-border/50 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Bulletin envoyé</div>
                  <div className="text-sm font-semibold">2 458 parents</div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-12 hidden md:flex animate-float [animation-delay:1s] items-center gap-3 rounded-2xl bg-card/95 backdrop-blur shadow-xl ring-1 ring-border/50 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">IA Pédagogique</div>
                  <div className="text-sm font-semibold">5 alertes détectées</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= LOGOS / TRUST ============= */}
      <section className="border-y border-border/40 bg-muted/30 py-10">
        <div className="container">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-6">
            Conçu pour tous les établissements, partout dans le monde
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <span>🇫🇷 France</span>
            <span>🇨🇮 Côte d'Ivoire</span>
            <span>🇸🇳 Sénégal</span>
            <span>🇲🇦 Maroc</span>
            <span>🇨🇲 Cameroun</span>
            <span>🇰🇪 Kenya</span>
            <span>🇨🇦 Canada</span>
            <span>🇧🇪 Belgique</span>
            <span>🇨🇩 RDC</span>
          </div>
        </div>
      </section>

      {/* ============= MODULES ============= */}
      <section id="modules" className="py-24 lg:py-32">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              24 MODULES INTÉGRÉS
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Tout ce dont votre école a besoin
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              De l'inscription d'un élève jusqu'à la délivrance de son diplôme, en passant par le paiement des frais et la cantine.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m, i) => (
              <div
                key={m.title}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-card hover:shadow-lg transition-smooth hover:-translate-y-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4 group-hover:scale-110 transition-smooth">
                  <m.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5">{m.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= ÉTABLISSEMENTS ============= */}
      <section id="etablissements" className="py-24 bg-muted/30 border-y border-border/40">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Une plateforme, <span className="text-gradient">tous les établissements</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              EduMaster Pro s'adapte automatiquement au type de votre établissement : modules activés ou désactivés, système de notation, calendrier scolaire.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SCHOOL_TYPES.map((s) => (
              <div
                key={s.label}
                className="group rounded-2xl border border-border/50 bg-card p-6 text-center hover:border-primary/40 hover:shadow-glow transition-smooth"
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-gradient-primary group-hover:shadow-glow transition-smooth">
                  <s.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-smooth" />
                </div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= INNOVATIONS ============= */}
      <section id="innovations" className="py-24 lg:py-32 relative overflow-hidden">
        <img
          src={patternImage}
          alt=""
          width={1600}
          height={900}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.04]"
          aria-hidden="true"
        />
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              FONCTIONNALITÉS EXCLUSIVES
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Des innovations qui font la différence
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INNOVATIONS.map((inn) => (
              <div
                key={inn.title}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur p-6 shadow-card hover:shadow-xl transition-smooth"
              >
                <inn.icon className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <h3 className="font-display font-semibold text-xl mb-2">{inn.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{inn.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= MOBILE / OFFLINE ============= */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <Smartphone className="h-3.5 w-3.5" />
                APP MOBILE iOS & ANDROID
              </div>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Disponible partout, même sans internet
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Application native iOS et Android pour parents, élèves et enseignants. Mode hors ligne complet — la plateforme continue de fonctionner et synchronise automatiquement à la reconnexion. Vital pour les zones à faible connectivité.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Notifications push en temps réel",
                  "Paiement Mobile Money intégré (Orange, MTN, Wave, M-Pesa…)",
                  "WhatsApp Business intégré pour bulletins et alertes",
                  "Synchronisation automatique en arrière-plan",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: WifiOff, label: "Mode hors ligne", desc: "Sync auto" },
                { icon: Globe2, label: "Multi-langues", desc: "FR/EN/AR/SW" },
                { icon: CreditCard, label: "Mobile Money", desc: "Tous opérateurs" },
                { icon: Bell, label: "Push & WhatsApp", desc: "Temps réel" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-card border border-border/50 p-6 shadow-card">
                  <c.icon className="h-7 w-7 text-primary mb-3" strokeWidth={1.75} />
                  <div className="font-semibold">{c.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============= TARIFS ============= */}
      <section id="tarifs" className="py-24 lg:py-32">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Une tarification claire
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choisissez le plan qui correspond à votre établissement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-gradient-to-br from-primary/5 to-accent/5 shadow-glow ring-1 ring-primary/20"
                    : "border-border/50 bg-card shadow-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                    <Star className="h-3 w-3 fill-current" />
                    Le plus populaire
                  </div>
                )}
                <div className="font-display font-semibold text-lg">{plan.name}</div>
                <div className="mt-2 font-display text-4xl font-bold">{plan.price}</div>
                <div className="mt-1 text-sm text-muted-foreground">{plan.desc}</div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-8 ${plan.highlighted ? "shadow-glow" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CTA FINAL ============= */}
      <section className="pb-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 lg:p-16 text-center shadow-xl">
            <div className="absolute inset-0 bg-mesh opacity-30" />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
                Prêt à transformer votre établissement ?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/90 max-w-xl mx-auto">
                Rejoignez les écoles qui digitalisent leur gestion avec EduMaster Pro.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" variant="secondary" className="shadow-xl gap-2" asChild>
                  <Link to="/auth">
                    Commencer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <a href="#modules">En savoir plus</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= FOOTER ============= */}
      <footer className="border-t border-border/40 py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © 2026 EduMaster Pro. La plateforme scolaire universelle.
          </p>
        </div>
      </footer>
    </div>
  );
}
