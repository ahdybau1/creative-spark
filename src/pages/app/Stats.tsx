import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentSchool } from "@/hooks/useSchool";
import { Loader2, Users, GraduationCap, BookOpen, Briefcase, Wallet, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function Stats() {
  const { data: school } = useCurrentSchool();

  const q = useQuery({
    queryKey: ["stats", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const sid = school!.id;
      const counts = async (table: any, filter?: { col: string; val: any }) => {
        let q: any = supabase.from(table).select("id", { count: "exact", head: true }).eq("school_id", sid);
        if (filter) q = q.eq(filter.col, filter.val);
        const { count } = await q;
        return count ?? 0;
      };
      const [students, classes, subjects, staff, fees, sessions] = await Promise.all([
        counts("students", { col: "status", val: "active" }),
        counts("classes"),
        counts("subjects"),
        counts("profiles"),
        counts("fee_payments"),
        counts("attendance_sessions"),
      ]);
      const { data: payments } = await supabase.from("fee_payments").select("amount").eq("school_id", sid);
      const totalRevenue = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      return { students, classes, subjects, staff, fees, sessions, totalRevenue };
    },
  });

  if (!school) return <Empty />;

  const cards: { label: string; value: any; icon: LucideIcon; color: string }[] = [
    { label: "Élèves actifs", value: q.data?.students ?? "—", icon: GraduationCap, color: "text-primary" },
    { label: "Classes", value: q.data?.classes ?? "—", icon: BookOpen, color: "text-info" },
    { label: "Matières", value: q.data?.subjects ?? "—", icon: BookOpen, color: "text-violet-500" },
    { label: "Personnel", value: q.data?.staff ?? "—", icon: Briefcase, color: "text-fuchsia-500" },
    { label: "Sessions présence", value: q.data?.sessions ?? "—", icon: ClipboardCheck, color: "text-orange-500" },
    { label: `Revenus (${school.currency})`, value: q.data ? q.data.totalRevenue.toLocaleString() : "—", icon: Wallet, color: "text-success" },
  ];

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold mb-2">Statistiques</h1>
      <p className="text-muted-foreground mb-6">Vue d'ensemble — {school.name}</p>
      {q.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-5">
              <c.icon className={`h-5 w-5 ${c.color}`} />
              <div className="mt-3 text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <div className="container max-w-2xl py-16 text-center text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3" />Aucun établissement.</div>;
}
