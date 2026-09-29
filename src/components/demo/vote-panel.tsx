"use client"

import { CheckIcon, InfoIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { useId, useState, type ReactNode } from "react"

import { fmtPower } from "@/components/diagrams/tally-view"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TxStatus } from "@/components/ui/tx-status"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { castVote } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { canVoteDirectly, tally, type ProposalStatus, votingPower } from "@/lib/demo/tally"
import type { Choice, Proposal } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Card, ChoicePill, useNameOf } from "./bits"
import { TxFeedback } from "./tx-feedback"

const MAX_REASON = 280
const CHOICES: Choice[] = ["for", "against", "abstain"]

/** Cast a ballot: choice, optional reason, simulated transaction; explains why you can't vote when you can't. */
export function VotePanel({
  proposal: p,
  status,
  onPending,
}: {
  proposal: Proposal
  status: ProposalStatus
  onPending: (v: { choice: Choice; weight: number } | null) => void
}) {
  const demo = useDemo()
  const { app, terms, locale } = useAppCopy()
  const v = app.vote
  const nameOf = useNameOf(demo)
  const tx = useTx()
  const [choice, setChoice] = useState<Choice | null>(null)
  const [reason, setReason] = useState("")
  const [missing, setMissing] = useState(false)
  const reasonId = useId()
  if (!demo) return null

  const me = demo.members.find((m) => m.address === demo.wallet.address)
  const mine = p.ballots.find((b) => b.voter === demo.wallet.address)
  const weight = votingPower(demo.members, demo.wallet.address, p.model)
  const pw = (n: number) => fmtPower(locale, n, p.model, terms)

  // Would your ballot alone flip the live outcome?
  const tl = tally(p, demo.members)
  const with_ = (c: Choice) => {
    const f = tl.for + (c === "for" ? weight : 0)
    const a = tl.against + (c === "against" ? weight : 0)
    const part = tl.participation + weight
    return part >= tl.quorumNeeded && f * 100 > p.thresholdPct * (f + a)
  }
  const pivotal = !mine && weight > 0 && with_("for") !== with_("against")

  const submit = async (c: Choice) => {
    onPending({ choice: c, weight })
    const ok = await tx.run(
      {
        title: t(app.summaries.vote, { choice: terms.choices[c].toLowerCase() }),
        rows: [
          { label: app.summaries.voteRows.proposal, value: p.title },
          { label: app.summaries.voteRows.choice, value: terms.choices[c] },
          { label: app.summaries.voteRows.weight, value: pw(weight) },
        ],
        movesValue: false,
      },
      (hash) => {
        onPending(null)
        // No toast: the panel turns into "You voted …" and the tally moves.
        castVote(p.id, c, reason.slice(0, MAX_REASON), hash)
      }
    )
    if (!ok) onPending(null)
  }

  let body: ReactNode
  if (mine) {
    body = (
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-2 font-bold">
          <CheckIcon className="size-5 text-success" aria-hidden="true" />
          {v.votedLead}
          <ChoicePill choice={mine.choice} label={terms.choices[mine.choice]} />
          <span className="text-sm font-semibold text-muted-foreground">{t(v.votedWeight, { weight: pw(mine.weight) })}</span>
        </p>
        {mine.reason ? <p className="rounded-xl bg-muted/60 p-3 text-sm">“{mine.reason}”</p> : null}
        <TxStatus status="confirmed" hash={mine.hash} label={v.confirmed} className="self-start" />
        <p className="text-xs text-muted-foreground">{v.final}</p>
      </div>
    )
  } else if (status !== "active") {
    body = <p className="text-sm text-muted-foreground">{v.closed}</p>
  } else if (me && !canVoteDirectly(me, p.model)) {
    body = (
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-sm">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden="true" />
          {t(v.delegatedAway, { name: nameOf(me.delegate) })}
        </p>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={href(locale, "/app/delegates")}>{v.takeBack}</Link>
        </Button>
      </div>
    )
  } else if (weight <= 0) {
    body = <p className="text-sm text-muted-foreground">{v.noPower}</p>
  } else {
    const busy = tx.busy
    body = (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!choice) {
            setMissing(true)
            return
          }
          void submit(choice)
        }}
      >
        <p className="text-sm text-muted-foreground">{t(v.weight, { weight: pw(weight) })}</p>
        <fieldset disabled={busy}>
          <legend className="sr-only">{v.title}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CHOICES.map((c) => {
              const active = choice === c
              return (
                <label
                  key={c}
                  className={cn(
                    "flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full border text-sm font-bold transition-colors duration-150 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    active && c === "for" && "border-primary bg-primary text-primary-foreground",
                    active && c === "against" && "border-foreground bg-foreground text-background",
                    active && c === "abstain" && "border-foreground bg-muted",
                    !active && "border-input hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name={`choice-${p.id}`}
                    value={c}
                    checked={active}
                    onChange={() => {
                      setChoice(c)
                      setMissing(false)
                    }}
                    className="sr-only"
                  />
                  {terms.choices[c]}
                </label>
              )
            })}
          </div>
        </fieldset>
        {missing ? (
          <p role="alert" className="text-sm text-destructive">
            {v.choose}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={reasonId} className="text-sm font-bold">
            {v.reason}
          </Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={MAX_REASON}
            rows={3}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
            aria-describedby={`${reasonId}-hint`}
          />
          <p id={`${reasonId}-hint`} className="text-xs text-muted-foreground">
            {t(v.reasonHint, { n: MAX_REASON - reason.length })}
          </p>
        </div>
        {pivotal ? (
          <p className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 p-2.5 text-xs font-semibold">
            <SparklesIcon className="size-4 shrink-0 text-primary-ink" aria-hidden="true" />
            {v.switchImpact}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? v.pending : v.cast}
        </Button>
        <TxFeedback state={tx.state} pendingLabel={v.pending} onRetry={choice ? () => void submit(choice) : undefined} onDismiss={tx.reset} />
      </form>
    )
  }

  return (
    <Card aria-labelledby="vote-title">
      <h2 id="vote-title" className="mb-4 text-lg font-bold">
        {v.title}
      </h2>
      {body}
    </Card>
  )
}
