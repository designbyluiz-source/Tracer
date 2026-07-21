"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FIELD_LABELS, type CaseEvent } from "@/lib/types";

/** Timeline de alterações de um caso (lê de case_events). */
export function CaseHistory({ caseId }: { caseId: string }) {
  const [events, setEvents] = useState<CaseEvent[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("case_events")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (active) setEvents((data as CaseEvent[]) ?? []);
    })();
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
              · {FIELD_LABELS[e.field] ?? e.field}
              {e.field === "status" && e.old_value && e.new_value && (
                <>
                  : <span className="text-muted-foreground">{e.old_value}</span> →{" "}
                  <span className="text-foreground">{e.new_value}</span>
                </>
              )}
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
