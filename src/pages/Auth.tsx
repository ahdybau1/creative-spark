import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import patternImage from "@/assets/pattern-mesh.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/app");
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Connexion impossible", { description: error.message });
      return;
    }
    toast.success("Bienvenue !");
    navigate("/app");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }
    toast.success("Compte créé", {
      description: "Vérifiez votre email pour confirmer votre compte.",
    });
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Saisissez votre email d'abord");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email envoyé", { description: "Vérifiez votre boîte de réception." });
  };

  return (
    <div className="min-h-screen flex">
      {/* ====== LEFT — visual ====== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-hero">
        <img
          src={patternImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground w-full">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-smooth text-sm">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="max-w-md">
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              La gestion scolaire,<br />réinventée.
            </h1>
            <p className="mt-4 text-primary-foreground/85 text-lg leading-relaxed">
              Connectez-vous à EduMaster Pro pour gérer votre établissement, suivre vos élèves, ou accéder à votre espace personnel.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { value: "24", label: "Modules" },
                { value: "18", label: "Rôles" },
                { value: "100+", label: "Écrans" },
                { value: "99.9%", label: "Disponibilité" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl font-bold">{s.value}</div>
                  <div className="text-xs text-primary-foreground/70 uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-foreground/60">
            © 2026 EduMaster Pro · Document confidentiel
          </p>
        </div>
      </div>

      {/* ====== RIGHT — form ====== */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="hidden lg:block mb-8">
              <Logo />
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight">Bienvenue</h2>
            <p className="mt-2 text-muted-foreground">Accédez à votre espace EduMaster Pro</p>

            <Tabs defaultValue="signin" className="mt-8">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Créer un compte</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email-in"
                        type="email"
                        placeholder="vous@ecole.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw-in">Mot de passe</Label>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-xs text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pw-in"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Se connecter
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-up">Nom complet</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name-up"
                        type="text"
                        placeholder="Jean Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email-up"
                        type="email"
                        placeholder="vous@ecole.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pw-up">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pw-up"
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer mon compte
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    En créant un compte, vous acceptez nos conditions d'utilisation.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground text-center mt-8">
              Note : EduMaster Pro est habituellement déployé par votre établissement. Cette inscription est destinée aux démos et aux administrateurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
