"use client";

import { useEffect, useState } from "react";
import { fetchCaseEvents } from "@/lib/cases";
import { FIELD_LABELS, type CaseEvent } from "@/lib/types";

/** Descreve um evento do histórico em uma linha legível. */
function describe(e: CaseEvent): string {
  const label = FIELD_LABELS[e.field] ?? e.field;
  if (e.field === "created") return "Caso criado";
  if (e.field === "merged") return `${label} ${e.new_value ?? ""}`.trim();
  if (e.field === "merged_into") return `${label} ${e.new_value ?? ""}`.trim();
  if (e.field === "status" && e.old_value && e.new_value) {
    return `${label}: ${e.old_value} → ${e.new_value}`;
  }
  if (e.field === "current_owner" && e.new_value) {
    return `${label}: ${e.old_value ?? "—"} → ${e.new_value}`;
  }
  return `${label} atualizado`;
}

/** Timeline de alterações de um caso (lê de case_events). */
export function CaseHistory({ caseId }: { caseId: string }) {
  const [events, setEvents] = useState<CaseEvent[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchCaseEvents(caseId).then((data) => {
      if (active) setEvents(data);
    });
    return () => {
      active = false;
    };
  }, [caseId]);

  if (events === null) {
    return <p className="text-xs text-muted-foreground">Carregando histórico...</p>;
  }
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem alterações registradas.</p>;
  }

  return (
    <ol className="space-y-2.5">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 text-xs">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <p className="text-secondary-foreground">
              <span className="font-medium text-foreground">
                {e.changed_by ?? "—"}
              </span>{" "}
              · {describe(e)}
            </p>
            <p className="text-muted-foreground">
              {new Date(e.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
