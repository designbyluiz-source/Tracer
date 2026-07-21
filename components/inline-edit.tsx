"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCaseField } from "@/lib/cases";
import type { TeamArea } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Dropdown editável direto na célula da tabela. Grava ao mudar. */
export function InlineSelect({
  caseId,
  field,
  value,
  options,
  area,
  colorClass,
}: {
  caseId: string;
  field: string;
  value: string;
  options: readonly string[];
  area: TeamArea;
  colorClass?: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState(value);
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  function onChange(next: string) {
    const prev = local;
    setLocal(next); // otimista
    setErr(false);
    start(async () => {
      const { error } = await updateCaseField(caseId, field, next, area);
      if (error) {
        setLocal(prev);
        setErr(true);
        return;
      }
      router.refresh();
    });
  }

  return (
    <select
      value={local}
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full max-w-[190px] rounded-md border bg-card px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60",
        err ? "border-danger text-danger" : "border-border",
        colorClass
      )}
    >
      {options.map((o) => (
        <option key={o} value={o} className="text-foreground">
          {o}
        </option>
      ))}
    </select>
  );
}

/** Célula de data com calendário nativo (abre ao clicar). Grava ao mudar. */
export function InlineDate({
  caseId,
  field,
  value,
  area,
  tone,
}: {
  caseId: string;
  field: string;
  value: string | null;
  area: TeamArea;
  tone?: "overdue" | "soon" | null;
}) {
  const router = useRouter();
  const [local, setLocal] = useState(value ?? "");
  const [pending, start] = useTransition();

  function onChange(next: string) {
    setLocal(next);
    start(async () => {
      await updateCaseField(caseId, field, next === "" ? null : next, area);
      router.refresh();
    });
  }

  return (
    <input
      type="date"
      value={local}
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-[140px] rounded-md border bg-card px-2 py-1 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60",
        tone === "overdue"
          ? "border-danger text-danger"
          : tone === "soon"
            ? "border-warning text-warning"
            : "border-border text-secondary-foreground"
      )}
    />
  );
}
