"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Notice = { kind: "success" | "error"; text: string } | null;

export default function Home() {
  const [captchaToken, setCaptchaToken] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    let attempts = 0;
    const mount = () => {
      if (!window.turnstile) {
        attempts += 1;
        if (attempts < 30) window.setTimeout(mount, 250);
        return;
      }
      const target = document.getElementById("turnstile-widget");
      if (!target || widgetId.current) return;
      widgetId.current = window.turnstile.render(target, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    };
    mount();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (!captchaToken) {
      setNotice({ kind: "error", text: "Conclua a verificacao de seguranca antes de enviar." });
      return;
    }

    const form = new FormData(event.currentTarget);
    const endpoint = process.env.NEXT_PUBLIC_REGISTRATION_FUNCTION_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!endpoint || !apiKey) {
      setNotice({ kind: "error", text: "O formulario ainda esta em configuracao. Tente novamente em breve." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          full_name: form.get("full_name"),
          email: form.get("email"),
          phone: form.get("phone"),
          years_in_ministry: form.get("years_in_ministry"),
          ministry_summary: form.get("ministry_summary"),
          captcha_token: captchaToken,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Nao foi possivel enviar sua solicitacao.");
      setNotice({ kind: "success", text: result.message ?? "Solicitacao recebida." });
      event.currentTarget.reset();
      setCaptchaToken("");
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Falha de comunicacao. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <span>ESCUTA MISSIONÁRIA</span>
        </div>
        <a className="top-link" href="#solicitar-acesso">Solicitar participação</a>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow">Cuidado • Conexão • Apoio</div>
            <h1>Quem cuida de quem vive em missão?</h1>
            <p>
              A Escuta Missionária nasce para ouvir histórias, reconhecer desafios e aproximar
              missionários de pessoas, igrejas e organizações que desejam caminhar junto.
            </p>
          </div>
          <div className="hero-note">
            “Cuidar de jardins desconhecidos também faz parte da missão.”
          </div>
        </div>
      </section>

      <section className="content" id="solicitar-acesso">
        <div className="registration-card">
          <div className="eyebrow" style={{ color: "var(--gold)" }}>Primeiro contato</div>
          <h2>Vamos nos conhecer?</h2>
          <p className="card-intro">
            Este é um pedido inicial de participação. Nossa equipe analisará as informações e,
            se aprovado, enviará um convite individual por e-mail. O envio não cria uma conta automaticamente.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="full_name">Nome completo *</label>
                <input id="full_name" name="full_name" autoComplete="name" required minLength={2} maxLength={160} />
              </div>
              <div className="field">
                <label htmlFor="email">E-mail *</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
              </div>
              <div className="field">
                <label htmlFor="phone">Telefone (opcional)</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
              </div>
              <div className="field">
                <label htmlFor="years_in_ministry">Anos de atuação missionária</label>
                <input id="years_in_ministry" name="years_in_ministry" type="number" min={0} max={80} />
              </div>
              <div className="field full">
                <label htmlFor="ministry_summary">Conte um pouco sobre sua atuação *</label>
                <textarea id="ministry_summary" name="ministry_summary" required minLength={10} maxLength={5000}
                  placeholder="Onde atua, com quem caminha e qual é o foco do seu trabalho..." />
                <span className="hint">Não inclua informações que possam colocar pessoas ou comunidades em risco.</span>
              </div>
              <div className="field full">
                <label>Verificação de segurança *</label>
                <div id="turnstile-widget" className="turnstile-slot" />
                {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <span className="hint">A verificação será habilitada quando a plataforma estiver configurada.</span>
                )}
              </div>
              <div className="field full">
                <button className="submit-button" type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar solicitação"}
                </button>
              </div>
            </div>
            {notice && <div role="status" className={`notice ${notice.kind}`}>{notice.text}</div>}
          </form>

          <div className="privacy-note">
            <strong>Privacidade e cuidado.</strong> Suas informações serão usadas para analisar
            esta solicitação e estabelecer contato sobre a plataforma. Não publicaremos seu nome,
            história ou dados sem consentimento específico. Você pode solicitar a revisão ou exclusão
            dos dados pelos canais oficiais do projeto.
          </div>
        </div>
      </section>

      <footer className="footer">Escuta Missionária · Uma iniciativa independente de cuidado e conexão</footer>
    </main>
  );
}