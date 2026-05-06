// Edge function: send-notification
// Insère une notification in-app pour un ou plusieurs utilisateurs
// + envoie un email si RESEND_API_KEY est configuré et que l'utilisateur a un email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  user_ids: string[];
  title: string;
  body?: string;
  link?: string;
  type?: "info" | "success" | "warning" | "error";
  school_id?: string;
  send_email?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client (RLS) pour valider l'appelant
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    if (!payload.user_ids?.length || !payload.title) {
      return new Response(JSON.stringify({ error: "user_ids and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client pour insérer (bypass RLS, mais on a déjà validé l'appelant)
    const admin = createClient(supabaseUrl, serviceKey);

    const rows = payload.user_ids.map((uid) => ({
      user_id: uid,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
      type: payload.type ?? "info",
      school_id: payload.school_id ?? null,
    }));

    const { error: insertErr } = await admin.from("notifications").insert(rows);
    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionnel : envoi email via Resend si clé présente
    let emailsSent = 0;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (payload.send_email && resendKey) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", payload.user_ids);

      const recipients = (profiles ?? []).filter((p: any) => p.email);
      for (const r of recipients) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: Deno.env.get("RESEND_FROM") ?? "Notifications <onboarding@resend.dev>",
              to: [r.email],
              subject: payload.title,
              html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
                <h2 style="margin:0 0 12px">${escapeHtml(payload.title)}</h2>
                ${payload.body ? `<p style="color:#444;line-height:1.5">${escapeHtml(payload.body)}</p>` : ""}
                ${payload.link ? `<p><a href="${payload.link}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none">Ouvrir</a></p>` : ""}
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
                <p style="color:#888;font-size:12px">Vous recevez cet email car vous êtes membre de l'établissement.</p>
              </div>`,
            }),
          });
          if (res.ok) emailsSent++;
        } catch (_) { /* continue */ }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, inserted: rows.length, emails_sent: emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
