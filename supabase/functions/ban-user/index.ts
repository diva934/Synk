import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip");

  const body = await req.json().catch(() => ({}));
  const { session_id, reason, reports_count } = body;

  if (!session_id || !reason) {
    return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.rpc("ban_user", {
    p_session_id: session_id,
    p_ip_address: ip ?? "0.0.0.0",
    p_reason: reason,
    p_reports_count: reports_count ?? null,
  });

  if (error) {
    console.error("Ban failed:", error);
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }

  return Response.json({ ok: true, ban_id: data }, { headers: CORS });
});
