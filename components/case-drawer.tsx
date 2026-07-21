"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DuplicateBadge,
  MissingInfoBadge,
} from "@/components/case-badges";
import {
  CaseFields,
  toPayload,
  useCaseForm,
} from "@/components/case-form";
import { createClient } from "@/lib/supabase/client";
import type { EnrichedCase } from "@/lib/types";

/**
 * Drawer de detalhe de um caso: mostra flags, permite editar todos os campos
 * (incluindo os que faltam) e os 4 pareceres, e salva no Supabase.
 */
export function CaseDrawer({
  caseItem,
  open,
  onClose,
}: {
  caseItem: EnrichedCase | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!caseItem) return null;
  // key força o form a resetar quando muda o caso selecionado.
  return (
    <DrawerInner key={caseItem.id} caseItem={caseItem} open={open} onClose={onClose} />
  );
}

function DrawerInner({
  caseItem,
  open,
  onClose,
}: {
  caseItem: EnrichedCase;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { values, set } = useCaseForm(caseItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [open]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("cases")
      .update(toPayload(values))
      .eq("id", caseItem.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh(); // recarrega os dados do servidor
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
          {caseItem.task_url && (
            <a
              href={caseItem.task_url}
              target="_blank"
              rel="noreferrer"
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
      {/* Flags derivadas (somente leitura) */}
      {(caseItem.is_duplicate || caseItem.missing_info.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {caseItem.is_duplicate && (
            <DuplicateBadge related={caseItem.related_cases} />
          )}
          {caseItem.missing_info.length > 0 && (
            <MissingInfoBadge missing={caseItem.missing_info} />
          )}
        </div>
      )}

      {caseItem.is_duplicate && (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-secondary-foreground">
          ⚠️ Compartilha Order/E2E com{" "}
          <span className="font-medium text-primary">
            {caseItem.related_cases.join(", ")}
          </span>
          . Vincular é decisão humana — isto é só um alerta.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          Erro ao salvar: {error}
        </p>
      )}

      <CaseFields values={values} set={set} mode="edit" />
    </Sheet>
  );
}
