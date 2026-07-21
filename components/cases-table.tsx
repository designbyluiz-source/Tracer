"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DuplicateBadge,
  MissingInfoBadge,
  OwnerBadge,
  StageBadge,
} from "@/components/case-badges";
import { CaseDrawer } from "@/components/case-drawer";
import { CASE_OWNERS, CASE_STAGES, type EnrichedCase } from "@/lib/types";
import { formatAmount, formatDate } from "@/lib/utils";

/**
 * Tela-hub: tabela de casos lendo de `cases_enriched`.
 * Filtros por owner e stage + busca livre. Tudo client-side sobre os dados
 * já carregados no servidor (o volume no v1 é pequeno).
 * Drawer de detalhe e "novo caso" entram depois.
 */
export function CasesTable({ cases }: { cases: EnrichedCase[] }) {
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [selected, setSelected] = useState<EnrichedCase | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (owner !== "all" && c.current_owner !== owner) return false;
      if (stage !== "all" && c.stage !== stage) return false;
      if (!q) return true;
      return [
        c.case_number,
        c.summary,
        c.account_id,
        c.order_id,
        c.e2e_id,
        c.tax_id,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [cases, query, owner, stage]);

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por caso, resumo, order, e2e, conta..."
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FilterSelect
          label="Owner"
          value={owner}
          onChange={setOwner}
          options={CASE_OWNERS}
        />
        <FilterSelect
          label="Stage"
          value={stage}
          onChange={setStage}
          options={CASE_STAGES}
        />

        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} de {cases.length}
        </span>
      </div>

      {/* Tabela */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[92px]">Caso</TableHead>
            <TableHead>Resumo</TableHead>
            <TableHead className="w-[120px]">Owner</TableHead>
            <TableHead className="w-[150px]">Stage</TableHead>
            <TableHead className="w-[130px]">Valor</TableHead>
            <TableHead className="w-[110px]">Prazo</TableHead>
            <TableHead className="w-[190px]">Flags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground"
              >
                Nenhum caso encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => setSelected(c)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono text-xs text-secondary-foreground">
                  {c.case_number}
                </TableCell>
                <TableCell className="max-w-[420px]">
                  <span className="line-clamp-2 text-foreground">
                    {c.summary ?? (
                      <span className="italic text-muted-foreground">
                        Sem resumo
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <OwnerBadge owner={c.current_owner} />
                </TableCell>
                <TableCell>
                  <StageBadge stage={c.stage} />
                </TableCell>
                <TableCell className="tabular-nums text-secondary-foreground">
                  {formatAmount(c.amount)}
                </TableCell>
                <TableCell className="tabular-nums text-secondary-foreground">
                  {formatDate(c.due_date)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.is_duplicate && (
                      <DuplicateBadge related={c.related_cases} />
                    )}
                    {c.missing_info.length > 0 && (
                      <MissingInfoBadge missing={c.missing_info} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CaseDrawer
        caseItem={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

/** Select simples de filtro, com opção "Todos". */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="all">{label}: todos</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
