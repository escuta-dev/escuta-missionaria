"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function SetAccessPage() {
  const router = useRouter();
  const [recovery, setRecovery] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRecovery(new URLSearchParams(window.location.search).get("mode") === "recovery");
    let active = true;
    getSupabase().auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 10) {
      setMessage("Use uma senha com pelo menos 10 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage("Não foi possível definir a senha. Solicite um novo convite ou recuperação.");
      return;
    }
    router.replace("/admin");
  }


  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="auth-brand" href="/">← Escuta Missionária</Link>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>{recovery ? "Recuperação de acesso" : "Convite individual"}</div>
        <h1>{recovery ? "Crie uma nova senha" : "Seu acesso começa aqui"}</h1>
        {!ready ? <p>Validando seu link...</p> : !hasSession ? (
          <div className="notice error">Este link não está válido ou expirou. Solicite um novo convite ou recuperação de senha.</div>
        ) : (
          <>
            <p>Escolha uma senha forte e exclusiva para sua conta.</p>
            <form onSubmit={submit} className="auth-form">
              <label htmlFor="password">Nova senha</label>
              <input id="password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={e=>setPassword(e.target.value)} />
              <label htmlFor="confirm">Confirme a senha</label>
              <input id="confirm" type="password" autoComplete="new-password" minLength={10} required value={confirm} onChange={e=>setConfirm(e.target.value)} />
              <button className="submit-button" disabled={busy}>{busy ? "Salvando..." : "Definir senha e continuar"}</button>
            </form>
          </>
        )}
        {message && <div role="status" className="notice error">{message}</div>}
      </div>
    </main>
  );
}