# Tracer — Contexto do Projeto

## O que é

O **Tracer** é um hub operacional de acompanhamento de *user cases* para o time de **Operations (L2)**. Ele centraliza, em um único registro por caso, todo o ciclo de análise de um problema que chega por diferentes áreas — Customer Support (CS), Tech, Treasury e Clearing — e permite que Operations coordene a investigação até a resolução.

Não é uma ferramenta de tickets. É um painel enxuto, tipo "mini-Jira em tabela", cujo trabalho é responder rápido: *quantos casos existem, quem está com cada um, o que está parado, o que é duplicado e o que falta de informação.*

## O problema que resolve

Hoje o mesmo problema chega por canais diferentes: CS abre porque o cliente reclamou, Treasury abre por uma divergência financeira, Tech abre por um erro de processamento — e os três estão falando da **mesma transação**. Isso gera trabalho duplicado, análises paralelas e perda de histórico. O Tracer detecta a sobreposição (mesmo Order ID / E2E ID), mantém um registro único e deixa cada área contribuir sem sobrescrever a outra.

## Conceito central (inegociável)

- **Um registro por caso.** Todas as áreas trabalham na mesma linha; ninguém duplica o caso.
- **Registro parcial permitido.** Qualquer time registra com o que tem. Só `reported_by` é necessário. O sistema sinaliza o que ainda falta em vez de bloquear.
- **Operations coordena.** Muda o `current_owner` para encaminhar (Tech, Treasury, Clearing, CS) e traz de volta quando precisa.
- **Detecção de duplicidade como alerta, nunca bloqueio.** ⚠️ quando o Order ID ou E2E ID já existe em outro caso; a decisão de vincular é humana.
- **Related cases em vez de "duplicado".** Casos são *vinculados*, preservando a origem de cada solicitação — como "linked issues".
- **Parecer por área, sem sobrescrever.** Um campo de comentário por área, na ordem do fluxo: Operations → Clearing → Treasury → Tech.
- **`current_owner` e `stage` são separados** de propósito: "quem está com o caso" ≠ "em que pé o caso está". Isso permite filtrar as duas coisas de forma independente.

## Modelo de dados (Supabase / Postgres)

Uma tabela `cases` + três enums:

- `team_area`: CS · Tech · Treasury · Clearing · Operations
- `case_owner`: os cinco acima **+ Resolved**
- `case_stage`: New · In Progress · Waiting · Need Information · Resolved

Campos: `case_number` (auto, UC-001…, via sequence + trigger `BEFORE INSERT`), `reported_by`, `account_id`, `order_id`, `e2e_id`, `tax_id`, `tx_date`, `amount`, `summary`, `current_owner`, `stage`, `due_date`, `next_action`, `last_updated_by`, `task_url`, `op_comment`, `clearing_comment`, `treasury_comment`, `tech_comment`, `created_at`, `updated_at` (trigger).

**Dados derivados não viram coluna** (pra não dessincronizar): `is_duplicate`, `related_cases` e `missing_info` saem de uma **view `cases_enriched`** (self-join por `order_id`/`e2e_id` + checagem de nulos). O front lê da view.

## Stack

- **Front:** Next.js (App Router) + React + TypeScript, **shadcn/ui** + Tailwind, deploy na **Vercel**.
- **Back:** **Supabase** (Postgres, triggers, view, RLS). Sem backend Node separado — a lógica vive no banco.
- Realtime (Supabase channel) é opcional, entra se sobrar tempo.

## Identidade visual — cores Binance

UI **simples e dark-first**. Amarelo usado com parcimônia (ações primárias, item ativo, wordmark "Tracer"); estados usam verde/vermelho da própria paleta Binance. É uma ferramenta interna inspirada na paleta — sem qualquer vínculo com a Binance.

### Base (dark)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#0B0E11` | fundo da página |
| `card` / surface | `#181A20` | painéis, tabela |
| `elevated` | `#1E2329` | drawer, cards, hover de linha |
| `border` / `input` | `#2B3139` | divisórias, campos |
| `foreground` | `#EAECEF` | texto principal |
| `secondary-foreground` | `#B7BDC6` | texto secundário |
| `muted-foreground` | `#848E9C` | texto terciário / placeholder |
| `primary` | `#FCD535` | botões primários, item ativo, wordmark |
| `primary-hover` | `#F0B90B` | hover do amarelo |
| `primary-foreground` | `#0B0E11` | texto sobre amarelo (preto) |
| `ring` | `#FCD535` | foco |

### Estados (mapeados à paleta)

| Estado | Cor | Hex |
|---|---|---|
| Resolved / sucesso | verde | `#0ECB81` |
| Overdue / erro | vermelho | `#F6465D` |
| Duplicate ⚠️ / atenção | amarelo | `#FCD535` |
| Missing info | âmbar | `#F0B90B` |
| Need Information | azul | `#3375BB` |
| New | cinza neutro | chip `#2B3139` / texto `#B7BDC6` |
| In Progress | amarelo | `#FCD535` |
| Waiting | âmbar | `#F0B90B` |

Fonte: sans-serif limpa (Inter é um bom default; se preferir espelhar a Binance, IBM Plex Sans / a "BinancePlex" tem esse ar). Cantos suaves, densidade de tabela alta, nada de sombras pesadas.

## Escopo

**v1 (alvo de ~1 dia):** schema + triggers + view + seed · tabela-hub com filtros por owner/stage, busca e badges (duplicado, missing info, stage) · drawer de detalhe com edição, dropdowns e 4 pareceres · criar caso com registro parcial · deploy.

**Depois (v1.1+):** dashboard com gráficos, UI de vínculo manual de casos, timeline/audit history, atribuição de editor por papel, notificações/alertas de prazo, import do CSV da planilha atual, realtime.

## Como o Claude deve trabalhar neste projeto

- Responder em **PT-BR**, direto e iterativo.
- Manter a **stack fixa** acima; não trocar de tecnologia sem eu pedir.
- Usar **shadcn/ui + as cores Binance** definidas aqui como padrão visual.
- Preferir **entregáveis estruturados** (arquivos SQL, componentes, markdown) prontos pra usar.
- Respeitar o **corte de escopo**: não transformar o Tracer em Jira (sem workflows complexos, SLA, custom fields ou permissões finas no v1).
- Assumir que os dados são operacionais reais de um grupo de infraestrutura financeira — cuidado com exemplos que exponham dados sensíveis.
