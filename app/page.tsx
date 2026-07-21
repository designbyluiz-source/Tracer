import { Layers, FolderOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  BarList,
  Donut,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/dashboard";
import { STATUS_VARIANT } from "@/components/case-badges";
import { createClient } from "@/lib/supabase/server";
import { dueTone } from "@/lib/deadlines";
import {
  CASE_OWNERS,
  CASE_STATUSES,
  type EnrichedCase,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_BG: Record<string, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cases_enriched").select("*");
  const all = (data as EnrichedCase[]) ?? [];

  // Métricas ignoram casos mesclados.
  const cases = all.filter((c) => !c.merged_into);
  const total = cases.length;
  const open = cases.filter((c) => c.status !== "Resolved");
  const resolved = cases.filter((c) => c.status === "Resolved");
  const overdue = cases.filter((c) => dueTone(c.due_date, c.status) === "overdue");

  const resolutionRate = total ? resolved.length / total : 0;
  const openWithDue = open.filter((c) => c.due_date);
  const onTime = openWithDue.filter(
    (c) => dueTone(c.due_date, c.status) !== "overdue"
  );
  const onTimeRate = openWithDue.length ? onTime.length / openWithDue.length : 1;

  const byStatus = CASE_STATUSES.map((s) => ({
    label: s,
    value: cases.filter((c) => c.status === s).length,
    colorClass: STATUS_BG[STATUS_VARIANT[s]],
  })).filter((i) => i.value > 0);

  const byOwner = CASE_OWNERS.map((o) => ({
    label: o,
    value: cases.filter((c) => c.current_owner === o).length,
  })).filter((i) => i.value > 0);

  // Novos casos por dia nos últimos 30 dias.
  const days = 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const perDay: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    perDay.push(cases.filter((c) => c.created_at.slice(0, 10) === key).length);
  }
  const newLast30 = perDay.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 px-8 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral dos casos de Operations."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de casos"
          value={total}
          sub="Ativos (sem mesclados)"
          icon={<Layers className="h-4 w-4" />}
          delay={0}
        />
        <StatCard
          label="Em aberto"
          value={open.length}
          sub={`${Math.round((open.length / (total || 1)) * 100)}% do total`}
          icon={<FolderOpen className="h-4 w-4" />}
          highlight
          delay={60}
        />
        <StatCard
          label="Resolvidos"
          value={resolved.length}
          sub={`${Math.round(resolutionRate * 100)}% de resolução`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          delay={120}
        />
        <StatCard
          label="Vencidos"
          value={overdue.length}
          sub="Prazo estourado, em aberto"
          icon={<AlertTriangle className="h-4 w-4" />}
          valueClass={overdue.length ? "text-danger" : undefined}
          delay={180}
        />
      </div>

      {/* Gráfico + indicadores */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Novos casos (últimos 30 dias)" delay={240}>
          <p className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            {newLast30}
          </p>
          <AreaChart points={perDay} />
        </Panel>

        <Panel title="Indicadores" delay={300}>
          <div className="flex items-center justify-around gap-2 py-2">
            <Donut
              value={resolutionRate}
              center={`${Math.round(resolutionRate * 100)}%`}
              label="Resolução"
            />
            <Donut
              value={onTimeRate}
              center={`${Math.round(onTimeRate * 100)}%`}
              label="No prazo"
            />
          </div>
        </Panel>
      </div>

      {/* Distribuições */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Casos por status" delay={360}>
          {byStatus.length ? (
            <BarList items={byStatus} />
          ) : (
            <p className="text-xs text-muted-foreground">Sem casos.</p>
          )}
        </Panel>
        <Panel title="Casos por owner" delay={420}>
          {byOwner.length ? (
            <BarList items={byOwner} />
          ) : (
            <p className="text-xs text-muted-foreground">Sem casos.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
