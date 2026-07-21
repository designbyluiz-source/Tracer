"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Activity } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/casos", label: "Casos", icon: FolderKanban, exact: false },
];

export function Sidebar({
  area,
  email,
}: {
  area: string;
  email: string | null;
}) {
  const pathname = usePathname();
  const initials = area.slice(0, 2).toUpperCase();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Marca */}
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="tr-grad-primary tr-grad-glow flex h-7 w-7 items-center justify-center rounded-lg text-primary-foreground">
          <Activity className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Tracer
        </span>
      </div>

      {/* Card da área logada */}
      <div className="mx-4 mb-5 rounded-2xl border border-border bg-elevated p-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-base font-semibold text-secondary-foreground">
          {initials}
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">{area}</p>
        {email && (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "tr-grad-primary tr-grad-glow text-primary-foreground"
                  : "text-muted-foreground hover:bg-elevated hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sair */}
      <div className="border-t border-border p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}
