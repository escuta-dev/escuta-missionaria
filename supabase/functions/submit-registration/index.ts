import { createClient } from "npm:@supabase/supabase-js@2.57.0";

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
    const body = await req.json();
    const full_name = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const ministry_summary = String(body.ministry_summary ?? "").trim();
    const years = body.years_in_ministry === "" || body.years_in_ministry == null
      ? null : Number(body.years_in_ministry);
    const captchaToken = String(body.captcha_token ?? "");

    if (full_name.length < 2 || full_name.length > 160) return reply(400, { error: "Informe seu nome completo." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { error: "Informe um e-mail valido." });
    if (ministry_summary.length < 10 || ministry_summary.length > 5000) return reply(400, { error: "Descreva sua atuacao missionaria (10 a 5.000 caracteres)." });
    if (years !== null && (!Number.isInteger(years) || years < 0 || years > 80)) return reply(400, { error: "Informe corretamente os anos de atuacao." });
    if (!captchaToken) return reply(400, { error: "Confirme a verificacao de seguranca." });

    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!turnstileSecret || !supabaseUrl || !serviceKey) {
      console.error("Configuracao obrigatoria ausente.");
      return reply(503, { error: "Formulario temporariamente indisponivel." });
    }

    const captchaResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: captchaToken }),
    });
    const captchaResult = await captchaResponse.json();
    if (!captchaResult.success) return reply(400, { error: "Verificacao de seguranca invalida. Tente novamente." });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.from("registration_requests").insert({
      full_name, email, phone, ministry_summary, years_in_ministry: years,
    });

    if (error) {
      if (error.code === "23505") {
        return reply(202, { message: "Se os dados estiverem validos, sua solicitacao sera analisada. Evite enviar novamente." });
      }
      console.error("Falha ao registrar solicitacao:", error.code);
      return reply(500, { error: "Nao foi possivel enviar sua solicitacao. Tente novamente mais tarde." });
    }

    return reply(201, { message: "Solicitacao recebida. A equipe analisara seu cadastro." });
  } catch {
    return reply(400, { error: "Nao foi possivel processar os dados enviados." });
  }
});
