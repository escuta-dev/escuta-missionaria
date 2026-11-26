# Plano de testes da Escuta Missionaria

Este plano deve ser executado em um projeto Supabase de desenvolvimento/staging, nunca inicialmente no banco de producao.

## Estado atual

Ambiente de staging: projeto Supabase **Escuta Missionaria**, regiao Sao Paulo (`sa-east-1`). Banco sem dados reais.

- Migrations 001 a 006 aplicadas com sucesso.
- 12 tabelas publicas criadas; RLS ativado nas 12.
- 30 politicas RLS registradas.
- Funcoes `SECURITY DEFINER` movidas para o esquema `private`; nenhuma permanece em `public`.
- Privilegios de `TRUNCATE`, `REFERENCES` e `TRIGGER` removidos de `anon`, `authenticated` e `service_role` nas tabelas publicas.
- Indices para as seis chaves estrangeiras apontadas pelo Advisor adicionados.
- Advisor de seguranca: sem alertas.
- Advisor de saude: sem alertas.
- Advisor de desempenho: sem chaves estrangeiras sem indice; permanecem avisos informativos de indices ainda nao usados (banco vazio) e politicas permissivas sobrepostas (separacao intencional entre acesso administrativo e acesso do titular).
- Teste RLS temporario A/B: aprovado; cada missionario visualizou somente seu proprio perfil, cadastro de missionario, pedido privado e periodo de relatorio. Registros de teste foram revertidos com `ROLLBACK`.
- Teste de escalacao de privilegio: aprovado; missionario nao conseguiu alterar o proprio papel para admin.
- Teste de submissao de perfil: aprovado; missionario conseguiu enviar perfil como `pending_review`, mas nao conseguiu publica-lo nem atribuir aprovacao administrativa.
- Teste de permissoes SQL: aprovado; `anon` nao possui leitura de tabelas privadas nem privilegios de `TRUNCATE`; `authenticated` e `service_role` tambem nao possuem `TRUNCATE` nas tabelas publicas.
- Teste de consulta publica: aprovado; visitante anonimo visualizou somente perfil publicado com consentimento vigente; perfil em rascunho nao apareceu. Registros de teste foram revertidos.
- Teste de sintaxe e aplicacao das migrations: aprovado pelo Supabase.
- Teste completo das transicoes de relatorio, organizacoes, consentimento/revogacao, papel administrativo e fluxo de convite: pendente.
- Teste de Storage: pendente; bucket e politicas ainda nao foram criados.
- Teste de Edge Functions, CAPTCHA, rate limit e e-mail: pendente; backend ainda nao implementado.

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
