"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CaseFields,
  toPayload,
  useCaseForm,
  type CaseFormValues,
} from "@/components/case-form";
import { insertCase } from "@/lib/cases";
import type { TeamArea } from "@/lib/types";

/**
 * Botão "Novo caso" + drawer de criação. Registro parcial: só reported_by é
 * obrigatório. reported_by/owner já vêm com a área logada como padrão.
 */
export function NewCaseButton({ area }: { area: TeamArea }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function openNew() {
    setError(null);
    setFormKey((k) => k + 1);
    setOpen(true);
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={openNew}>
        <Plus className="h-4 w-4" />
        Novo caso
      </Button>

      <NewCaseForm
          key={formKey}
          open={open}
          area={area}
          saving={saving}
          error={error}
          onClose={() => setOpen(false)}
          onSubmit={async (values) => {
            setSaving(true);
            setError(null);
            // case_number vem do trigger; last_updated_by = área logada.
            const { error } = await insertCase(toPayload(values), area);
            setSaving(false);
            if (error) {
              setError(error.message);
              return;
            }
            router.refresh();
            setOpen(false);
          }}
        />
    </>
  );
}

function NewCaseForm({
  open,
  area,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  area: TeamArea;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CaseFormValues) => void;
}) {
  const { values, set } = useCaseForm(area);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo caso"
      description="Registre com o que tiver. Só 'Reportado por' é obrigatório."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onSubmit(values)} disabled={saving}>
            {saving ? "Criando..." : "Criar caso"}
          </Button>
        </>
      }
    >
      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          Erro ao criar: {error}
        </p>
      )}
      <CaseFields values={values} set={set} mode="create" area={area} />
    </Sheet>
  );
}
