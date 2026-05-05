import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", user!.id).is("read_at", null);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          if (payload.eventType === "INSERT" && payload.new?.title) {
            toast.message(payload.new.title, { description: payload.new.body ?? undefined });
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  if (!user) return null;
  const unread = q.data ?? 0;

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link to="/app/notifications" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
