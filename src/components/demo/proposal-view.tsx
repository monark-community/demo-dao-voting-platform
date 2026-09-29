"use client"

import {
  ArrowLeftIcon,
  BanknoteIcon,
  CalendarClockIcon,
  FastForwardIcon,
  MegaphoneIcon,
  ScaleIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { fmtPower, liveOutcome, OutcomeChip, TallyView } from "@/components/diagrams/tally-view"
import { Button } from "@/components/ui/button"
import { TxStatus } from "@/components/ui/tx-status"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { cancelProposal, endVotingNow, executeProposal } from "@/lib/demo/ops"
import { canCancel } from "@/lib/demo/permissions"
import { getDemo, useDemo, useNow } from "@/lib/demo/store"
import { outcomeOf, reweigh, statusOf, tally } from "@/lib/demo/tally"
import type { Choice, DemoState, Proposal, VotingModel } from "@/lib/demo/types"
import { fmtDate, fmtNumber, fmtPctNumber, fmtRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Avatar, Card, ChoicePill, StatusBadge, useNameOf } from "./bits"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"
import { VotePanel } from "./vote-panel"

export function actionText(p: Proposal, copy: ReturnType<typeof useAppCopy>): string {
  const a = copy.app.proposal.actions
  const act = p.action
  if (act.kind === "transfer") return t(a.transfer, { amount: fmtNumber(copy.locale, act.amount), token: act.token, to: act.toLabel })
  if (act.kind === "rule") return t(act.param === "quorum" ? a.rulequorum : a.ruleperiod, { value: act.value })
  return a.none
}

export function ProposalView({ id }: { id: string }) {
  const demo = useDemo()
  const now = useNow()
  const copy = useAppCopy()
  const { app, locale } = copy
  const [pending, setPending] = useState<{ choice: Choice; weight: number } | null>(null)
  if (!demo) return null
  const p = demo.proposals.find((x) => x.id === id)
  if (!p) {
    return (
      <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center py-12 text-center">
        <h1 className="text-3xl font-extrabold tracking-display">{app.proposal.notFoundTitle}</h1>
        <p className="mt-3 text-muted-foreground">{app.proposal.notFoundBody}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={href(locale, "/app")}>{app.proposal.back}</Link>
        </Button>
      </section>
    )
  }
  return <ProposalBody p={p} demo={demo} now={now} pending={pending} setPending={setPending} />
}

function ProposalBody({
  p,
  demo,
  now,
  pending,
  setPending,
}: {
  p: Proposal
  demo: DemoState
  now: number
  pending: { choice: Choice; weight: number } | null
  setPending: (v: { choice: Choice; weight: number } | null) => void
}) {
  const copy = useAppCopy()
  const { app, terms, locale } = copy
  const pr = app.proposal
  const nameOf = useNameOf(demo)
  const status = statusOf(p, demo.members, now)
  const tl = tally(p, demo.members)
  const author = demo.members.find((m) => m.address === p.author)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={href(locale, "/app")} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {pr.back}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs font-semibold text-muted-foreground">
            {terms.categories[p.category]} · {terms.modelsShort[p.model]}
          </span>
        </div>
        <h1 className="mt-3 max-w-[30ch] text-3xl font-extrabold tracking-display sm:text-4xl">{p.title}</h1>
        <p className="mt-2 max-w-[68ch] text-lg text-muted-foreground">{p.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Avatar address={p.author} size={24} />
            {t(pr.by, { name: nameOf(p.author) })}
            {author?.title ? <span className="text-xs">· {author.title}</span> : null}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClockIcon className="size-4" aria-hidden="true" />
            {status === "active" ? t(pr.endsIn, { time: fmtRelative(locale, p.endsAt, now) }) : t(pr.endedAt, { time: fmtRelative(locale, p.endsAt, now) })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        {/* Tally (first on every screen) */}
        <Card aria-labelledby="tally-title" className="lg:col-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tally-title" className="text-lg font-bold">
              {pr.tally.title}
            </h2>
            {status === "active" ? (
              <OutcomeChip key={liveOutcome(tl)} outcome={liveOutcome(tl)} label={terms.live[liveOutcome(tl)]} />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">{t(pr.tally.ballots, { n: tl.ballots })}</span>
            )}
          </div>
          <TallyView className="mt-5" tally={tl} model={p.model} locale={locale} labels={{ ...terms, tally: pr.tally }} pending={pending} />
          {status !== "active" ? <ClosedNote p={p} demo={demo} status={status} /> : null}
        </Card>

        {/* Side: vote, execute, manage. Right after the tally on mobile, sticky on desktop. */}
        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <VotePanel proposal={p} status={status} onPending={setPending} />
            <ExecutePanel p={p} demo={demo} status={status} />
            {status === "active" ? <ManagePanel p={p} demo={demo} /> : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1">
          <ComparePanel p={p} demo={demo} />

          <Card aria-labelledby="reasoning-title">
            <h2 id="reasoning-title" className="text-lg font-bold">
              {pr.reasoning}
            </h2>
            <div className="mt-3 flex max-w-[68ch] flex-col gap-3">
              {p.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card aria-labelledby="action-title">
              <h2 id="action-title" className="flex items-center gap-2 text-lg font-bold">
                {p.action.kind === "transfer" ? (
                  <BanknoteIcon className="size-5 text-primary" aria-hidden="true" />
                ) : p.action.kind === "rule" ? (
                  <SlidersHorizontalIcon className="size-5 text-primary" aria-hidden="true" />
                ) : (
                  <MegaphoneIcon className="size-5 text-primary" aria-hidden="true" />
                )}
                {pr.action}
              </h2>
              <p className="mt-3">{actionText(p, copy)}</p>
              {p.action.kind === "transfer" ? (
                <p className="mt-2 font-mono text-xs break-all text-muted-foreground">{p.action.to}</p>
              ) : null}
            </Card>
            <RulesCard p={p} demo={demo} />
          </div>

          <VotesList p={p} demo={demo} now={now} />
          <Timeline p={p} demo={demo} now={now} />
        </div>
      </div>
    </div>
  )
}

function RulesCard({ p, demo }: { p: Proposal; demo: DemoState }) {
  const { app, terms, locale } = useAppCopy()
  const r = app.proposal.rulesRows
  const tl = tally(p, demo.members)
  return (
    <Card aria-labelledby="rules-title">
      <h2 id="rules-title" className="flex items-center gap-2 text-lg font-bold">
        <ScaleIcon className="size-5 text-primary" aria-hidden="true" />
        {app.proposal.rules}
      </h2>
      <dl className="mt-3 flex flex-col gap-2.5 text-sm">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{r.model}</dt>
          <dd className="font-semibold">{terms.models[p.model]}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{r.quorum}</dt>
          <dd className="font-semibold">
            {p.model === "wallet"
              ? t(r.quorumValueWallet, { pct: p.quorumPct, needed: tl.quorumNeeded })
              : t(r.quorumValue, { pct: p.quorumPct, needed: fmtPower(locale, tl.quorumNeeded, p.model, terms) })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{r.threshold}</dt>
          <dd className="font-semibold">{t(r.thresholdValue, { pct: p.thresholdPct })}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{r.period}</dt>
          <dd className="font-semibold">{t(r.periodValue, { start: fmtDate(locale, p.createdAt), end: fmtDate(locale, p.endsAt, true) })}</dd>
        </div>
      </dl>
    </Card>
  )
}

function ClosedNote({ p, demo, status }: { p: Proposal; demo: DemoState; status: ReturnType<typeof statusOf> }) {
  const { app, terms, locale } = useAppCopy()
  const nameOf = useNameOf(demo)
  const n = app.proposal.closedNote
  const tl = tally(p, demo.members)
  const vars = {
    pct: fmtPctNumber(locale, tl.forShare, 1),
    participation: fmtPower(locale, tl.participation, p.model, terms),
    needed: fmtPower(locale, tl.quorumNeeded, p.model, terms),
    threshold: p.thresholdPct,
    name: nameOf(p.cancelled?.by),
  }
  const text = status === "executed" ? `${t(n.passed, vars)} ${n.executed}` : t(n[status as "passed" | "defeated" | "noQuorum" | "cancelled"], vars)
  return <p className="mt-5 rounded-xl border bg-muted/50 p-3 text-sm">{text}</p>
}

function ComparePanel({ p, demo }: { p: Proposal; demo: DemoState }) {
  const { app, terms, locale } = useAppCopy()
  const c = app.proposal.compare
  const others = (["wallet", "token", "delegated"] as VotingModel[]).filter((m) => m !== p.model)
  const [model, setModel] = useState<VotingModel>(others[0] ?? "wallet")
  if (p.ballots.length === 0) return null
  const official = tally(p, demo.members)
  const alt = reweigh(p, demo.members, model)
  const officialOutcome = outcomeOf(official)
  const altOutcome = outcomeOf(alt)
  const outcomeLabel = { passed: terms.status.passed, defeated: terms.status.defeated, noQuorum: terms.status.noQuorum }[altOutcome]

  return (
    <Card aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-lg font-bold">
        {c.title}
      </h2>
      <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">{c.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={c.title}>
        <span className="inline-flex h-10 items-center rounded-full border border-dashed px-4 text-sm font-semibold text-muted-foreground">
          {c.official}: {terms.modelsShort[p.model]}
        </span>
        {others.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={model === m}
            onClick={() => setModel(m)}
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-4 text-sm font-bold transition-colors duration-150",
              model === m ? "border-foreground bg-foreground text-background" : "border-input hover:bg-muted"
            )}
          >
            {terms.modelsShort[m]}
          </button>
        ))}
      </div>
      <TallyView className="mt-5" tally={alt} model={model} locale={locale} labels={{ ...terms, tally: app.proposal.tally }} compact />
      <p key={`${model}-${altOutcome}`} className="gc-settle mt-4 text-sm" aria-live="polite">
        <strong>{t(c.would, { outcome: outcomeLabel.toLowerCase() })}</strong>{" "}
        <span className="text-muted-foreground">{altOutcome === officialOutcome ? c.same : c.different}</span>
      </p>
    </Card>
  )
}

function VotesList({ p, demo, now }: { p: Proposal; demo: DemoState; now: number }) {
  const { app, terms, locale } = useAppCopy()
  const v = app.proposal.votes
  const nameOf = useNameOf(demo)
  const [all, setAll] = useState(false)
  const me = demo.wallet.address
  const sorted = [...p.ballots].sort((a, b) => (a.voter === me ? -1 : b.voter === me ? 1 : b.at - a.at))
  const shown = all ? sorted : sorted.slice(0, 6)
  return (
    <Card aria-labelledby="votes-title">
      <h2 id="votes-title" className="text-lg font-bold">
        {v.title} <span className="text-sm font-semibold text-muted-foreground">({p.ballots.length})</span>
      </h2>
      {p.ballots.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{v.empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y">
          {shown.map((b) => (
            <li key={b.hash} className={cn("gc-settle flex gap-3 py-3", b.voter === me && "rounded-xl bg-secondary/60 px-3")}>
              <Avatar address={b.voter} size={32} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold">{nameOf(b.voter)}</span>
                  <ChoicePill choice={b.choice} label={terms.choices[b.choice]} />
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">{fmtPower(locale, b.weight, p.model, terms)}</span>
                </div>
                {b.reason ? <p className="mt-1 text-sm">{b.reason}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(locale, b.at, now)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sorted.length > 6 ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setAll((x) => !x)}>
          {all ? v.showLess : t(v.showAll, { n: sorted.length })}
        </Button>
      ) : null}
    </Card>
  )
}

function Timeline({ p, demo, now }: { p: Proposal; demo: DemoState; now: number }) {
  const { app, locale } = useAppCopy()
  const tl = app.proposal.timeline
  const nameOf = useNameOf(demo)
  const events: { key: string; label: string; at: number; hash?: string; who?: string }[] = [
    { key: "created", label: tl.created, at: p.createdAt, hash: p.createHash, who: nameOf(p.author) },
  ]
  if (p.cancelled) events.push({ key: "cancelled", label: tl.cancelled, at: p.cancelled.at, hash: p.cancelled.hash, who: nameOf(p.cancelled.by) })
  else if (p.endsAt <= now) events.push({ key: "closed", label: tl.closed, at: p.endsAt })
  if (p.executed) events.push({ key: "executed", label: tl.executed, at: p.executed.at, hash: p.executed.hash })
  return (
    <Card aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="text-lg font-bold">
        {tl.title}
      </h2>
      <ol className="relative mt-4 flex flex-col gap-5 border-l-2 border-primary/60 pl-5">
        {events.map((e) => (
          <li key={e.key} className="relative">
            <span aria-hidden="true" className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-primary bg-card" />
            <p className="font-bold">
              {e.label}
              {e.who ? <span className="font-normal text-muted-foreground"> · {e.who}</span> : null}
            </p>
            <p className="text-xs text-muted-foreground">{fmtDate(locale, e.at, true)}</p>
            {e.hash ? <TxStatus status="confirmed" hash={e.hash} label={tl.receipt} className="mt-2" /> : null}
          </li>
        ))}
      </ol>
    </Card>
  )
}

function ExecutePanel({ p, demo, status }: { p: Proposal; demo: DemoState; status: ReturnType<typeof statusOf> }) {
  const copy = useAppCopy()
  const { app, disclaimer, locale } = copy
  const e = app.proposal.execute
  const tx = useTx()
  if (status !== "passed" && !(status === "executed" && tx.state.phase === "confirmed")) return null
  if (p.action.kind === "none") {
    return (
      <Card>
        <h2 className="text-lg font-bold">{e.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{e.noAction}</p>
      </Card>
    )
  }
  const act = p.action
  const insufficient = act.kind === "transfer" && demo.space.treasury[act.token] < act.amount
  const run = () =>
    void tx.run(
      {
        title: app.summaries.execute,
        rows: [
          { label: app.summaries.executeRows.proposal, value: p.title },
          { label: app.summaries.executeRows.action, value: actionText(p, copy) },
        ],
        movesValue: act.kind === "transfer",
      },
      (hash) => {
        executeProposal(p.id, hash)
        toast.success(t(app.toasts.executed, { title: p.title }))
      }
    )
  return (
    <Card aria-labelledby="execute-title" className="border-primary/60">
      <h2 id="execute-title" className="text-lg font-bold">
        {e.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{e.body}</p>
      <p className="mt-3 rounded-xl border bg-muted/50 p-3 text-sm font-semibold">{actionText(p, copy)}</p>
      {insufficient && act.kind === "transfer" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {t(e.insufficient, { balance: fmtNumber(locale, demo.space.treasury[act.token]), token: act.token })}
        </p>
      ) : null}
      {status === "passed" ? (
        <Button size="lg" className="mt-4 w-full" onClick={run} disabled={tx.busy || insufficient}>
          {tx.busy ? e.pending : e.cta}
        </Button>
      ) : null}
      <TxFeedback className="mt-4" state={tx.state} confirmedLabel={e.done} onRetry={run} onDismiss={tx.reset} />
      {act.kind === "transfer" ? <Disclaimer text={disclaimer} className="mt-4" /> : null}
    </Card>
  )
}

function ManagePanel({ p, demo }: { p: Proposal; demo: DemoState }) {
  const { app, terms } = useAppCopy()
  const m = app.proposal.manage
  const tx = useTx()
  const [confirming, setConfirming] = useState(false)
  const me = demo.members.find((x) => x.address === demo.wallet.address)
  const allowed = canCancel(me, p)
  const cancel = () =>
    void tx.run({ title: app.summaries.cancel, rows: [{ label: app.summaries.executeRows.proposal, value: p.title }], movesValue: false }, (hash) => {
      cancelProposal(p.id, hash)
      setConfirming(false)
      toast.success(app.toasts.cancelled)
    })

  return (
    <Card aria-labelledby="manage-title" className="flex flex-col gap-4">
      <h2 id="manage-title" className="text-lg font-bold">
        {m.title}
      </h2>
      <div className="rounded-xl border border-dashed p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            endVotingNow(p.id)
            const after = getDemo()
            const closed = after?.proposals.find((x) => x.id === p.id)
            if (after && closed) toast(t(app.toasts.closed, { outcome: terms.status[outcomeOf(tally(closed, after.members))] }))
          }}
        >
          <FastForwardIcon aria-hidden="true" />
          {m.endNow}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">{m.endNowHint}</p>
      </div>
      {allowed ? (
        !confirming ? (
          <div>
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} disabled={tx.busy}>
              {m.cancel}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">{m.cancelHint}</p>
          </div>
        ) : (
          <div role="alertdialog" aria-labelledby="cancel-q" className="flex flex-col gap-3 rounded-xl border border-destructive/40 p-3">
            <p id="cancel-q" className="font-bold">
              {m.cancelConfirm}
            </p>
            <p className="text-xs text-muted-foreground">{m.cancelHint}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" onClick={cancel} disabled={tx.busy} autoFocus>
                {m.cancelDo}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={tx.busy}>
                {m.keep}
              </Button>
            </div>
          </div>
        )
      ) : (
        <p className="text-xs text-muted-foreground">{m.cancelNotAllowed}</p>
      )}
      <TxFeedback state={tx.state} onRetry={cancel} onDismiss={tx.reset} />
    </Card>
  )
}
