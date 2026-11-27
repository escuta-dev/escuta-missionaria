import { getSupabase } from "@/lib/supabase";

export async function getAuthenticatedDestination(): Promise<{
  path: "/admin" | "/missionario" | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { path: null, error: "Sua sessão não foi identificada. Entre novamente." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { path: null, error: "Não foi possível localizar seu perfil. Entre em contato com a administração." };
  }

  if (profile.account_status !== "active") {
    return { path: null, error: "Seu acesso ainda não está ativo. Entre em contato com a administração." };
  }

  if (profile.role === "admin") return { path: "/admin", error: null };
  if (profile.role === "missionary") return { path: "/missionario", error: null };

  return { path: null, error: "Seu perfil não possui permissão de acesso." };
}
