import { AlertTriangle, GitMerge, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CaseOwner, CaseStatus } from "@/lib/types";

type Variant = "neutral" | "primary" | "success" | "warning" | "info" | "danger";

/** Cor de cada status na paleta Binance. */
export const STATUS_VARIANT: Record<CaseStatus, Variant> = {
  New: "neutral",
  "In Review": "info",
  "Waiting for Treasury": "warning",
  "Waiting for Clearing": "warning",
  "Waiting for Operations": "warning",
  "Waiting for Tech": "warning",
  Escalated: "danger",
  Resolved: "success",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

/** Owner informativo. Resolved fica verde; resto neutro. */
export function OwnerBadge({ owner }: { owner: CaseOwner }) {
  return (
    <Badge variant={owner === "Resolved" ? "success" : "neutral"}>{owner}</Badge>
  );
}

/** ⚠️ duplicidade por Order ID (check independente). */
export function DupOrderBadge({ cases }: { cases: string[] }) {
  return (
    <Badge
      variant="primary"
      title={
        cases.length
          ? `Mesmo Order ID de: ${cases.join(", ")}`
          : "Mesmo Order ID de outro caso"
      }
    >
      <AlertTriangle className="h-3 w-3" />
      Dup. Order
    </Badge>
  );
}

/** ⚠️ duplicidade por E2E ID (check independente). */
export function DupE2eBadge({ cases }: { cases: string[] }) {
  return (
    <Badge
      variant="primary"
      title={
        cases.length
          ? `Mesmo E2E ID de: ${cases.join(", ")}`
          : "Mesmo E2E ID de outro caso"
      }
    >
      <AlertTriangle className="h-3 w-3" />
      Dup. E2E
    </Badge>
  );
}

/** Caso que foi mesclado em outro (master). */
export function MergedBadge({ into }: { into: string | null }) {
  return (
    <Badge variant="neutral" title={into ? `Mesclado em ${into}` : "Mesclado"}>
      <GitMerge className="h-3 w-3" />
      {into ? `→ ${into}` : "Mesclado"}
    </Badge>
  );
}

/** Sinaliza campos-chave ainda em branco (validação automática da view). */
export function MissingInfoBadge({ missing }: { missing: string[] }) {
  return (
    <Badge variant="warning" title={`Falta: ${missing.join(", ")}`}>
      <Info className="h-3 w-3" />
      {missing.length} faltando
    </Badge>
  );
}
