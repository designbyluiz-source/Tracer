"use client";

import { useState } from "react";
import { controlClass, Field } from "@/components/ui/sheet";
import {
  CASE_OWNERS,
  CASE_STATUSES,
  TEAM_AREAS,
  type CaseRow,
  type CaseOwner,
  type CaseStatus,
  type TeamArea,
} from "@/lib/types";

/**
 * Valores editáveis de um caso, em formato de formulário (tudo string).
 * last_updated_by NÃO está aqui: vem automático da área logada, carimbado na
 * hora de gravar (update/insert).
 */
export interface CaseFormValues {
  reported_by: TeamArea;
  current_owner: CaseOwner;
  status: CaseStatus;
  summary: string;
  account_id: string;
  order_id: string;
  e2e_id: string;
  tax_id: string;
  tx_date: string;
  amount: string;
  due_date: string;
  next_action: string;
  task_url: string;
  op_comment: string;
  clearing_comment: string;
  treasury_comment: string;
  tech_comment: string;
}

function emptyValues(area: TeamArea): CaseFormValues {
  return {
    reported_by: area,
    current_owner: area,
    status: "New",
    summary: "",
    account_id: "",
    order_id: "",
    e2e_id: "",
    tax_id: "",
    tx_date: "",
    amount: "",
    due_date: "",
    next_action: "",
    task_url: "",
    op_comment: "",
    clearing_comment: "",
    treasury_comment: "",
    tech_comment: "",
  };
}

export function fromCase(c: CaseRow): CaseFormValues {
  return {
    reported_by: c.reported_by,
    current_owner: c.current_owner,
    status: c.status,
    summary: c.summary ?? "",
    account_id: c.account_id ?? "",
    order_id: c.order_id ?? "",
    e2e_id: c.e2e_id ?? "",
    tax_id: c.tax_id ?? "",
    tx_date: c.tx_date ?? "",
    amount: c.amount != null ? String(c.amount) : "",
    due_date: c.due_date ?? "",
    next_action: c.next_action ?? "",
    task_url: c.task_url ?? "",
    op_comment: c.op_comment ?? "",
    clearing_comment: c.clearing_comment ?? "",
    treasury_comment: c.treasury_comment ?? "",
    tech_comment: c.tech_comment ?? "",
  };
}

/** Converte texto vazio -> null e amount -> número. */
export function toPayload(v: CaseFormValues) {
  const nn = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    reported_by: v.reported_by,
    current_owner: v.current_owner,
    status: v.status,
    summary: nn(v.summary),
    account_id: nn(v.account_id),
    order_id: nn(v.order_id),
    e2e_id: nn(v.e2e_id),
    tax_id: nn(v.tax_id),
    tx_date: nn(v.tx_date),
    amount: v.amount.trim() === "" ? null : Number(v.amount),
    due_date: nn(v.due_date),
    next_action: nn(v.next_action),
    task_url: nn(v.task_url),
    op_comment: nn(v.op_comment),
    clearing_comment: nn(v.clearing_comment),
    treasury_comment: nn(v.treasury_comment),
    tech_comment: nn(v.tech_comment),
  };
}

/** Estado do formulário. `area` define os defaults na criação. */
export function useCaseForm(area: TeamArea, initial?: CaseRow) {
  const [values, setValues] = useState<CaseFormValues>(
    initial ? fromCase(initial) : emptyValues(area)
  );
  const set = <K extends keyof CaseFormValues>(k: K, val: CaseFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: val }));
  return { values, set };
}

export function CaseFields({
  values,
  set,
  mode,
}: {
  values: CaseFormValues;
  set: <K extends keyof CaseFormValues>(k: K, v: CaseFormValues[K]) => void;
  mode: "create" | "edit";
}) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
        {mode === "create" ? (
          <Field label="Reportado por *" hint="Único campo obrigatório.">
            <Select value={values.reported_by}
              onChange={(v) => set("reported_by", v as TeamArea)} options={TEAM_AREAS} />
          </Field>
        ) : (
          <Field label="Reportado por">
            <Select value={values.reported_by}
              onChange={(v) => set("reported_by", v as TeamArea)} options={TEAM_AREAS} />
          </Field>
        )}
        <Field label="Owner atual" hint="Quem está com o caso.">
          <Select value={values.current_owner}
            onChange={(v) => set("current_owner", v as CaseOwner)} options={CASE_OWNERS} />
        </Field>
        <Field label="Status" hint="Em que pé o caso está.">
          <Select value={values.status}
            onChange={(v) => set("status", v as CaseStatus)} options={CASE_STATUSES} />
        </Field>
        <Field label="Prazo (due date)">
          <input type="date" className={controlClass} value={values.due_date}
            onChange={(e) => set("due_date", e.target.value)} />
        </Field>
      </section>

      <Field label="Resumo">
        <textarea className={`${controlClass} min-h-[70px] resize-y`} value={values.summary}
          onChange={(e) => set("summary", e.target.value)} placeholder="O que aconteceu?" />
      </Field>

      <section className="grid grid-cols-2 gap-3">
        <Field label="Account ID">
          <input className={controlClass} value={values.account_id}
            onChange={(e) => set("account_id", e.target.value)} />
        </Field>
        <Field label="Tax ID">
          <input className={controlClass} value={values.tax_id}
            onChange={(e) => set("tax_id", e.target.value)} />
        </Field>
        <Field label="Order ID" hint="Check de duplicidade por Order.">
          <input className={controlClass} value={values.order_id}
            onChange={(e) => set("order_id", e.target.value)} />
        </Field>
        <Field label="E2E ID" hint="Check de duplicidade por E2E.">
          <input className={controlClass} value={values.e2e_id}
            onChange={(e) => set("e2e_id", e.target.value)} />
        </Field>
        <Field label="Data da transação">
          <input type="date" className={controlClass} value={values.tx_date}
            onChange={(e) => set("tx_date", e.target.value)} />
        </Field>
        <Field label="Valor">
          <input type="number" step="0.01" className={controlClass} value={values.amount}
            onChange={(e) => set("amount", e.target.value)} placeholder="0,00" />
        </Field>
      </section>

      <Field label="Próxima ação">
        <input className={controlClass} value={values.next_action}
          onChange={(e) => set("next_action", e.target.value)} />
      </Field>
      <Field label="Link da tarefa">
        <input className={controlClass} value={values.task_url}
          onChange={(e) => set("task_url", e.target.value)} placeholder="https://..." />
      </Field>

      <section className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pareceres por área
        </p>
        <CommentField label="Operations" value={values.op_comment}
          onChange={(v) => set("op_comment", v)} />
        <CommentField label="Clearing" value={values.clearing_comment}
          onChange={(v) => set("clearing_comment", v)} />
        <CommentField label="Treasury" value={values.treasury_comment}
          onChange={(v) => set("treasury_comment", v)} />
        <CommentField label="Tech" value={values.tech_comment}
          onChange={(v) => set("tech_comment", v)} />
      </section>
    </div>
  );
}

function CommentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-secondary-foreground">{label}</span>
      <textarea className={`${controlClass} min-h-[52px] resize-y`} value={value}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select className={controlClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
