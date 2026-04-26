import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "director"
  | "deputy_director"
  | "secretary"
  | "accountant"
  | "teacher"
  | "main_teacher"
  | "supervisor"
  | "librarian"
  | "nurse"
  | "transport_manager"
  | "canteen_manager"
  | "student"
  | "parent"
  | "driver"
  | "hr_manager"
  | "alumni_manager"
  | "security_agent";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const userRoles = (data?.map((r) => r.role) ?? []) as AppRole[];
    setRoles(userRoles);
    const stored = localStorage.getItem("edu-active-role") as AppRole | null;
    const next = stored && userRoles.includes(stored) ? stored : userRoles[0] ?? null;
    setActiveRoleState(next);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => fetchRoles(newSession.user.id), 0);
      } else {
        setRoles([]);
        setActiveRoleState(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    localStorage.setItem("edu-active-role", role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("edu-active-role");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, activeRole, setActiveRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
