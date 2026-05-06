import { supabase } from "@/integrations/supabase/client";

export interface NotifyPayload {
  user_ids: string[];
  title: string;
  body?: string;
  link?: string;
  type?: "info" | "success" | "warning" | "error";
  school_id?: string;
  send_email?: boolean;
}

/**
 * Envoie une notification in-app (et email si activé) via l'edge function.
 * Fallback : insertion directe dans la table notifications si la fonction échoue.
 */
export async function sendNotification(p: NotifyPayload) {
  const { data, error } = await supabase.functions.invoke("send-notification", { body: p });
  if (!error) return data;

  // Fallback in-app uniquement
  const rows = p.user_ids.map((uid) => ({
    user_id: uid,
    title: p.title,
    body: p.body ?? null,
    link: p.link ?? null,
    type: p.type ?? "info",
    school_id: p.school_id ?? null,
  }));
  await supabase.from("notifications").insert(rows);
  return { ok: true, fallback: true };
}
