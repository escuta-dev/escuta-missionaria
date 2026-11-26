# Escuta Missionaria

Plataforma independente de escuta, acompanhamento, conexao e apoio a missionarios brasileiros que atuam no Brasil ou no exterior.

## Principios do projeto

- Cuidado e acompanhamento, nao fiscalizacao.
- Dados pessoais, financeiros e pedidos de oracao privados por padrao.
- Publicacao de perfil e conteudo somente com consentimento explicito e aprovacao administrativa.
- Apoio financeiro realizado diretamente entre apoiador e missionario/organizacao; a plataforma nao custodia recursos.
- Acesso individual por missionario, com aprovacao administrativa.

## Arquitetura

- Next.js + TypeScript
- Supabase (PostgreSQL, Auth e Row Level Security)
- Vercel
- GitHub
- Cloudflare Turnstile para protecao do formulario publico

## Estado tecnico

- Banco Supabase de staging em Sao Paulo (`sa-east-1`).
- Migrations 001 a 011 aplicadas.
- 13 tabelas publicas com RLS habilitado.
- Funcoes privilegiadas isoladas no esquema `private`.
- Testes iniciais de isolamento entre missionarios, visibilidade publica e protecao de privilegios aprovados.
- Edge Functions `submit-registration` e `approve-registration` publicadas; aprovacao e rejeicao protegidas por verificacao de administrador.
- Formulario publico inicial, login, aceite de convite, painel inicial de administracao e rascunho do Aviso de Privacidade criados no Next.js.
- Sem dados reais de missionarios neste ambiente.

## Documentacao

- [Configuracao do ambiente e primeiro administrador](docs/SETUP.md)
- [Migration inicial](supabase/migrations/001_initial_schema.sql)
- [Plano de testes e resultados](supabase/TEST_PLAN.md)

## Seguranca

Nunca versionar chaves secretas, tokens, senhas, dados pessoais de missionarios ou informacoes de campos missionarios sensiveis. A chave `service_role` e qualquer chave `sb_secret_...` devem permanecer exclusivamente no backend confiavel.
