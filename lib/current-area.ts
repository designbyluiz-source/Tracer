import { createClient } from "@/lib/supabase/server";
import type { TeamArea } from "@/lib/types";

export interface CurrentUser {
  email: string | null;
  area: TeamArea;
}

/**
 * Área do usuário logado (lida da tabela profiles). Retorna null se não houver
 * sessão. Usada no servidor para preencher last_updated_by e a barra do topo.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("area")
    .eq("id", user.id)
    .single();

  return {
    email: user.email ?? null,
    area: (profile?.area as TeamArea) ?? "Operations",
  };
}
