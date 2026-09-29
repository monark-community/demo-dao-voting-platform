"use client"

import { BanknoteIcon, LockIcon, MegaphoneIcon, SlidersHorizontalIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { fmtPower } from "@/components/diagrams/tally-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { isAddress } from "@/lib/demo/ids"
import { createProposal, type ProposalDraft } from "@/lib/demo/ops"
import { canPublish } from "@/lib/demo/permissions"
import { useDemo } from "@/lib/demo/store"
import { totalPower } from "@/lib/demo/tally"
import type { Category, ProposalAction, TreasuryToken, VotingModel } from "@/lib/demo/types"
import { fmtNumber, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Card } from "./bits"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

type ActionKind = ProposalAction["kind"]

interface Form {
  title: string
  summary: string
  body: string
  category: Category
  action: ActionKind
  amount: string
  token: TreasuryToken
  to: string
  toLabel: string
  ruleParam: "quorum" | "period"
  ruleValue: string
  model: VotingModel
  periodDays: number
  quorumPct: number
  thresholdPct: number
}

const CATEGORIES: Category[] = ["treasury", "events", "community", "rules", "technical"]
const MODELS: VotingModel[] = ["delegated", "token", "wallet"]
const PERIODS = [1, 3, 5, 7, 14]
const QUORUMS = [10, 15, 20, 25, 30]

/** Template contents live here in both languages; only the demo uses them. */
const TEMPLATES: Record<"en" | "fr", Record<string, Partial<Form>>> = {
  en: {
    grant: {
      title: "Fund a spring workshop series",
      summary: "1,200 tUSDC for six hands-on Solidity workshops led by members.",
      body: "Six Saturday workshops, from a first contract to a small DAO, led by members who've shipped on testnet. The budget covers room booking, snacks and a small stipend for each instructor.\n\nUnused funds return to the treasury after the last session.",
      category: "events",
      action: "transfer",
      amount: "1200",
      token: "tUSDC",
      toLabel: "Workshop organisers multisig",
      to: "0x4b1e0c9a7f3d2e8b6a5c4d3e2f1a0b9c8d7e6f5a",
      model: "delegated",
      thresholdPct: 50,
    },
    conduct: {
      title: "Keep community calls to 45 minutes",
      summary: "Cap the weekly call at 45 minutes, with open questions in the last 10.",
      body: "Calls regularly run past an hour and people drop off before the open questions. Capping them at 45 minutes, with the last 10 reserved for questions, keeps them useful for everyone.",
      category: "community",
      action: "none",
      model: "wallet",
      thresholdPct: 50,
    },
    period: {
      title: "Extend the default voting period to 10 days",
      summary: "Give members who travel or study abroad time to vote.",
      body: "Several members study abroad or travel for conferences. A 10-day default gives everyone a full week plus a weekend to read and vote, without slowing urgent decisions, which can still use a shorter period.",
      category: "rules",
      action: "rule",
      ruleParam: "period",
      ruleValue: "10",
      model: "token",
      thresholdPct: 66,
    },
  },
  fr: {
    grant: {
      title: "Financer une série d'ateliers au printemps",
      summary: "1 200 tUSDC pour six ateliers pratiques de Solidity animés par des membres.",
      body: "Six ateliers le samedi, du premier contrat à une petite DAO, animés par des membres qui ont déjà publié sur testnet. Le budget couvre la salle, les collations et une petite rémunération pour chaque formateur.\n\nLes fonds non utilisés reviennent au trésor après la dernière séance.",
      category: "events",
      action: "transfer",
      amount: "1200",
      token: "tUSDC",
      toLabel: "Multisig des organisateurs d'ateliers",
      to: "0x4b1e0c9a7f3d2e8b6a5c4d3e2f1a0b9c8d7e6f5a",
      model: "delegated",
      thresholdPct: 50,
    },
    conduct: {
      title: "Limiter les appels communautaires à 45 minutes",
      summary: "Plafonner l'appel hebdomadaire à 45 minutes, avec les questions libres dans les 10 dernières.",
      body: "Les appels dépassent souvent l'heure et beaucoup décrochent avant les questions libres. Les limiter à 45 minutes, dont 10 réservées aux questions, les rend utiles pour tout le monde.",
      category: "community",
      action: "none",
      model: "wallet",
      thresholdPct: 50,
    },
    period: {
      title: "Allonger la durée de vote par défaut à 10 jours",
      summary: "Laisser le temps de voter aux membres qui voyagent ou étudient à l'étranger.",
      body: "Plusieurs membres étudient à l'étranger ou partent en conférence. Dix jours par défaut laissent à chacun une semaine complète et une fin de semaine pour lire et voter, sans ralentir les décisions urgentes, qui peuvent toujours utiliser une durée plus courte.",
      category: "rules",
      action: "rule",
      ruleParam: "period",
      ruleValue: "10",
      model: "token",
      thresholdPct: 66,
    },
  },
}

type Errors = Partial<Record<"title" | "summary" | "body" | "amount" | "to" | "toLabel" | "ruleValue", string>>

export function Composer() {
  const demo = useDemo()
  const router = useRouter()
  const copy = useAppCopy()
  const { app, terms, locale, disclaimer } = copy
  const c = app.composer
  const f = c.fields
  const tx = useTx()
  const blank = (): Form => ({
    title: "",
    summary: "",
    body: "",
    category: "treasury",
    action: "none",
    amount: "",
    token: "tUSDC",
    to: "",
    toLabel: "",
    ruleParam: "quorum",
    ruleValue: "",
    model: "delegated",
    periodDays: demo?.space.defaultPeriodDays ?? 7,
    quorumPct: demo?.space.defaultQuorumPct ?? 20,
    thresholdPct: 50,
  })
  const [form, setForm] = useState<Form>(blank)
  const [errors, setErrors] = useState<Errors>({})
  const [tried, setTried] = useState(false)
  if (!demo) return null

  const me = demo.members.find((m) => m.address === demo.wallet.address)
  if (!canPublish(me, demo.space)) {
    return (
      <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center py-12 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full border-2 border-primary">
          <LockIcon className="size-6 text-primary-ink" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-display">{c.locked.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.locked.body}</p>
        <p className="mt-2 text-sm text-muted-foreground">{c.locked.hint}</p>
        <Button asChild size="lg" variant="outline" className="mt-8">
          <Link href={href(locale, "/app")}>{c.locked.back}</Link>
        </Button>
      </section>
    )
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (tried) setErrors(validate(next))
  }

  function validate(v: Form): Errors {
    const e: Errors = {}
    const ce = c.errors
    if (v.title.trim().length < 8) e.title = ce.title
    if (!v.summary.trim()) e.summary = ce.summary
    if (v.body.trim().length < 40) e.body = ce.body
    if (v.action === "transfer") {
      const n = Number(v.amount)
      const held = demo?.space.treasury[v.token] ?? 0
      if (!/^\d+$/.test(v.amount.trim()) || n <= 0) e.amount = ce.amount
      else if (n > held) e.amount = t(ce.amountHigh, { amount: fmtNumber(locale, held), token: v.token })
      if (!isAddress(v.to)) e.to = ce.recipient
      if (!v.toLabel.trim()) e.toLabel = ce.recipientLabel
    }
    if (v.action === "rule") {
      const [min, max] = v.ruleParam === "quorum" ? [5, 50] : [1, 30]
      const n = Number(v.ruleValue)
      if (!/^\d+$/.test(v.ruleValue.trim()) || n < min || n > max) e.ruleValue = t(ce.ruleValue, { min, max })
    }
    return e
  }

  const action = (v: Form): ProposalAction =>
    v.action === "transfer"
      ? { kind: "transfer", amount: Number(v.amount), token: v.token, to: v.to.trim(), toLabel: v.toLabel.trim() }
      : v.action === "rule"
        ? { kind: "rule", param: v.ruleParam, value: Number(v.ruleValue) }
        : { kind: "none" }

  const actionLabel = (v: Form): string => {
    const a = app.proposal.actions
    const act = action(v)
    if (act.kind === "transfer") return t(a.transfer, { amount: fmtNumber(locale, act.amount || 0), token: act.token, to: act.toLabel || "…" })
    if (act.kind === "rule") return t(act.param === "quorum" ? a.rulequorum : a.ruleperiod, { value: Number.isFinite(act.value) && act.value ? act.value : "…" })
    return a.none
  }

  const submit = () => {
    setTried(true)
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length > 0) {
      document.getElementById("composer-errors")?.focus()
      return
    }
    const draft: ProposalDraft = {
      title: form.title,
      summary: form.summary,
      body: form.body
        .split(/\n\s*\n/)
        .map((x) => x.trim())
        .filter(Boolean),
      category: form.category,
      model: form.model,
      periodDays: form.periodDays,
      quorumPct: form.quorumPct,
      thresholdPct: form.thresholdPct,
      action: action(form),
    }
    void tx.run(
      {
        title: app.summaries.publish,
        rows: [
          { label: app.summaries.publishRows.title, value: form.title.trim() },
          { label: app.summaries.publishRows.model, value: terms.models[form.model] },
          { label: app.summaries.publishRows.action, value: actionLabel(form) },
        ],
        movesValue: false,
      },
      (hash) => {
        const id = createProposal(draft, hash)
        toast.success(app.toasts.published)
        router.push(href(locale, `/app/proposals/${id}`))
      }
    )
  }

  const total = totalPower(demo.members, form.model)
  const needed = Math.ceil((total * form.quorumPct) / 100)
  const errorList = Object.values(errors).filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{c.title}</h1>
        <p className="mt-2 max-w-[68ch] text-muted-foreground">{c.intro}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-bold">{c.templates.title}</span>
        {c.templates.items.map((tpl) => (
          <Button
            key={tpl.key}
            variant="outline"
            size="sm"
            onClick={() => {
              const next = { ...blank(), ...TEMPLATES[locale][tpl.key] }
              setForm(next)
              if (tried) setErrors(validate(next))
            }}
          >
            {tpl.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setForm(blank())
            setErrors({})
            setTried(false)
          }}
        >
          {c.templates.blank}
        </Button>
      </div>

      {errorList.length > 0 ? (
        <div id="composer-errors" tabIndex={-1} role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm outline-none">
          <p className="font-bold text-destructive">{c.errorsTitle}</p>
          <ul className="mt-2 list-disc pl-5">
            {errorList.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <form
          className="flex min-w-0 flex-col gap-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <fieldset disabled={tx.busy} className="contents">
            <Card className="flex flex-col gap-5">
              <h2 className="text-lg font-bold">{c.sections.about}</h2>
              <Field id="title" label={f.title} hint={f.titleHint} error={errors.title}>
                <Input id="title" value={form.title} maxLength={90} onChange={(e) => set("title", e.target.value)} aria-invalid={!!errors.title} />
              </Field>
              <Field id="summary" label={f.summary} error={errors.summary}>
                <Input id="summary" value={form.summary} maxLength={140} onChange={(e) => set("summary", e.target.value)} aria-invalid={!!errors.summary} />
              </Field>
              <Field id="category" label={f.category}>
                <select id="category" value={form.category} onChange={(e) => set("category", e.target.value as Category)} className={selectCls}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {terms.categories[cat]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="body" label={f.body} hint={f.bodyHint} error={errors.body}>
                <Textarea id="body" rows={6} value={form.body} onChange={(e) => set("body", e.target.value)} aria-invalid={!!errors.body} />
              </Field>
            </Card>

            <Card className="flex flex-col gap-5">
              <h2 className="text-lg font-bold" id="action-legend">
                {c.sections.action}
              </h2>
              <div role="radiogroup" aria-labelledby="action-legend" className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["none", f.actionNone, f.actionNoneHint, MegaphoneIcon],
                    ["transfer", f.actionTransfer, f.actionTransferHint, BanknoteIcon],
                    ["rule", f.actionRule, f.actionRuleHint, SlidersHorizontalIcon],
                  ] as const
                ).map(([kind, label, hint, Icon]) => (
                  <label
                    key={kind}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-2xl border p-3.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      form.action === kind ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
                    )}
                  >
                    <input type="radio" name="action" value={kind} checked={form.action === kind} onChange={() => set("action", kind)} className="sr-only" />
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Icon className="size-4 text-primary-ink" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{hint}</span>
                  </label>
                ))}
              </div>

              {form.action === "transfer" ? (
                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                  <Field id="amount" label={f.amount} hint={t(f.available, { amount: fmtNumber(locale, demo.space.treasury[form.token]), token: form.token })} error={errors.amount}>
                    <Input id="amount" inputMode="numeric" value={form.amount} onChange={(e) => set("amount", e.target.value)} aria-invalid={!!errors.amount} />
                  </Field>
                  <Field id="token" label={f.token}>
                    <select id="token" value={form.token} onChange={(e) => set("token", e.target.value as TreasuryToken)} className={selectCls}>
                      <option value="tUSDC">tUSDC</option>
                      <option value="tETH">tETH</option>
                    </select>
                  </Field>
                  <Field id="toLabel" label={f.recipientLabel} error={errors.toLabel} className="sm:col-span-2">
                    <Input id="toLabel" value={form.toLabel} maxLength={60} onChange={(e) => set("toLabel", e.target.value)} aria-invalid={!!errors.toLabel} />
                  </Field>
                  <Field id="to" label={f.recipient} error={errors.to} className="sm:col-span-2">
                    <Input
                      id="to"
                      value={form.to}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="0x…"
                      onChange={(e) => set("to", e.target.value)}
                      aria-invalid={!!errors.to}
                      className="font-mono"
                    />
                  </Field>
                  <Disclaimer text={disclaimer} className="sm:col-span-2" />
                </div>
              ) : null}

              {form.action === "rule" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="ruleParam" label={f.ruleParam}>
                    <select id="ruleParam" value={form.ruleParam} onChange={(e) => set("ruleParam", e.target.value as "quorum" | "period")} className={selectCls}>
                      <option value="quorum">{f.ruleQuorum}</option>
                      <option value="period">{f.rulePeriod}</option>
                    </select>
                  </Field>
                  <Field id="ruleValue" label={f.ruleValue} error={errors.ruleValue}>
                    <Input id="ruleValue" inputMode="numeric" value={form.ruleValue} onChange={(e) => set("ruleValue", e.target.value)} aria-invalid={!!errors.ruleValue} />
                  </Field>
                </div>
              ) : null}
            </Card>

            <Card className="flex flex-col gap-5">
              <h2 className="text-lg font-bold" id="rules-legend">
                {c.sections.rules}
              </h2>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold" id="model-label">
                  {f.model}
                </span>
                <div role="radiogroup" aria-labelledby="model-label" className="flex flex-wrap gap-2">
                  {MODELS.map((m) => (
                    <label
                      key={m}
                      className={cn(
                        "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                        form.model === m ? "border-foreground bg-foreground text-background" : "border-input hover:bg-muted"
                      )}
                    >
                      <input type="radio" name="model" value={m} checked={form.model === m} onChange={() => set("model", m)} className="sr-only" />
                      {terms.modelsShort[m]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="period" label={f.period}>
                  <select id="period" value={form.periodDays} onChange={(e) => set("periodDays", Number(e.target.value))} className={selectCls}>
                    {PERIODS.map((d) => (
                      <option key={d} value={d}>
                        {t(f.periodValue, { n: d })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="quorum" label={f.quorum}>
                  <select id="quorum" value={form.quorumPct} onChange={(e) => set("quorumPct", Number(e.target.value))} className={selectCls}>
                    {QUORUMS.map((q) => (
                      <option key={q} value={q}>
                        {fmtPct(locale, q / 100, 0)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="threshold" label={f.threshold} className="sm:col-span-2">
                  <select id="threshold" value={form.thresholdPct} onChange={(e) => set("thresholdPct", Number(e.target.value))} className={selectCls}>
                    <option value={50}>{f.thresholdSimple}</option>
                    <option value={66}>{f.thresholdSuper}</option>
                  </select>
                </Field>
              </div>
            </Card>
          </fieldset>
        </form>

        <aside aria-labelledby="preview-title" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="flex flex-col gap-3 border-dashed">
            <p id="preview-title" className="eyebrow text-primary-ink">
              {c.preview.title}
            </p>
            <span className="text-xs font-semibold text-muted-foreground">
              {terms.categories[form.category]} · {terms.modelsShort[form.model]}
            </span>
            <p className={cn("text-xl font-extrabold break-words", !form.title && "text-muted-foreground")}>{form.title || c.preview.untitled}</p>
            <p className="text-sm break-words text-muted-foreground">{form.summary || c.preview.noSummary}</p>
            <p className="rounded-xl border bg-muted/50 p-3 text-sm">
              <strong>{app.proposal.action}: </strong>
              {actionLabel(form)}
            </p>
            <p className="text-sm">
              {t(app.proposal.plain, {
                needed: fmtPower(locale, needed, form.model, terms),
                pct: form.thresholdPct,
              })}
            </p>
          </Card>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={submit} disabled={tx.busy}>
              {tx.busy ? c.pending : c.submit}
            </Button>
            <TxFeedback state={tx.state} pendingLabel={c.pending} onRetry={submit} onDismiss={tx.reset} />
          </div>
        </aside>
      </div>
    </div>
  )
}

const selectCls =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-bold">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
