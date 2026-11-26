import Link from "next/link";

export default function NotFound() {
  return <main className="auth-shell"><div className="auth-card"><div className="eyebrow">Escuta Missionária</div><h1>Página não encontrada</h1><p>O endereço informado não existe ou foi alterado.</p><Link className="submit-button" href="/">Voltar ao início</Link></div></main>;
}