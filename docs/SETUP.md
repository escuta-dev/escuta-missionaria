# Configuracao do ambiente de desenvolvimento

Projeto Supabase: `tadxnadthekahoftsdei` (Sao Paulo, `sa-east-1`).

## 1. Segredos das Edge Functions

No Supabase Dashboard, abra **Edge Functions > Secrets** e configure:

- `TURNSTILE_SECRET_KEY`: segredo do widget Cloudflare Turnstile.
- `RATE_LIMIT_SALT`: texto aleatorio longo (minimo 32 bytes) usado para gerar hashes de IP/e-mail.
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
- As migrations 001 a 009 foram aplicadas.
- As Edge Functions `submit-registration` e `approve-registration` estao publicadas.
- A interface publica inicial esta no repositorio, mas ainda nao esta publicada na Vercel.
- O formulario nao recebe solicitacoes ate configurar Turnstile, `RATE_LIMIT_SALT` e `APP_ORIGIN`.
- O painel administrativo, login, aceite de convite e recuperacao de acesso ainda serao implementados.
