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
            <div className="request-list">
              <article className="request-card">
                <div className="request-top">
                  <div>
                    <h2>Meu perfil</h2>
                    <p className="request-date">Consulte e mantenha seus dados pessoais e missionários atualizados.</p>
                  </div>
                </div>
                <div className="request-actions">
                  <a className="submit-button" href="/missionario/perfil" style={{ display: "inline-block", width: "auto", textDecoration: "none" }}>
                    Acessar meu perfil
                  </a>
                </div>
              </article>
              <article className="request-card">
                <div className="request-top"><div><h2>Relatórios trimestrais</h2><p className="request-date">Envie suas atualizações a cada trimestre e acompanhe o retorno da administração.</p></div></div>
                <div className="request-actions"><a className="submit-button" href="/missionario/relatorios" style={{display:"inline-block",width:"auto",textDecoration:"none"}}>Acessar relatórios</a></div>
              </article>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
