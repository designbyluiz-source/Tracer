"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeCasesByNumber } from "@/lib/cases";
import type { EnrichedCase } from "@/lib/types";

/**
 * Painel de unificação: lista os casos duplicados e deixa o usuário escolher
 * qual vira o "master". O outro é mesclado (travado, não apagado) via a função
 * merge_cases no banco.
 */
export function MergePanel({
  current,
  onDone,
}: {
  current: EnrichedCase;
  onDone: () => void;
}) {
  const router = useRouter();
  const related = Array.from(
    new Set([...current.dup_order_cases, ...current.dup_e2e_cases])
  ).sort();

  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (related.length === 0) return null;

  async function merge(masterNumber: string, secondaryNumber: string) {
    setBusy(true);
    setError(null);
    const { error } = await mergeCasesByNumber(masterNumber, secondaryNumber);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-card/50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <GitMerge className="h-3.5 w-3.5" />
        Unificar duplicados
      </p>

      {error && (
        <p className="mb-2 rounded-md border border-danger/40 bg-danger/10 px-2 py-1.5 text-xs text-danger">
          {error}
        </p>
      )}

      {target === null ? (
        <ul className="space-y-1.5">
          {related.map((num) => (
            <li key={num} className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-secondary-foreground">
                {num}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => setTarget(num)}
              >
                Unificar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2 text-xs">
          <p className="text-secondary-foreground">
            Unificando{" "}
            <span className="font-mono text-foreground">{current.case_number}</span>{" "}
            e <span className="font-mono text-foreground">{target}</span>. Qual vira
            o master (o que fica)?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => merge(current.case_number, target)}
            >
              Master: {current.case_number}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => merge(target, current.case_number)}
            >
              Master: {target}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setTarget(null)}
            >
              Cancelar
            </Button>
          </div>
          <p className="text-muted-foreground">
            O master mantém os dados dele e preenche o que faltar a partir do
            outro; os pareceres são reunidos. O caso mesclado fica travado.
          </p>
        </div>
      )}
    </div>
  );
}
