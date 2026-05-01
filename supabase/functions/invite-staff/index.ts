// Edge Function: invite-staff
// Crée un compte personnel pour une école et lui assigne un rôle.
// Appelable uniquement par un directeur ou un responsable RH de l'école.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppRole =
  | "director" | "deputy_director" | "secretary" | "accountant" | "teacher"
  | "main_teacher" | "supervisor" | "librarian" | "nurse" | "transport_manager"
  | "canteen_manager" | "driver" | "hr_manager" | "alumni_manager" | "security_agent";

interface Payload {
  email: string;
  full_name: string;
  phone?: string | null;
  role: AppRole;
}

function generatePassword(length = 14): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pwd = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) pwd += chars[arr[i] % chars.length];
  return pwd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    // Client utilisateur (pour vérifier identité + rôle)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const caller = userData.user;

    // Vérifier rôle (director ou hr_manager) + récupérer school_id
    const { data: profile, error: profErr } = await userClient
      .from("profiles").select("school_id").eq("id", caller.id).maybeSingle();
    if (profErr || !profile?.school_id) return json({ error: "No school for caller" }, 403);

    const { data: callerRoles } = await userClient
      .from("user_roles").select("role").eq("user_id", caller.id);
    const allowed = (callerRoles ?? []).some((r) => r.role === "director" || r.role === "hr_manager" || r.role === "super_admin");
    if (!allowed) return json({ error: "Forbidden: directors/HR only" }, 403);

    const body = (await req.json()) as Payload;
    if (!body.email || !body.full_name || !body.role) return json({ error: "Missing fields" }, 400);
    if (body.role === ("super_admin" as AppRole)) return json({ error: "Cannot assign super_admin" }, 400);

    // Client admin
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const tempPassword = generatePassword(14);

    // Créer le user (email confirmé pour qu'il puisse se connecter direct)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (createErr) {
      // si email existe déjà
      return json({ error: createErr.message }, 400);
    }
    const newUserId = created.user!.id;

    // Mettre à jour profile : school_id + phone (le trigger l'a créé)
    await admin.from("profiles").update({
      school_id: profile.school_id,
      phone: body.phone ?? null,
      full_name: body.full_name,
    }).eq("id", newUserId);

    // Supprimer le rôle "director" par défaut s'il a été créé par le trigger
    await admin.from("user_roles").delete()
      .eq("user_id", newUserId).eq("role", "director").is("school_id", null);

    // Assigner le rôle demandé sur cette école
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: newUserId,
      role: body.role,
      school_id: profile.school_id,
    });
    if (roleErr) return json({ error: `Role: ${roleErr.message}` }, 400);

    // Créer entrée invitation
    await admin.from("staff_invitations").insert({
      school_id: profile.school_id,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      invited_by: caller.id,
      status: "accepted",
      temp_password: tempPassword,
      accepted_at: new Date().toISOString(),
    });

    return json({
      success: true,
      user_id: newUserId,
      email: body.email,
      temp_password: tempPassword,
    });
  } catch (e) {
    console.error("invite-staff error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
