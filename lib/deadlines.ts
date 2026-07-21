import type { EnrichedCase } from "@/lib/types";

export type DueTone = "overdue" | "soon" | null;

/**
 * Situação do prazo de um caso:
 *   - "overdue": venceu e o caso não está resolvido
 *   - "soon":    vence em até 2 dias
 *   - null:      sem prazo, no prazo, ou já resolvido
 */
export function dueTone(due: string | null, status: string): DueTone {
  if (!due || status === "Resolved") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${due}T00:00:00`);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return null;
}

/** Conta vencidos e vencendo entre os casos abertos (ignora mesclados). */
export function deadlineCounts(cases: EnrichedCase[]) {
  let overdue = 0;
  let soon = 0;
  for (const c of cases) {
    if (c.merged_into) continue;
    const t = dueTone(c.due_date, c.status);
    if (t === "overdue") overdue++;
    else if (t === "soon") soon++;
  }
  return { overdue, soon };
}
