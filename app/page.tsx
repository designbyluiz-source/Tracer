import { CasesTable } from "@/components/cases-table";
import { createClient } from "@/lib/supabase/server";
import type { EnrichedCase } from "@/lib/types";

// Sempre buscar dados frescos (sem cache) — é um painel operacional.
export const dynamic = "force-dynamic";

export default async function HubPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Casos</h1>
        <p className="text-sm text-muted-foreground">
          Um registro por caso. Duplicidade é alerta, nunca bloqueio.
        </p>
      </div>

      {error ? (
        <ConnectionError message={error.message} />
      ) : (
        <CasesTable cases={(data as EnrichedCase[]) ?? []} />
      )}
    </div>
  );
}

/** Estado de erro amigável — normalmente falta configurar o .env.local. */
function ConnectionError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
      <p className="font-medium text-danger">
        Não consegui carregar os casos do Supabase.
      </p>
      <p className="mt-1 text-secondary-foreground">
        Verifique se o arquivo <code className="text-foreground">.env.local</code>{" "}
        está preenchido com a URL e a chave do seu projeto Supabase, e se a
        migration <code className="text-foreground">0001_init.sql</code> já foi
        executada.
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
