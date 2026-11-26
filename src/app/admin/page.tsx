"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type RequestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  ministry_summary: string;
  years_in_ministry: number | null;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: authData, error: authError } = await getSupabase().auth.getUser();
    if (authError || !authData.user) {
      router.replace("/login");
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role,account_status,full_name")
      .eq("id", authData.user.id).maybeSingle();
    if (profileError || profile?.role !== "admin" || profile.account_status !== "active") {
      setError("Esta área é restrita a administradores ativos.");
      setLoading(false);
      return;
    }
    const { data, error: requestError } = await supabase
      .from("registration_requests")
      .select("id,full_name,email,phone,ministry_summary,years_in_ministry,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (requestError) setError("Não foi possível carregar a fila de solicitações.");
    else setRequests((data ?? []) as RequestRow[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    setNotice("");
    const { data, error: invokeError } = await getSupabase().functions.invoke("approve-registration", {
      body: { request_id: id },
    });
    setBusyId(null);
    if (invokeError) {
      setError("Não foi possível aprovar. Confira a configuração do convite e tente novamente.");
      return;
    }
    setNotice(data?.message ?? "Solicitação aprovada.");
    await load();
  }

  async function reject(id: string) {
    if (!window.confirm("Deseja realmente rejeitar esta solicitação?")) return;
    const { data: authData } = await getSupabase().auth.getUser();
    if (!authData.user) return router.replace("/login");
    setBusyId(id);
    setError("");
    const { error: updateError } = await getSupabase().from("registration_requests").update({
      status: "rejected",
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      decision_note: "Solicitação não aprovada após análise administrativa.",
    }).eq("id", id).eq("status", "pending");
    setBusyId(null);
    if (updateError) {
      setError("Não foi possível concluir a análise desta solicitação.");
      return;
    }
    setNotice("Solicitação rejeitada.");
    await load();
  }

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
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Administração</div>
        <h1>Solicitações de participação</h1>
        <p className="admin-lead">Analise os pedidos recebidos. O convite só é enviado após sua aprovação.</p>
        {notice && <div role="status" className="notice success">{notice}</div>}
        {error && <div role="alert" className="notice error">{error}</div>}
        {loading ? <p>Carregando solicitações...</p> : error ? null : requests.length === 0 ? (
          <div className="empty-state">Não há solicitações pendentes no momento.</div>
        ) : (
          <div className="request-list">
            {requests.map(request => (
              <article className="request-card" key={request.id}>
                <div className="request-top">
                  <div>
                    <h2>{request.full_name}</h2>
                    <a href={`mailto:${request.email}`}>{request.email}</a>
                  </div>
                  <span className="request-date">{new Date(request.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="request-meta">
                  {request.phone && <span>Telefone: {request.phone}</span>}
                  {request.years_in_ministry !== null && <span>Atuação: {request.years_in_ministry} anos</span>}
                </div>
                <p className="request-summary">{request.ministry_summary}</p>
                <div className="request-actions">
                  <button className="submit-button" disabled={busyId === request.id} onClick={()=>approve(request.id)}>
                    {busyId === request.id ? "Processando..." : "Aprovar e enviar convite"}
                  </button>
                  <button className="reject-button" disabled={busyId === request.id} onClick={()=>reject(request.id)}>Rejeitar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}