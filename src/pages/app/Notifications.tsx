import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  const markAll = async () => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("Toutes marquées lues");
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Vos alertes et messages système.</p>
        </div>
        <Button variant="outline" onClick={markAll} className="gap-2"><Check className="h-4 w-4" />Tout marquer lu</Button>
      </div>
      {q.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !q.data?.length ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {q.data.map((n: any) => (
            <div key={n.id} className={`rounded-xl border bg-card p-4 flex items-start gap-3 ${!n.read_at ? "border-primary/40 bg-primary/5" : ""}`}>
              <Bell className={`h-5 w-5 mt-0.5 ${!n.read_at ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read_at && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
