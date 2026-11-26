## Estado atual

Ambiente de staging: projeto Supabase **Escuta Missionaria**, regiao Sao Paulo (`sa-east-1`). Banco sem dados reais.

- Migrations 001 a 009 aplicadas com sucesso.
- 13 tabelas publicas criadas; RLS habilitado nas 13.
- Funcoes `SECURITY DEFINER` isoladas no esquema `private`; nenhuma permanece em `public`.
- Privilegios de `TRUNCATE`, `REFERENCES` e `TRIGGER` removidos de roles da API.
- Indices para chaves estrangeiras e fila de cadastro criados.
- Tabela de tentativas antiabuso sem acesso de leitura/escrita para `anon` e `authenticated`; apenas backend privilegiado acessa hashes.
- Advisor de seguranca: sem alertas.
- Advisor de saude: sem alertas.
- Advisor de desempenho: avisos informativos de indices nao usados (ambiente ainda vazio) e politicas permissivas sobrepostas (separacao de acesso administrativo e acesso do titular).
- Teste RLS temporario A/B: aprovado; cada missionario visualizou somente seus proprios dados. Registros revertidos com `ROLLBACK`.
- Teste de consulta publica: aprovado; visitante anonimo visualizou somente perfil publicado com consentimento vigente. Registros revertidos.
- Teste de escalacao de privilegio: aprovado; missionario nao conseguiu alterar o proprio papel para admin.
- Teste de submissao de perfil: aprovado; missionario enviou perfil para revisao, sem poder aprovar ou publicar a si mesmo.
- Teste de trigger de atualizacao: aprovado.
- Edge Functions `submit-registration` (JWT desativado por ser formulario publico, com Turnstile obrigatorio) e `approve-registration` (JWT obrigatorio e verificacao de administrador ativo) publicadas.
- Formulario publico inicial Next.js criado; build automatizado configurado, execucao pendente.
- Testes end-to-end de convite por e-mail, login, recuperacao de acesso e painel administrativo: pendentes.
- Segredos `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`, `APP_ORIGIN` e `INVITE_REDIRECT_URL` ainda precisam ser configurados no painel Supabase.
- Chave publica Turnstile e variaveis `NEXT_PUBLIC_*` precisam ser configuradas na Vercel.
- Cadastro publico do Auth deve ser desativado e o primeiro administrador deve ser inicializado manualmente conforme `docs/SETUP.md`.
- Storage ainda nao foi configurado.

## Preparacao do ambiente de teste

Criar um projeto Supabase separado em Sao Paulo (sa-east-1), sem dados reais. Aplicar a migration inicial somente nesse ambiente. Criar:
- um usuario administrador de teste;
- dois usuarios missionarios distintos (A e B);
- um visitante anonimo;
- periodos de relatorio para A e B;
- uma organizacao vinculada somente a A;
- consentimentos de teste.

Nao reutilizar contas ou dados reais de missionarios.

## Matriz de autorizacao

| Caso | Identidade | Operacao | Resultado esperado |
|---|---|---|---|
| RLS-01 | Visitante anonimo | Ler perfil publico publicado com consentimento | Permitido |
| RLS-02 | Visitante anonimo | Ler perfil em rascunho ou sem consentimento vigente | Bloqueado |
| RLS-03 | Visitante anonimo | Ler profiles, missionaries, relatorios, pedidos privados ou consentimentos | Bloqueado |
| RLS-04 | Missionario A | Ler seus dados e relatorios | Permitido |
| RLS-05 | Missionario A | Ler dados privados do missionario B | Bloqueado |
| RLS-06 | Missionario A | Consultar organizacao a que esta vinculado | Permitido |
| RLS-07 | Missionario A | Consultar organizacao sem vinculo | Bloqueado |
| RLS-08 | Missionario A | Alterar seu proprio papel para admin ou ativar a conta | Bloqueado pelo trigger |
| RLS-09 | Missionario A | Criar relatorio em rascunho para seu proprio periodo | Permitido |
| RLS-10 | Missionario A | Associar relatorio a periodo do missionario B | Bloqueado pela chave estrangeira composta |
| RLS-11 | Missionario A | Enviar relatorio com periodo aberto | Permitido |
| RLS-12 | Missionario A | Enviar relatorio com periodo fechado ou futuro | Bloqueado |
| RLS-13 | Missionario A | Alterar relatorio depois do envio | Bloqueado |
| RLS-14 | Missionario A | Alterar somente justificativa do periodo | Permitido |
| RLS-15 | Missionario A | Alterar datas ou status do periodo | Bloqueado pelo trigger |
| RLS-16 | Missionario A | Inserir consentimento de revogacao | Permitido; evento anterior permanece |
| RLS-17 | Missionario A | Alterar ou apagar evento de consentimento | Bloqueado por privilegios |
| RLS-18 | Administrador | Aprovar/reprovar solicitacao e revisar relatorio | Permitido |
| RLS-19 | Administrador | Publicar perfil sem consentimento vigente | Bloqueado pelo trigger |
| RLS-20 | Administrador | Publicar perfil com consentimento e aprovacao de admin ativo | Permitido |
| RLS-21 | Administrador | Consultar trilha de auditoria | Permitido |
| RLS-22 | Missionario | Consultar trilha de auditoria | Bloqueado |

## Fluxos funcionais

1. **Cadastro:** solicitacao publica recebida por Edge Function com validacao, CAPTCHA e rate limit. A solicitacao fica pendente; nenhum usuario recebe acesso automaticamente.
2. **Convite:** somente apos aprovacao administrativa o backend envia convite. O perfil nasce como pending e so ganha acesso apos ativacao administrativa.
3. **Relatorio trimestral:** admin abre periodo; missionario preenche rascunho; envia; admin revisa; admin aprova ou solicita revisao.
4. **Consentimento:** missionario concede consentimento com versao de politica; revogacao cria novo evento; a publicacao deve desaparecer imediatamente da consulta publica.
5. **Auditoria:** operacoes relevantes geram eventos sem copiar textos privados, pedidos de oracao ou dados financeiros para a tabela de auditoria.

## Criterios para liberar producao

- Migration executada sem erro em staging.
- Todos os casos RLS-01 a RLS-22 aprovados.
- Nenhum acesso cruzado entre missionarios.
- Nenhum segredo service_role no frontend ou repositorio.
- Fluxo de cadastro e convite testado ponta a ponta.
- Storage privado testado com URLs assinadas e expiracao, antes de aceitar arquivos.
- Backup, recuperacao, politicas de retencao e processo de resposta a incidente definidos.
- Aviso de privacidade, consentimentos e bases legais revisados para LGPD.
- Aprovacao explicita do responsavel pelo projeto antes da primeira carga de dados reais.

## Observacao

A migration inicial nao configura sozinha Edge Functions, CAPTCHA, envio de e-mail, Storage, backups ou telas da aplicacao. Esses componentes precisam ser implementados e testados separadamente.
