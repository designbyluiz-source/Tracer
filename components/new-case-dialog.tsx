"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CaseFields, toPayload, useCaseForm } from "@/components/case-form";
import { createClient } from "@/lib/supabase/client";

/**
 * Botão "Novo caso" + drawer de criação. Registro parcial: só reported_by é
 * obrigatório (o resto pode entrar depois; o sistema sinaliza o que falta).
 */
export function NewCaseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Recria o form a cada abertura para começar limpo.
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

      {open && (
        <NewCaseForm
          key={formKey}
          saving={saving}
          error={error}
          onClose={() => setOpen(false)}
          onSubmit={async (values) => {
            setSaving(true);
            setError(null);
            const supabase = createClient();
            // case_number é gerado pelo trigger BEFORE INSERT no banco.
            const { error } = await supabase.from("cases").insert(toPayload(values));
            setSaving(false);
            if (error) {
              setError(error.message);
              return;
            }
            router.refresh();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function NewCaseForm({
  saving,
  error,
  onClose,
  onSubmit,
}: {
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ReturnType<typeof useCaseForm>["values"]) => void;
}) {
  const { values, set } = useCaseForm();

  return (
    <Sheet
      open
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
      <CaseFields values={values} set={set} mode="create" />
    </Sheet>
  );
}
