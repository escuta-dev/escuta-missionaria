"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedDestination } from "@/lib/auth-routing";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setMessage("Não foi possível entrar. Confira o e-mail e a senha.");
      return;
    }

    const destination = await getAuthenticatedDestination();
    setBusy(false);

    if (!destination.path) {
      await getSupabase().auth.signOut();
      setMessage(destination.error ?? "Não foi possível validar seu acesso.");
      return;
    }

    router.replace(destination.path);
  }

  async function recover() {
    if (!email.trim()) {
      setMessage("Informe seu e-mail para receber o link de recuperação.");
      return;
    }
    setBusy(true);
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-acesso?mode=recovery`,
    });
    setBusy(false);
    setMessage(error ? "Não foi possível solicitar a recuperação." : "Se o e-mail estiver cadastrado, você receberá as instruções.");
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="auth-brand" href="/">← Escuta Missionária</Link>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Área restrita</div>
        <h1>Bem-vindo de volta</h1>
        <p>Entre com o e-mail autorizado pela administração.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} />
          <label htmlFor="password">Senha</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="submit-button" disabled={busy}>{busy ? "Aguarde..." : "Entrar"}</button>
        </form>
        <button className="text-button" onClick={recover} disabled={busy}>Esqueci minha senha</button>
        {message && <div role="status" className="notice">{message}</div>}
        <div className="privacy-note">O acesso é individual e concedido somente após aprovação administrativa.</div>
      </div>
    </main>
  );
}
