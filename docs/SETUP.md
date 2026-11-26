# Configuracao do ambiente de desenvolvimento

Projeto Supabase: `tadxnadthekahoftsdei` (Sao Paulo, `sa-east-1`).

## 1. Segredos das Edge Functions

No Supabase Dashboard, abra **Edge Functions > Secrets** e configure:

- `TURNSTILE_SECRET_KEY`: segredo do widget Cloudflare Turnstile.
- `RATE_LIMIT_SALT`: texto aleatorio longo (minimo 32 bytes) usado para gerar hashes de IP/e-mail.

O formulario tambem exige aceite expresso do Aviso de Privacidade e registra a versao e a data do aceite. O aviso atual (`draft-1.0`) e preliminar: nao abra o cadastro publicamente ate completar a identificacao do responsavel, contato, retencao e direitos LGPD.
- `APP_ORIGIN`: origem exata do site, por exemplo `https://www.escutamissionaria.com.br`.
- `INVITE_REDIRECT_URL`: destino apos aceitar convite, por exemplo `https://www.escutamissionaria.com.br/definir-acesso`.

As variaveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` sao disponibilizadas pelo ambiente Supabase. Nunca copie a chave secreta/service role para o GitHub, Vercel ou navegador.

## 2. Cloudflare Turnstile

1. Criar um widget Turnstile no painel Cloudflare.
2. Adicionar os dominios que realmente serao usados (dominio final e dominio temporario de homologacao).
3. Copiar a **Site Key** para a variavel publica `NEXT_PUBLIC_TURNSTILE_SITE_KEY` na Vercel.
4. Copiar a **Secret Key** para `TURNSTILE_SECRET_KEY` nos segredos das Edge Functions.

A Site Key e publica. A Secret Key nunca deve sair do ambiente Supabase.

## 3. Vercel

Importar o repositorio GitHub `escuta-dev/escuta-missionaria` na Vercel e configurar:

- `NEXT_PUBLIC_SUPABASE_URL=https://tadxnadthekahoftsdei.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave `sb_publishable_...` do projeto.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Site Key do widget.
- `NEXT_PUBLIC_REGISTRATION_FUNCTION_URL=https://tadxnadthekahoftsdei.supabase.co/functions/v1/submit-registration`

Nao adicionar chave `service_role` ou `sb_secret_...` nas variaveis `NEXT_PUBLIC_*`.

## 4. Supabase Auth: acesso somente por convite

Antes de abrir o site:

1. No Supabase, abra **Authentication > Sign In / Providers** e desative novos cadastros publicos (sign ups).
2. Em **Authentication > URL Configuration**, configure o Site URL e permita somente os enderecos de retorno usados pela plataforma, incluindo `/definir-acesso`.
3. Exija confirmacao de e-mail.
4. Configure SMTP proprio antes do uso real, para que convites e mensagens de acesso tenham boa entregabilidade.

O formulario publico da plataforma grava apenas uma solicitacao na fila. Ele nao chama `auth.signUp()` e nao cria contas diretamente.

## 5. Primeiro administrador (uma unica vez)

A primeira conta administrativa deve ser criada manualmente pelo proprietario do projeto:

1. Em **Authentication > Users**, crie/invite a conta do administrador com o e-mail que sera usado na gestao.
2. Abra **SQL Editor** e execute o comando abaixo, substituindo o e-mail pelo e-mail exato da conta criada:

```sql
update public.profiles p
set role = 'admin',
    account_status = 'active'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('SEU_EMAIL_ADMINISTRADOR');
```

3. Confirme que uma linha foi alterada e que o perfil esta como `admin` e `active`.

Nao compartilhe senha, chave secreta ou token com colaboradores. A conta administrativa deve usar senha forte e MFA.

## 6. Estado atual / limites

- O banco de staging esta criado e sem dados reais.
- As migrations 001 a 011 foram aplicadas.
- As Edge Functions `submit-registration` e `approve-registration` estao publicadas.
- A interface publica e a area restrita estao no repositorio, mas ainda nao foram publicadas na Vercel.
- O formulario nao recebe solicitacoes ate configurar Turnstile, `RATE_LIMIT_SALT`, `APP_ORIGIN` e as variaveis publicas da Vercel.
- O painel inicial, login, aceite de convite e recuperacao de acesso ja estao no repositorio. O fluxo de aprovacao/rejeicao usa a Edge Function protegida por JWT e verificacao de administrador.


## 7. Publicacao de homologacao

A conexao da Vercel ainda nao foi concluida. Quando a integracao estiver conectada:

1. Importar o repositorio `escuta-dev/escuta-missionaria`.
2. Manter o framework Next.js e a branch de producao `main`.
3. Adicionar as quatro variaveis publicas listadas na secao 3.
4. Fazer deploy de Preview primeiro; nao divulgar o endereco.
5. Configurar o endereco Preview exato em `APP_ORIGIN` no Supabase e autorizar o redirect correspondente em Authentication > URL Configuration.
6. Testar login, recuperacao de senha, solicitacao de cadastro, aprovacao e rejeicao.
7. Somente apos os testes, adicionar o dominio definitivo e configurar DNS.

Nao cadastrar missionarios reais nem abrir a participacao publica durante a homologacao.
