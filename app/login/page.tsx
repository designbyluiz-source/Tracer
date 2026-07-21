"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

/** Tela de login por área (email + senha do Supabase Auth). */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Email ou senha incorretos.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Brilho amarelo de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-20 blur-3xl tr-grad-primary"
      />

      <form
        onSubmit={handleLogin}
        className="tr-in tr-card relative w-full max-w-sm space-y-5 p-7"
      >
        <div className="flex items-center gap-2.5">
          <span className="tr-grad-primary tr-grad-glow flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Tracer
          </span>
        </div>

        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Entrar na sua área
          </h1>
          <p className="text-sm text-muted-foreground">
            Use o login da sua área para acessar o hub.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            autoComplete="username"
            required
            className={controlClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="area@tracer.local"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Senha
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            className={controlClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
