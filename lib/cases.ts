import { createClient } from "@/lib/supabase/client";
import type { CaseEvent, TeamArea } from "@/lib/types";

/**
 * Camada única de gravação/leitura de casos no cliente. Concentrar aqui evita
 * repetir a montagem do client e garante que TODA escrita carimbe
 * last_updated_by com a área logada (o que alimenta o histórico/auditoria).
 */

type CasePayload = Record<string, string | number | null>;

/** Atualiza um único campo (usado na edição inline da tabela). */
export function updateCaseField(
  caseId: string,
  field: string,
  value: string | number | null,
  area: TeamArea
) {
  const supabase = createClient();
  return supabase
    .from("cases")
    .update({ [field]: value, last_updated_by: area })
    .eq("id", caseId);
}

/** Atualiza vários campos de um caso (usado no drawer). */
export function updateCase(caseId: string, payload: CasePayload, area: TeamArea) {
  const supabase = createClient();
  return supabase
    .from("cases")
    .update({ ...payload, last_updated_by: area })
    .eq("id", caseId);
}

/** Cria um caso (case_number vem do trigger no banco). */
export function insertCase(payload: CasePayload, area: TeamArea) {
  const supabase = createClient();
  return supabase.from("cases").insert({ ...payload, last_updated_by: area });
}

/**
 * Unifica dois casos pelos números (UC-xxx). Resolve os ids e chama a função
 * merge_cases no banco, que faz tudo numa transação e registra no histórico.
 */
export async function mergeCasesByNumber(
  masterNumber: string,
  secondaryNumber: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id,case_number")
    .in("case_number", [masterNumber, secondaryNumber]);

  if (error) return { error };
  const map = Object.fromEntries((data ?? []).map((d) => [d.case_number, d.id]));
  if (!map[masterNumber] || !map[secondaryNumber]) {
    return { error: { message: "Não consegui localizar os casos." } };
  }

  return supabase.rpc("merge_cases", {
    p_master: map[masterNumber],
    p_secondary: map[secondaryNumber],
  });
}

/** Histórico de alterações de um caso, mais recente primeiro. */
export async function fetchCaseEvents(caseId: string): Promise<CaseEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("case_events")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  return (data as CaseEvent[]) ?? [];
}
