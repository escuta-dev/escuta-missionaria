import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "https://www.escutamissionaria.com.br",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Metodo nao permitido." });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return reply(401, { error: "Autenticacao necessaria." });

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return reply(503, { error: "Servico temporariamente indisponivel." });

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return reply(401, { error: "Sessao invalida." });

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: actor, error: actorError } = await admin
      .from("profiles").select("role,account_status").eq("id", userData.user.id).maybeSingle();
    if (actorError || actor?.role !== "admin" || actor?.account_status !== "active") {
      return reply(403, { error: "Acesso restrito a administradores ativos." });
    }

    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    const decisionNote = String(body.decision_note ?? "").trim().slice(0, 2000);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return reply(400, { error: "Solicitacao invalida." });
    }

    const { data: request, error: requestError } = await admin
      .from("registration_requests")
      .select("id,full_name,email,phone,status")
      .eq("id", requestId).maybeSingle();
    if (requestError || !request) return reply(404, { error: "Solicitacao nao encontrada." });
    if (request.status !== "pending") return reply(409, { error: "Esta solicitacao ja foi analisada." });

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(request.email, {
      data: { full_name: request.full_name, registration_request_id: request.id },
      redirectTo: Deno.env.get("INVITE_REDIRECT_URL") ?? undefined,
    });
    if (inviteError || !invited.user) {
      console.error("Falha ao enviar convite:", inviteError?.message);
      return reply(409, { error: "Nao foi possivel convidar este e-mail. Verifique se ja existe uma conta e tente novamente." });
    }

    const { error: profileError } = await admin.from("profiles").update({
      full_name: request.full_name,
      phone: request.phone,
      account_status: "active",
    }).eq("id", invited.user.id);
    if (profileError) {
      console.error("Convite criado, mas ativacao do perfil falhou:", profileError.code);
      return reply(500, { error: "Convite enviado, mas a ativacao do perfil precisa de revisao administrativa." });
    }

    const { error: updateError } = await admin.from("registration_requests").update({
      status: "approved",
      reviewed_by: userData.user.id,
      reviewed_at: new Date().toISOString(),
      decision_note: decisionNote || null,
    }).eq("id", request.id).eq("status", "pending");
    if (updateError) {
      console.error("Falha ao concluir analise:", updateError.code);
      return reply(500, { error: "Convite enviado, mas a solicitacao precisa de conciliacao administrativa." });
    }

    return reply(200, { message: "Solicitacao aprovada e convite enviado." });
  } catch {
    return reply(400, { error: "Nao foi possivel processar a aprovacao." });
  }
});
