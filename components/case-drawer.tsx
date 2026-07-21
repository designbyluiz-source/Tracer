"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DupE2eBadge,
  DupOrderBadge,
  MissingInfoBadge,
} from "@/components/case-badges";
import { CaseFields, toPayload, useCaseForm } from "@/components/case-form";
import { CaseHistory } from "@/components/case-history";
import { createClient } from "@/lib/supabase/client";
import type { EnrichedCase, TeamArea } from "@/lib/types";

export function CaseDrawer({
  caseItem,
  area,
  open,
  onClose,
}: {
  caseItem: EnrichedCase | null;
  area: TeamArea;
  open: boolean;
  onClose: () => void;
}) {
  if (!caseItem) return null;
  return (
    <DrawerInner key={caseItem.id} caseItem={caseItem} area={area} open={open} onClose={onClose} />
  );
}

function DrawerInner({
  caseItem,
  area,
  open,
  onClose,
}: {
  caseItem: EnrichedCase;
  area: TeamArea;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { values, set } = useCaseForm(area, caseItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [open]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    // last_updated_by = área logada -> alimenta o histórico automaticamente.
    const { error } = await supabase
      .from("cases")
      .update({ ...toPayload(values), last_updated_by: area })
      .eq("id", caseItem.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    onClose();
  }

  const hasDup = caseItem.dup_order || caseItem.dup_e2e;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-secondary-foreground">
            {caseItem.case_number}
          </span>
          {caseItem.task_url && (
            <a href={caseItem.task_url} target="_blank" rel="noreferrer"
              className="text-muted-foreground hover:text-primary" title="Abrir tarefa">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </span>
      }
      description={`Reportado por ${caseItem.reported_by} · criado em ${new Date(
        caseItem.created_at
      ).toLocaleDateString("pt-BR")}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {(hasDup || caseItem.missing_info.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {caseItem.dup_order && <DupOrderBadge cases={caseItem.dup_order_cases} />}
          {caseItem.dup_e2e && <DupE2eBadge cases={caseItem.dup_e2e_cases} />}
          {caseItem.missing_info.length > 0 && (
            <MissingInfoBadge missing={caseItem.missing_info} />
          )}
        </div>
      )}

      {hasDup && (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-secondary-foreground">
          ⚠️{" "}
          {caseItem.dup_order && (
            <>
              Mesmo Order ID de{" "}
              <span className="font-medium text-primary">
                {caseItem.dup_order_cases.join(", ")}
              </span>
              .{" "}
            </>
          )}
          {caseItem.dup_e2e && (
            <>
              Mesmo E2E ID de{" "}
              <span className="font-medium text-primary">
                {caseItem.dup_e2e_cases.join(", ")}
              </span>
              .{" "}
            </>
          )}
          Vincular é decisão humana — isto é só um alerta.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          Erro ao salvar: {error}
        </p>
      )}

      <CaseFields values={values} set={set} mode="edit" area={area} />

      <section className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Histórico
        </p>
        <CaseHistory caseId={caseItem.id} />
      </section>
    </Sheet>
  );
}
