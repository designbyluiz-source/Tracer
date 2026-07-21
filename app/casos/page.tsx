import { CasesTable } from "@/components/cases-table";
import { NewCaseButton } from "@/components/new-case-dialog";
import { PageHeader } from "@/components/dashboard";
import { getCurrentUser } from "@/lib/current-area";
import { createClient } from "@/lib/supabase/server";
import type { EnrichedCase } from "@/lib/types";

// Painel operacional: sempre dados frescos.
export const dynamic = "force-dynamic";

export default async function CasosPage() {
  const user = await getCurrentUser();
  const area = user?.area ?? "Operations";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 px-8 py-6">
      <PageHeader
        title="Casos"
        subtitle="Um registro por caso. Duplicidade é alerta, nunca bloqueio."
        actions={<NewCaseButton area={area} />}
      />

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
    <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
      <p className="font-medium text-danger">Não consegui carregar os casos.</p>
      <p className="mt-1 text-secondary-foreground">
        Verifique se as migrations foram executadas no Supabase e se as variáveis
        de ambiente estão configuradas.
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
