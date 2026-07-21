/**
 * Tipos do modelo de dados do Tracer (v2).
 * Espelham os enums e a tabela `cases` + a view `cases_enriched` do Supabase
 * (ver supabase/migrations/0001_init.sql e 0002_v2_auth_audit.sql).
 */

export type TeamArea = "CS" | "Tech" | "Treasury" | "Clearing" | "Operations";

export type CaseOwner = TeamArea | "Resolved";

export type CaseStatus =
  | "New"
  | "In Review"
  | "Waiting for Treasury"
  | "Waiting for Clearing"
  | "Waiting for Operations"
  | "Waiting for Tech"
  | "Escalated"
  | "Resolved";

/** Linha crua da tabela `cases`. */
export interface CaseRow {
  id: string;
  case_number: string;
  reported_by: TeamArea;
  account_id: string | null;
  order_id: string | null;
  e2e_id: string | null;
  tax_id: string | null;
  tx_date: string | null;
  amount: number | null;
  summary: string | null;
  current_owner: CaseOwner;
  status: CaseStatus;
  due_date: string | null;
  next_action: string | null;
  last_updated_by: TeamArea | null;
  task_url: string | null;
  op_comment: string | null;
  clearing_comment: string | null;
  treasury_comment: string | null;
  tech_comment: string | null;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
}

/** Campos-chave que a view reporta como faltantes em `missing_info`. */
export type MissingField =
  | "account_id"
  | "order_id"
  | "e2e_id"
  | "tax_id"
  | "tx_date"
  | "amount"
  | "summary";

/**
 * Linha da view `cases_enriched`: tudo de `cases` + dados derivados.
 * Duplicidade é feita por dois checks independentes (Order e E2E), já que há
 * times que só mandam um dos dois. O front lê SEMPRE daqui para leitura.
 */
export interface EnrichedCase extends CaseRow {
  merged_into_number: string | null;
  dup_order: boolean;
  dup_e2e: boolean;
  dup_order_cases: string[];
  dup_e2e_cases: string[];
  missing_info: MissingField[];
}

/** Uma linha do histórico de alterações (tabela case_events). */
export interface CaseEvent {
  id: string;
  case_id: string;
  changed_by: TeamArea | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export const TEAM_AREAS: TeamArea[] = [
  "CS",
  "Tech",
  "Treasury",
  "Clearing",
  "Operations",
];

export const CASE_OWNERS: CaseOwner[] = [...TEAM_AREAS, "Resolved"];

export const CASE_STATUSES: CaseStatus[] = [
  "New",
  "In Review",
  "Waiting for Treasury",
  "Waiting for Clearing",
  "Waiting for Operations",
  "Waiting for Tech",
  "Escalated",
  "Resolved",
];

/** Rótulos amigáveis dos campos do histórico. */
export const FIELD_LABELS: Record<string, string> = {
  created: "Caso criado",
  status: "Status",
  current_owner: "Owner",
  op_comment: "Parecer Operations",
  clearing_comment: "Parecer Clearing",
  treasury_comment: "Parecer Treasury",
  tech_comment: "Parecer Tech",
  merged: "Recebeu unificação de",
  merged_into: "Mesclado em",
};
