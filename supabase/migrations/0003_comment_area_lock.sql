-- =============================================================================
-- Tracer — Migration v2.1 (trava de parecer por área)
-- Rodar DEPOIS de 0002_v2_auth_audit.sql, no SQL Editor do Supabase.
--
-- Regra: cada área só pode alterar o SEU parecer.
--   op_comment       -> Operations
--   clearing_comment -> Clearing
--   treasury_comment -> Treasury
--   tech_comment     -> Tech
--
-- A checagem usa current_area() (a área do usuário logado). Operações feitas
-- pelo service role / SQL Editor (sem usuário) NÃO são bloqueadas — current_area()
-- retorna NULL, então a condição não dispara. Idempotente.
-- =============================================================================

create or replace function enforce_comment_area()
returns trigger
language plpgsql
as $$
declare
  actor team_area := current_area();
begin
  -- Sem usuário logado (service role / SQL editor): não trava.
  if actor is null then
    return new;
  end if;

  if new.op_comment is distinct from old.op_comment and actor <> 'Operations' then
    raise exception 'Apenas Operations pode editar o parecer de Operations.';
  end if;

  if new.clearing_comment is distinct from old.clearing_comment and actor <> 'Clearing' then
    raise exception 'Apenas Clearing pode editar o parecer de Clearing.';
  end if;

  if new.treasury_comment is distinct from old.treasury_comment and actor <> 'Treasury' then
    raise exception 'Apenas Treasury pode editar o parecer de Treasury.';
  end if;

  if new.tech_comment is distinct from old.tech_comment and actor <> 'Tech' then
    raise exception 'Apenas Tech pode editar o parecer de Tech.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cases_enforce_comment_area on cases;
create trigger trg_cases_enforce_comment_area
  before update on cases
  for each row
  execute function enforce_comment_area();
