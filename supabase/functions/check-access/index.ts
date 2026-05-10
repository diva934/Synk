import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip");

  if (!ip) {
    return Response.json({ allowed: false, reason: "no_ip" }, { status: 400, headers: CORS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: isBanned, error } = await supabase.rpc("is_ip_banned", {
    p_ip_address: ip,
  });

  if (error) {
    console.error("Ban check failed:", error);
    // Fail-open : en cas d'erreur DB on laisse passer
    return Response.json({ allowed: true }, { headers: CORS });
  }

  return Response.json({ allowed: !isBanned }, { headers: CORS });
});
