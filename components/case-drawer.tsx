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
import { MergePanel } from "@/components/merge-panel";
import { updateCase } from "@/lib/cases";
import type { EnrichedCase, TeamArea } from "@/lib/types";
import { safeHttpUrl } from "@/lib/utils";

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

type Tab = "details" | "history";

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
  const [tab, setTab] = useState<Tab>("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset ao (re)abrir.
  useEffect(() => {
    setError(null);
    setTab("details");
  }, [open]);

  const hasDup = caseItem.dup_order || caseItem.dup_e2e;
  const isMerged = caseItem.merged_into !== null;
  const taskUrl = safeHttpUrl(caseItem.task_url);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await updateCase(caseItem.id, toPayload(values), area);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-secondary-foreground">
            {caseItem.case_number}
          </span>
          {taskUrl && (
            <a
              href={taskUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-primary"
              title="Abrir tarefa"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </span>
      }
      description={`Reportado por ${caseItem.reported_by} · criado em ${new Date(
        caseItem.created_at
      ).toLocaleDateString("pt-BR")}`}
      footer={
        tab === "details" ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || isMerged}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        )
      }
    >
      {/* Abas */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <TabButton active={tab === "details"} onClick={() => setTab("details")}>
          Detalhes
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          Histórico
        </TabButton>
      </div>

      {tab === "history" ? (
        <CaseHistory caseId={caseItem.id} />
      ) : (
        <>
          {isMerged && (
            <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-secondary-foreground">
              Este caso foi mesclado em{" "}
              <span className="font-mono text-foreground">
                {caseItem.merged_into_number}
              </span>
              . Ele está travado — edite o caso master.
            </p>
          )}

          {(hasDup || caseItem.missing_info.length > 0) && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {caseItem.dup_order && <DupOrderBadge cases={caseItem.dup_order_cases} />}
              {caseItem.dup_e2e && <DupE2eBadge cases={caseItem.dup_e2e_cases} />}
              {caseItem.missing_info.length > 0 && (
                <MissingInfoBadge missing={caseItem.missing_info} />
              )}
            </div>
          )}

          {!isMerged && hasDup && <MergePanel current={caseItem} onDone={onClose} />}

          {error && (
            <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              Erro ao salvar: {error}
            </p>
          )}

          <CaseFields values={values} set={set} mode="edit" area={area} />
        </>
      )}
    </Sheet>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
