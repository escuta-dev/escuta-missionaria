export default function PrivacyPage() {
  return (
    <main className="auth-shell">
      <article className="privacy-card">
        <a className="auth-brand" href="/">← Escuta Missionária</a>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Transparência e cuidado</div>
        <h1>Aviso de Privacidade</h1>
        <div className="notice error">Versão preliminar — este aviso ainda precisa de revisão e complementação antes da abertura pública do cadastro.</div>
        <h2>1. Dados coletados</h2>
        <p>Na solicitação inicial, podemos receber nome, e-mail, telefone opcional, tempo de atuação e uma descrição breve da atividade missionária. Não inclua nomes de pessoas atendidas, endereços sensíveis, rotas, localização de comunidades vulneráveis ou outras informações que possam gerar risco.</p>
        <h2>2. Finalidade</h2>
        <p>As informações são usadas para analisar pedidos de participação, entrar em contato sobre a plataforma e proteger o formulário contra abuso. O pedido inicial não cria uma conta e não publica um perfil.</p>
        <h2>3. Acesso e divulgação</h2>
        <p>As solicitações ficam restritas à administração autorizada. Nenhum dado do pedido inicial é publicado automaticamente. A criação de um perfil público dependerá de consentimento específico e aprovação administrativa.</p>
        <h2>4. Segurança</h2>
        <p>O projeto utiliza Supabase para banco de dados e autenticação, Cloudflare Turnstile para verificação antiabuso e hospedagem planejada na Vercel. O sistema registra hashes técnicos para limitar tentativas; não armazena o endereço IP ou o e-mail em texto puro nessa tabela de controle.</p>
        <h2>5. Direitos e retenção</h2>
        <p>Os prazos de retenção, canal de contato do responsável pelo tratamento, procedimento para exercício dos direitos previstos na LGPD e detalhes sobre operadores e transferências internacionais ainda precisam ser definidos e publicados antes da abertura pública.</p>
        <h2>6. Responsável pelo tratamento</h2>
        <p>A identificação formal do responsável pelo tratamento e seus canais oficiais de contato serão acrescentados na versão final deste aviso.</p>
        <p className="privacy-footnote">Versão de trabalho: draft-1.0 · Não utilizar como aviso definitivo nem abrir o formulário ao público antes da revisão.</p>
      </article>
    </main>
  );
}
