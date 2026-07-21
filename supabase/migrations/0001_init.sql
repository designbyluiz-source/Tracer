-- =============================================================================
-- Tracer — Migration inicial (v1)
-- Hub operacional de user cases para Operations (L2).
-- Enums · tabela cases · case_number auto · updated_at · view cases_enriched · seed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
-- Áreas que reportam / recebem um caso.
create type team_area as enum ('CS', 'Tech', 'Treasury', 'Clearing', 'Operations');

-- Quem está com o caso agora. As cinco áreas + Resolved (ninguém, caso fechado).
create type case_owner as enum ('CS', 'Tech', 'Treasury', 'Clearing', 'Operations', 'Resolved');

-- Em que pé o caso está. Independente de current_owner (de propósito).
create type case_stage as enum ('New', 'In Progress', 'Waiting', 'Need Information', 'Resolved');

-- -----------------------------------------------------------------------------
-- 2. Sequence para o case_number (UC-001, UC-002, ...)
-- -----------------------------------------------------------------------------
create sequence if not exists case_number_seq start 1;

-- -----------------------------------------------------------------------------
-- 3. Tabela cases
--    Conceito: um registro por caso. Registro parcial permitido — só
--    reported_by é obrigatório; o resto pode chegar depois (o sistema sinaliza
--    o que falta via view, não bloqueia).
-- -----------------------------------------------------------------------------
create table cases (
  id               uuid primary key default gen_random_uuid(),

  -- Identificação legível, gerada por trigger BEFORE INSERT.
  case_number      text unique,

  -- Único campo realmente obrigatório.
  reported_by      team_area   not null,

  -- Chaves de negócio (usadas na detecção de duplicidade).
  account_id       text,
  order_id         text,
  e2e_id           text,
  tax_id           text,

  -- Dados da transação.
  tx_date          date,
  amount           numeric(20, 2),
  summary          text,

  -- Coordenação. current_owner ≠ stage de propósito.
  current_owner    case_owner  not null default 'Operations',
  stage            case_stage  not null default 'New',

  -- Acompanhamento.
  due_date         date,
  next_action      text,
  last_updated_by  team_area,
  task_url         text,

  -- Parecer por área (um por área, ninguém sobrescreve o outro).
  op_comment       text,
  clearing_comment text,
  treasury_comment text,
  tech_comment     text,

  -- Timestamps.
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table cases is 'Um registro por caso. Registro parcial permitido; só reported_by é obrigatório.';
comment on column cases.current_owner is 'Quem está com o caso agora (Operations coordena e encaminha).';
comment on column cases.stage is 'Em que pé o caso está — independente de current_owner.';

-- Índices para a detecção de duplicidade (self-join por order_id / e2e_id) e filtros.
create index cases_order_id_idx  on cases (order_id) where order_id is not null;
create index cases_e2e_id_idx    on cases (e2e_id)   where e2e_id   is not null;
create index cases_owner_idx     on cases (current_owner);
create index cases_stage_idx     on cases (stage);

-- -----------------------------------------------------------------------------
-- 4. Trigger BEFORE INSERT — gera case_number (UC-001…)
-- -----------------------------------------------------------------------------
create or replace function set_case_number()
returns trigger
language plpgsql
as $$
begin
  if new.case_number is null then
    new.case_number := 'UC-' || lpad(nextval('case_number_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger trg_cases_set_case_number
  before insert on cases
  for each row
  execute function set_case_number();

-- -----------------------------------------------------------------------------
-- 5. Trigger BEFORE UPDATE — mantém updated_at
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_cases_set_updated_at
  before update on cases
  for each row
  execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. View cases_enriched
--    Dados derivados NÃO viram coluna (pra não dessincronizar). A view calcula:
--      - is_duplicate:   existe outro caso com mesmo order_id OU e2e_id?
--      - related_cases:  lista dos case_number vinculados por order_id/e2e_id
--      - missing_info:   quais campos-chave ainda estão nulos
--    O front lê daqui.
-- -----------------------------------------------------------------------------
create or replace view cases_enriched as
select
  c.*,

  -- ⚠️ alerta de duplicidade (nunca bloqueio): outro caso compartilha order_id ou e2e_id.
  exists (
    select 1
    from cases o
    where o.id <> c.id
      and (
        (c.order_id is not null and o.order_id = c.order_id)
        or
        (c.e2e_id is not null and o.e2e_id = c.e2e_id)
      )
  ) as is_duplicate,

  -- Casos relacionados (linked issues), ordenados, sem duplicar o próprio.
  coalesce((
    select array_agg(distinct o.case_number order by o.case_number)
    from cases o
    where o.id <> c.id
      and (
        (c.order_id is not null and o.order_id = c.order_id)
        or
        (c.e2e_id is not null and o.e2e_id = c.e2e_id)
      )
  ), '{}') as related_cases,

  -- O que ainda falta para o caso ficar completo (checagem de nulos/branco).
  array_remove(array[
    case when c.account_id is null or c.account_id = '' then 'account_id' end,
    case when c.order_id   is null or c.order_id   = '' then 'order_id'   end,
    case when c.e2e_id     is null or c.e2e_id     = '' then 'e2e_id'     end,
    case when c.tax_id     is null or c.tax_id     = '' then 'tax_id'     end,
    case when c.tx_date    is null                       then 'tx_date'   end,
    case when c.amount     is null                       then 'amount'    end,
    case when c.summary    is null or c.summary    = '' then 'summary'    end
  ], null) as missing_info
from cases c;

comment on view cases_enriched is 'cases + is_duplicate / related_cases / missing_info derivados. O front lê daqui.';

-- -----------------------------------------------------------------------------
-- 7. Seed — 3 casos de exemplo
--    UC-001 e UC-002 compartilham order_id/e2e_id de propósito, para validar a
--    detecção de duplicidade (mesma transação chegando por CS e por Treasury).
--    UC-003 é um caso parcial isolado (registro só com reported_by + summary).
-- -----------------------------------------------------------------------------
insert into cases
  (reported_by, account_id, order_id, e2e_id, tax_id, tx_date, amount, summary,
   current_owner, stage, due_date, next_action, last_updated_by, task_url, op_comment)
values
  -- UC-001 — CS abre porque o cliente reclamou de saque não creditado.
  ('CS', 'ACC-10432', 'ORD-778812', 'E2E-5f3a9c21', '***.***.789-**',
   date '2026-07-18', 1520.00,
   'Cliente relata saque PIX debitado mas não recebido no banco destino.',
   'Operations', 'In Progress', date '2026-07-23',
   'Confirmar liquidação com Treasury antes de responder ao cliente.',
   'CS', 'https://tasks.internal/qtv/UC-001',
   'Recebido do CS. Aguardando parecer de Treasury sobre a liquidação.');

insert into cases
  (reported_by, account_id, order_id, e2e_id, tax_id, tx_date, amount, summary,
   current_owner, stage, due_date, next_action, last_updated_by, task_url, treasury_comment)
values
  -- UC-002 — Treasury abre pela MESMA transação (divergência financeira).
  --          Compartilha order_id/e2e_id com UC-001 => deve marcar duplicidade.
  ('Treasury', 'ACC-10432', 'ORD-778812', 'E2E-5f3a9c21', null,
   date '2026-07-18', 1520.00,
   'Divergência de conciliação: débito registrado sem confirmação de crédito no destino.',
   'Treasury', 'Waiting', date '2026-07-22',
   'Verificar retorno do PSP e cruzar com o extrato de liquidação.',
   'Treasury', 'https://tasks.internal/qtv/UC-002',
   'Provável falha no retorno do PSP. Solicitado reprocessamento do arquivo.');

insert into cases
  (reported_by, summary, current_owner, stage, next_action, last_updated_by)
values
  -- UC-003 — registro parcial: só o essencial. Sistema deve sinalizar missing_info.
  ('Tech',
   'Erro intermitente de timeout no processamento de ordens no horário de pico.',
   'Tech', 'Need Information', 'Coletar order_id e horário exato das ocorrências.',
   'Tech');

-- =============================================================================
-- TODO (v1.1) — RLS por papel
-- -----------------------------------------------------------------------------
-- No v1 a ferramenta é interna e sem login (acesso via service/anon key).
-- Em v1.1, quando houver auth, habilitar RLS e políticas por área. Esboço:
--
--   alter table cases enable row level security;
--
--   -- Todas as áreas leem todos os casos (hub compartilhado).
--   create policy cases_select_all on cases
--     for select using (auth.role() = 'authenticated');
--
--   -- Qualquer área autenticada cria casos (registro parcial).
--   create policy cases_insert_auth on cases
--     for insert with check (auth.role() = 'authenticated');
--
--   -- Update: Operations coordena tudo; cada área edita seu próprio parecer.
--   -- Requer mapear o papel do usuário (JWT claim) para team_area e restringir
--   -- as colunas *_comment via trigger/coluna-a-coluna, já que RLS não filtra
--   -- por coluna nativamente. Detalhar na task de atribuição por papel.
-- =============================================================================
