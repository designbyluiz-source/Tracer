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
  DupE2eBadge,
  DupOrderBadge,
  MissingInfoBadge,
  STATUS_VARIANT,
} from "@/components/case-badges";
import { InlineDate, InlineSelect } from "@/components/inline-edit";
import { CaseDrawer } from "@/components/case-drawer";
import {
  CASE_OWNERS,
  CASE_STATUSES,
  TEAM_AREAS,
  type EnrichedCase,
  type TeamArea,
} from "@/lib/types";
import { formatAmount } from "@/lib/utils";

/** Cor do texto do dropdown de status, casando com a paleta. */
const VARIANT_TEXT: Record<string, string> = {
  neutral: "text-secondary-foreground",
  primary: "text-primary",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-success",
};

/**
 * Buckets de andamento (recorte visual, sem mexer no banco). Cada aba é só um
 * filtro por cima da mesma tabela; owner/status/busca seguem valendo dentro.
 */
const BUCKETS: { id: string; label: string; match: (c: EnrichedCase) => boolean }[] = [
  { id: "open", label: "Em aberto", match: (c) => c.status !== "Resolved" },
  { id: "escalated", label: "Escalados", match: (c) => c.status === "Escalated" },
  { id: "resolved", label: "Resolvidos", match: (c) => c.status === "Resolved" },
  { id: "all", label: "Todos", match: () => true },
];

export function CasesTable({
  cases,
  area,
}: {
  cases: EnrichedCase[];
  area: TeamArea;
}) {
  const [bucket, setBucket] = useState<string>("open");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<EnrichedCase | null>(null);

  // Contador de cada aba (sempre sobre a lista completa).
  const counts = useMemo(
    () =>
      Object.fromEntries(BUCKETS.map((b) => [b.id, cases.filter(b.match).length])),
    [cases]
  );

  const activeBucket = BUCKETS.find((b) => b.id === bucket) ?? BUCKETS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (!activeBucket.match(c)) return false;
      if (owner !== "all" && c.current_owner !== owner) return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return [c.case_number, c.summary, c.account_id, c.order_id, c.e2e_id, c.tax_id]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [cases, activeBucket, query, owner, status]);

  return (
    <div className="space-y-4">
      {/* Abas por bucket de andamento */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {BUCKETS.map((b) => {
          const active = b.id === bucket;
          return (
            <button
              key={b.id}
              onClick={() => setBucket(b.id)}
              className={
                "relative -mb-px flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {b.label}
              <span
                className={
                  "rounded-full px-1.5 py-0.5 text-xs " +
                  (active
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground")
                }
              >
                {counts[b.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por caso, resumo, order, e2e, conta..."
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <FilterSelect label="Owner" value={owner} onChange={setOwner} options={CASE_OWNERS} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={CASE_STATUSES} />
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} de {cases.length}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Caso</TableHead>
            <TableHead className="min-w-[240px]">Resumo</TableHead>
            <TableHead className="w-[120px]">Reportado</TableHead>
            <TableHead className="w-[130px]">Owner</TableHead>
            <TableHead className="w-[200px]">Status</TableHead>
            <TableHead className="w-[120px]">Valor</TableHead>
            <TableHead className="w-[150px]">Prazo</TableHead>
            <TableHead className="w-[180px]">Flags</TableHead>
            <TableHead className="w-[110px]">Atualizado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                Nenhum caso encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((c) => (
              <TableRow key={c.id} onClick={() => setSelected(c)} className="cursor-pointer">
                <TableCell className="font-mono text-xs text-secondary-foreground">
                  {c.case_number}
                </TableCell>
                <TableCell className="max-w-[420px]">
                  <span className="line-clamp-2 text-foreground">
                    {c.summary ?? (
                      <span className="italic text-muted-foreground">Sem resumo</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <InlineSelect caseId={c.id} field="reported_by" value={c.reported_by}
                    options={TEAM_AREAS} area={area} />
                </TableCell>
                <TableCell>
                  <InlineSelect caseId={c.id} field="current_owner" value={c.current_owner}
                    options={CASE_OWNERS} area={area} />
                </TableCell>
                <TableCell>
                  <InlineSelect caseId={c.id} field="status" value={c.status}
                    options={CASE_STATUSES} area={area}
                    colorClass={VARIANT_TEXT[STATUS_VARIANT[c.status]]} />
                </TableCell>
                <TableCell className="tabular-nums text-secondary-foreground">
                  {formatAmount(c.amount)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineDate caseId={c.id} field="due_date" value={c.due_date} area={area} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.dup_order && <DupOrderBadge cases={c.dup_order_cases} />}
                    {c.dup_e2e && <DupE2eBadge cases={c.dup_e2e_cases} />}
                    {c.missing_info.length > 0 && <MissingInfoBadge missing={c.missing_info} />}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.last_updated_by ?? "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CaseDrawer
        caseItem={selected}
        area={area}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

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
