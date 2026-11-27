"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function MissionaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, account_status, full_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError || !profile) {
        setError("Não foi possível localizar seu perfil. Entre em contato com a administração.");
      } else if (profile.role === "admin" && profile.account_status === "active") {
        router.replace("/admin");
        return;
      } else if (profile.role !== "missionary" || profile.account_status !== "active") {
        setError("Esta área é exclusiva para missionários com acesso ativo.");
      } else {
        setFullName(profile.full_name);
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="auth-brand" href="/">Escuta Missionária</a>
        <button className="text-button" onClick={logout}>Sair</button>
      </header>
      <section className="admin-content">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Área do missionário</div>
        {loading ? (
          <p>Verificando seu acesso...</p>
        ) : error ? (
          <div role="alert" className="notice error">{error}</div>
        ) : (
          <>
            <h1>Bem-vindo(a), {fullName}</h1>
            <p className="admin-lead">
              Seu acesso à Escuta Missionária está ativo. Este será seu espaço para acompanhar
              seu cadastro e compartilhar atualizações do trabalho missionário.
            </p>
            <div className="empty-state">
              <h2>Estamos preparando sua área</h2>
              <p>
                O acesso já está funcionando. Nas próximas etapas, vamos disponibilizar
                a consulta e atualização do perfil missionário e o envio dos relatórios trimestrais.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
