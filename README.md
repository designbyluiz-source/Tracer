# Tracer

Hub operacional de acompanhamento de *user cases* para o time de Operations (L2).
Um registro por caso; CS, Tech, Treasury, Clearing e Operations contribuem sem
sobrescrever uns aos outros. Detecção de duplicidade por Order ID / E2E ID é
**alerta, nunca bloqueio**.

Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres) · deploy na Vercel.

---

## Como rodar (passo a passo)

> Você não precisa entender de código. Siga na ordem.

### 1. Criar o banco no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto (o plano gratuito serve).
2. No menu lateral, abra **SQL Editor** e clique em **New query**.
3. Abra o arquivo `supabase/migrations/0001_init.sql` deste projeto, copie **todo** o conteúdo e cole no editor.
4. Clique em **Run**. Isso cria as tabelas, os automatismos e já insere 3 casos de exemplo.

### 2. Pegar as chaves de conexão

1. Ainda no Supabase, vá em **Project Settings → API**.
2. Copie dois valores: **Project URL** e a chave **anon public**.

### 3. Configurar o projeto localmente

1. Duplique o arquivo `.env.local.example` e renomeie a cópia para `.env.local`.
2. Cole a URL e a chave que você copiou, cada uma na linha correspondente.

### 4. Instalar e ligar

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000` no navegador. Você verá a tela-hub com os 3 casos de exemplo.

---

## O que já existe (v1 — fundação)

- **Banco:** enums, tabela `cases`, numeração automática `UC-001…`, `updated_at` automático, view `cases_enriched` (calcula duplicidade / relacionados / o que falta) e 3 casos de exemplo.
- **Front:** estrutura do Next.js com a paleta Binance (dark) e a tela-hub lendo da view, com busca e filtros por owner e stage.

## v2 — login por área, auditoria e polish

O v2 adiciona login por área, histórico de alterações, novo conjunto de status
e melhorias de UX. Para ativá-lo, além dos passos acima:

### A. Rodar a migration do v2

No **SQL Editor** do Supabase, abra `supabase/migrations/0002_v2_auth_audit.sql`,
cole todo o conteúdo e clique em **Run**. Isso atualiza o banco (novo status,
tabelas de perfil e histórico, RLS).

### B. Criar os 5 logins (uma vez)

No Supabase, vá em **Authentication → Users → Add user** (marque **Auto Confirm
User**) e crie 5 usuários com estes emails — a área é atribuída automaticamente:

- `cs@tracer.local` → CS
- `tech@tracer.local` → Tech
- `treasury@tracer.local` → Treasury
- `clearing@tracer.local` → Clearing
- `operations@tracer.local` → Operations

Defina uma senha para cada. Pronto: cada área entra com o seu login em `/login`.

### Usuário de teste

Para só dar uma olhada na aplicação, use este login (área Operations, que enxerga
e coordena tudo):

- **Email:** `operations@tracer.local`
- **Senha:** `tracer123`

Crie-o pelo painel (Authentication → Add user, com Auto Confirm) ou rodando
`supabase/seed_test_user.sql` no SQL Editor.

> Login apenas para testes internos — troque a senha antes de qualquer uso real.

### O que muda na tela

- **Login obrigatório** por área; a área logada aparece no topo, com botão "Sair".
- **Status** (antes "stage") com: New, In Review, Waiting for Treasury/Clearing/Operations/Tech, Escalated, Resolved.
- **Edição inline** na tabela: status, owner e reportado por viram menu suspenso; a data abre calendário.
- **Duplicidade separada**: selo "Dup. Order" e "Dup. E2E" independentes.
- **Histórico** de alterações (status, owner e pareceres) no drawer, com quem alterou e quando.
- **"Atualizado por"** é automático (a área logada), não digitado.

## v2.1 — trava de parecer por área

Cada área só edita o seu próprio parecer (Operations → parecer de Operations, e
assim por diante). Na tela, os campos das outras áreas ficam desabilitados; no
banco, um bloqueio impede a gravação mesmo por fora da tela.

Para ativar: no **SQL Editor** do Supabase, rode
`supabase/migrations/0003_comment_area_lock.sql`.

## v3 (em andamento)

- **Abas por bucket** na tabela: Em aberto · Escalados · Resolvidos · Todos, com contador. (feito)
- **Unificar duplicados** (merge): no drawer de um caso duplicado, botão "Unificar" — você escolhe o master; o outro fica travado e marcado "Mesclado em UC-xxx" (não é apagado). O master preenche o que faltava e reúne os pareceres. (feito)

  Para ativar: rode `supabase/migrations/0004_merge_cases.sql` no SQL Editor.

## Depois

- Dashboard com gráficos, notificações de prazo, import do CSV, realtime.
- Notificação por email/push de prazo (precisa de infra extra — agendador/serviço de email).
