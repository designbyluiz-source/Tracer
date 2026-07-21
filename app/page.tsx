import { CasesTable } from "@/components/cases-table";
import { NewCaseButton } from "@/components/new-case-dialog";
import { getCurrentUser } from "@/lib/current-area";
import { createClient } from "@/lib/supabase/server";
import type { EnrichedCase } from "@/lib/types";

// Painel operacional: sempre dados frescos.
export const dynamic = "force-dynamic";

export default async function HubPage() {
  const user = await getCurrentUser();
  // O middleware já protege a rota; isto é só um guarda extra de tipo.
  const area = user?.area ?? "Operations";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Casos</h1>
          <p className="text-sm text-muted-foreground">
            Um registro por caso. Duplicidade é alerta, nunca bloqueio.
          </p>
        </div>
        <NewCaseButton area={area} />
      </div>

      {error ? (
        <ConnectionError message={error.message} />
      ) : (
        <CasesTable cases={(data as EnrichedCase[]) ?? []} area={area} />
      )}
    </div>
  );
}

function ConnectionError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
      <p className="font-medium text-danger">Não consegui carregar os casos.</p>
      <p className="mt-1 text-secondary-foreground">
        Verifique se as migrations <code className="text-foreground">0001</code> e{" "}
        <code className="text-foreground">0002</code> foram executadas no Supabase e
        se as variáveis de ambiente estão configuradas.
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
