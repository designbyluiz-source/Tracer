import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CaseOwner, CaseStage } from "@/lib/types";

/** Mapeia o stage do caso para a cor da paleta Binance definida no contexto. */
const STAGE_VARIANT: Record<
  CaseStage,
  "neutral" | "primary" | "success" | "warning" | "info"
> = {
  New: "neutral",
  "In Progress": "primary",
  Waiting: "warning",
  "Need Information": "info",
  Resolved: "success",
};

export function StageBadge({ stage }: { stage: CaseStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{stage}</Badge>;
}

/** Owner é informativo (quem está com o caso). Resolved fica verde; resto neutro. */
export function OwnerBadge({ owner }: { owner: CaseOwner }) {
  return (
    <Badge variant={owner === "Resolved" ? "success" : "neutral"}>
      {owner}
    </Badge>
  );
}

/** ⚠️ alerta de duplicidade — nunca bloqueio. */
export function DuplicateBadge({ related }: { related: string[] }) {
  return (
    <Badge
      variant="primary"
      title={
        related.length
          ? `Compartilha Order/E2E com: ${related.join(", ")}`
          : "Compartilha Order/E2E com outro caso"
      }
    >
      <AlertTriangle className="h-3 w-3" />
      Duplicado
    </Badge>
  );
}

/** Sinaliza campos-chave ainda em branco. */
export function MissingInfoBadge({ missing }: { missing: string[] }) {
  return (
    <Badge variant="warning" title={`Falta: ${missing.join(", ")}`}>
      <Info className="h-3 w-3" />
      {missing.length} faltando
    </Badge>
  );
}
