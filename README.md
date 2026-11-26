# Escuta Missionaria

Plataforma independente de escuta, acompanhamento, conexao e apoio a missionarios brasileiros que atuam no Brasil ou no exterior.

## Principios do projeto

- Cuidado e acompanhamento, nao fiscalizacao.
- Dados pessoais, financeiros e pedidos de oracao privados por padrao.
- Publicacao de perfil e conteudo somente com consentimento explicito e aprovacao administrativa.
- Apoio financeiro realizado diretamente entre apoiador e missionario/organizacao; a plataforma nao custodia recursos.
- Acesso individual por missionario, com aprovacao administrativa.

## Arquitetura prevista

- Next.js + TypeScript
- Supabase (PostgreSQL, Auth e Row Level Security)
- Vercel
- GitHub

## Estado tecnico

- Banco Supabase de staging criado em Sao Paulo (`sa-east-1`).
- Migrations SQL 001 a 006 aplicadas.
- 12 tabelas publicas com RLS habilitado.
- Funcoes privilegiadas isoladas no esquema `private`.
- Testes iniciais de isolamento entre dois missionarios e de visibilidade publica condicionada a consentimento aprovados.
- Sem dados reais de missionarios neste ambiente.
- Edge Functions, Storage, autenticacao por convite e interface ainda pendentes.

## Documentacao

- [Migration inicial](supabase/migrations/001_initial_schema.sql)
- [Plano de testes e resultados](supabase/TEST_PLAN.md)

## Seguranca

Nunca versionar chaves secretas, tokens, senhas, dados pessoais de missionarios ou informacoes de campos missionarios sensiveis. A chave `service_role` deve permanecer exclusivamente no backend confiavel.
