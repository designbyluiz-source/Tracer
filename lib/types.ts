/**
 * Tipos do modelo de dados do Tracer.
 * Espelham os enums e a tabela `cases` + a view `cases_enriched` do Supabase
 * (ver supabase/migrations/0001_init.sql).
 *
 * Quando o schema mudar, o ideal em v1.1 é gerar estes tipos com o CLI do
 * Supabase (`supabase gen types typescript`). Por ora, mantidos à mão.
 */

export type TeamArea = "CS" | "Tech" | "Treasury" | "Clearing" | "Operations";

export type CaseOwner = TeamArea | "Resolved";

export type CaseStage =
  | "New"
  | "In Progress"
  | "Waiting"
  | "Need Information"
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
  stage: CaseStage;
  due_date: string | null;
  next_action: string | null;
  last_updated_by: TeamArea | null;
  task_url: string | null;
  op_comment: string | null;
  clearing_comment: string | null;
  treasury_comment: string | null;
  tech_comment: string | null;
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
 * O front lê SEMPRE daqui (nunca da tabela crua para leitura).
 */
export interface EnrichedCase extends CaseRow {
  is_duplicate: boolean;
  related_cases: string[];
  missing_info: MissingField[];
}

export const TEAM_AREAS: TeamArea[] = [
  "CS",
  "Tech",
  "Treasury",
  "Clearing",
  "Operations",
];

export const CASE_OWNERS: CaseOwner[] = [...TEAM_AREAS, "Resolved"];

export const CASE_STAGES: CaseStage[] = [
  "New",
  "In Progress",
  "Waiting",
  "Need Information",
  "Resolved",
];
