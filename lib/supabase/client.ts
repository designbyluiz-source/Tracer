import { createBrowserClient } from "@supabase/ssr";

/**
 * Client do Supabase para uso no navegador (Client Components).
 * Usa a chave anon pública — segura para o front.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
