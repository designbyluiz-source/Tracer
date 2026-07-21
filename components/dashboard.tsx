import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cabeçalho de página padrão (título + subtítulo + ações à direita). */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Cartão de KPI. `highlight` deixa o cartão amarelo (destaque principal). */
export function StatCard({
  label,
  value,
  sub,
  icon,
  highlight,
  valueClass,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  highlight?: boolean;
  valueClass?: string;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "tr-in p-5",
        highlight
          ? "tr-grad-primary tr-grad-glow rounded-2xl text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
          : "tr-card tr-card-hover"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium",
          highlight ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        {icon}
        {label}
      </div>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight", valueClass)}>
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "mt-1 text-xs",
            highlight ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/** Cartão container simples. */
export function Panel({
  title,
  children,
  className,
  delay = 0,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn("tr-in tr-card tr-card-hover p-5", className)}
    >
      {title && (
        <p className="mb-4 text-sm font-medium text-foreground">{title}</p>
      )}
      {children}
    </div>
  );
}

/** Donut/gauge de proporção (0..1). */
export function Donut({
  value,
  label,
  center,
}: {
  value: number;
  label: string;
  center: string;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circ * (1 - clamped);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
          {center}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Lista de barras horizontais (distribuições). */
export function BarList({
  items,
}: {
  items: { label: string; value: number; colorClass?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary-foreground">{it.label}</span>
            <span className="tabular-nums text-muted-foreground">{it.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", it.colorClass ?? "bg-primary")}
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Gráfico de área/linha a partir de uma série de números. */
export function AreaChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        Dados insuficientes para o gráfico.
      </div>
    );
  }
  const max = Math.max(1, ...points);
  const n = points.length;
  const coords = points.map((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = 38 - (v / max) * 34;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,40 ${line} 100,40`;

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-40 w-full"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
