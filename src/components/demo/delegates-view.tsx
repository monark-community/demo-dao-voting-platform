"use client"

import { CheckIcon, PenLineIcon, UndoIcon, UserRoundIcon, XIcon } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { DELEGATE_KEYS, addressOf } from "@/lib/demo/seed"
import { setDelegations } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { delegatedTo } from "@/lib/demo/tally"
import type { DemoState, Delegation, Member } from "@/lib/demo/types"
import { fmtNumber, fmtPctNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Avatar, Card } from "./bits"
import { TxFeedback } from "./tx-feedback"

/** A number that counts to its new value (ease-out, ~600 ms); instant with reduced motion. */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    if (start === value) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const k = reduce ? 1 : Math.min(1, (now - t0) / 600)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(start + (value - start) * eased))
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      from.current = value
    }
  }, [value])
  return <>{format(shown)}</>
}

function participation(demo: DemoState, address: string): number {
  const counted = demo.proposals.filter((p) => !p.cancelled)
  if (counted.length === 0) return 0
  return counted.filter((p) => p.ballots.some((b) => b.voter === address)).length / counted.length
}

/** Address → tGOV lent. */
type Shares = Record<string, number>

const toShares = (delegations: Delegation[]): Shares => Object.fromEntries(delegations.map((d) => [d.to, d.amount]))

export function DelegatesView() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const d = app.delegates
  const tx = useTx()
  // Unsigned edits to the split; null while it matches what's on-chain.
  const [draft, setDraft] = useState<Shares | null>(null)
  const [last, setLast] = useState<Delegation[]>([])
  if (!demo) return null
  const me = demo.members.find((m) => m.address === demo.wallet.address)
  if (!me) return null
  const delegates = DELEGATE_KEYS.map((k) => demo.members.find((m) => m.address === addressOf(k))).filter((m): m is Member => !!m)
  const n = (x: number) => fmtNumber(locale, x)

  const committed = toShares(me.delegations)
  const shares = draft ?? committed
  const shareOf = (address: string) => shares[address] ?? 0
  const lent = Object.values(shares).reduce((sum, x) => sum + x, 0)
  const kept = Math.max(0, me.balance - lent)
  const dirty = draft !== null && [...new Set([...Object.keys(committed), ...Object.keys(draft)])].some((a) => (committed[a] ?? 0) !== (draft[a] ?? 0))
  // In delegate order, so lines and summary rows don't reshuffle.
  const splits: Delegation[] = delegates.map((m) => ({ to: m.address, amount: shareOf(m.address) })).filter((x) => x.amount > 0)

  const setShare = (address: string, value: number) => {
    const max = shareOf(address) + kept
    const next = Math.max(0, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)))
    setDraft({ ...shares, [address]: next })
  }

  const run = (next: Delegation[]) => {
    setLast(next)
    const nameOf = (a: string) => demo.members.find((m) => m.address === a)?.name ?? a
    const keep = me.balance - next.reduce((sum, x) => sum + x.amount, 0)
    void tx.run(
      {
        title: next.length > 0 ? app.summaries.delegate : app.summaries.undelegate,
        rows: [
          ...next.map((x) => ({ label: nameOf(x.to), value: t(app.summaries.delegateRows.amount, { amount: n(x.amount) }) })),
          { label: app.summaries.delegateRows.kept, value: t(app.summaries.delegateRows.amount, { amount: n(keep) }) },
        ],
        movesValue: false,
      },
      // No toast: the power diagram and the split line confirm it.
      (hash) => {
        setDelegations(next, hash)
        setDraft(null)
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{d.title}</h1>
          <InfoTip label={d.tip}>{d.intro}</InfoTip>
        </div>
      </div>

      <Card aria-labelledby="your-power" className="flex flex-col gap-5">
        <div className="flex items-center gap-1">
          <h2 id="your-power" className="text-lg font-bold">
            {d.yourPower}
          </h2>
          <InfoTip label={d.onchainTip}>{d.onchain}</InfoTip>
        </div>
        <PowerFlow
          me={me}
          splits={splits.map((x) => ({ member: delegates.find((m) => m.address === x.to)!, amount: x.amount }))}
          kept={kept}
          preview={dirty}
          label={d.diagramLabel}
          keptLabel={d.kept}
          n={n}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-semibold tabular-nums">{lent > 0 ? t(d.split, { lent: n(lent), kept: n(kept) }) : d.self}</p>
            {dirty ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary px-2.5 py-0.5 text-xs font-bold text-primary-ink">
                <PenLineIcon className="size-3" aria-hidden="true" />
                {d.preview}
              </span>
            ) : null}
          </div>
          {dirty ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={tx.busy}>
                {d.discard}
              </Button>
              <Button onClick={() => run(splits)} disabled={tx.busy}>
                <CheckIcon aria-hidden="true" />
                {d.sign}
              </Button>
            </div>
          ) : me.delegations.length > 0 ? (
            <Button variant="outline" onClick={() => run([])} disabled={tx.busy}>
              <UndoIcon aria-hidden="true" />
              {d.undelegate}
            </Button>
          ) : null}
        </div>
        <TxFeedback state={tx.state} pendingLabel={d.pending} confirmedLabel={last.length > 0 ? d.done : d.doneBack} onRetry={() => run(last)} onDismiss={tx.reset} />
      </Card>

      <ul className="grid gap-4 md:grid-cols-2">
        {delegates.map((m) => {
          const received = delegatedTo(demo.members, m.address)
          const mine = (committed[m.address] ?? 0) > 0
          return (
            <li key={m.address}>
              <article className={cn("flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors sm:p-6", mine && "border-primary")}>
                <div className="flex items-center gap-3">
                  <Avatar address={m.address} size={44} />
                  <div className="min-w-0">
                    <h3 className="font-bold">{m.name}</h3>
                    {m.title ? <p className="text-xs text-muted-foreground">{m.title}</p> : null}
                  </div>
                  {mine ? (
                    <span className="gc-settle ml-auto inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs font-bold">
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      {d.yourDelegate}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm">“{m.pitch}”</p>
                <div className="mt-auto flex flex-wrap justify-between gap-x-4 gap-y-1 border-t pt-4 text-sm">
                  <p className={cn("font-extrabold tabular-nums", mine && "text-primary-ink")}>
                    <CountUp value={received} format={(x) => t(d.received, { amount: n(x) })} />
                  </p>
                  <p className="text-muted-foreground">{t(d.participation, { pct: fmtPctNumber(locale, participation(demo, m.address), 0) })}</p>
                </div>
                {me.address !== m.address ? (
                  <ShareControl
                    name={m.name}
                    value={shareOf(m.address)}
                    committed={committed[m.address] ?? 0}
                    balance={me.balance}
                    available={shareOf(m.address) + kept}
                    disabled={tx.busy}
                    onChange={(v) => setShare(m.address, v)}
                  />
                ) : null}
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** How much of your tGOV one delegate holds: slider, exact amount and quick presets. */
function ShareControl({
  name,
  value,
  committed,
  balance,
  available,
  disabled,
  onChange,
}: {
  name: string
  value: number
  committed: number
  balance: number
  available: number
  disabled: boolean
  onChange: (v: number) => void
}) {
  const { app, locale } = useAppCopy()
  const d = app.delegates
  const id = useId()
  const n = (x: number) => fmtNumber(locale, x)
  const presets = [
    { label: d.presets.quarter, value: Math.round(balance * 0.25) },
    { label: d.presets.half, value: Math.round(balance * 0.5) },
    { label: d.presets.max, value: available },
  ]
  const label = t(d.shareLabel, { name })
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-amount`} className="text-sm font-bold">
          {d.share}
        </label>
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <input
            id={`${id}-amount`}
            type="number"
            inputMode="numeric"
            min={0}
            max={available}
            step={1}
            value={value}
            disabled={disabled}
            aria-label={label}
            onChange={(e) => onChange(e.target.valueAsNumber)}
            className="h-9 w-24 rounded-md border border-input bg-card px-2 text-right font-bold tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <span className="text-muted-foreground">tGOV</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={balance}
        step={10}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={`${n(value)} tGOV`}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="h-6 w-full cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <Button
            key={p.label}
            type="button"
            size="xs"
            variant="outline"
            disabled={disabled || available <= 0}
            aria-label={t(d.presetLabel, { preset: p.label, name })}
            onClick={() => onChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
        {value > 0 ? (
          <Button type="button" size="xs" variant="ghost" disabled={disabled} onClick={() => onChange(0)} className="ml-auto">
            <XIcon aria-hidden="true" />
            {d.remove}
          </Button>
        ) : null}
      </div>
      {committed > 0 ? <p className="text-xs font-semibold text-primary-ink">{t(d.youLend, { amount: n(committed) })}</p> : null}
    </div>
  )
}

const ROW = 56
const VB_ROW = 60

/**
 * Signature moment: lines fan out from you to each delegate, as thick as the
 * share they hold, and a dashed line marks what you keep. The SVG stretches to
 * fit (non-uniform scale), so end dots are HTML: inside the SVG they'd squash.
 */
function PowerFlow({
  me,
  splits,
  kept,
  preview,
  label,
  keptLabel,
  n,
}: {
  me: Member
  splits: { member: Member; amount: number }[]
  kept: number
  preview: boolean
  label: string
  keptLabel: string
  n: (x: number) => string
}) {
  const rows = splits.length + (kept > 0 || splits.length === 0 ? 1 : 0)
  const h = rows * VB_ROW
  const yOf = (i: number) => VB_ROW / 2 + i * VB_ROW
  const pathTo = (i: number) => `M 6 ${h / 2} C 150 ${h / 2}, 150 ${yOf(i)}, 294 ${yOf(i)}`
  const weight = (amount: number) => 1.5 + 4.5 * (amount / Math.max(1, me.balance))

  return (
    <figure aria-label={label} className="flex items-center gap-3">
      <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
        <Avatar address={me.address} size={48} className="ring-2 ring-primary ring-offset-2 ring-offset-card" />
        <span className="text-xs font-bold">{me.name}</span>
        <span className="text-xs font-extrabold tabular-nums">{n(me.balance)} tGOV</span>
      </div>
      <div className="relative min-w-0 flex-1" style={{ height: rows * ROW }} aria-hidden="true">
        <svg viewBox={`0 0 300 ${h}`} className="size-full" preserveAspectRatio="none">
          {splits.map((s, i) => (
            <path
              key={s.member.address}
              d={pathTo(i)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={weight(s.amount)}
              strokeLinecap="round"
              opacity={preview ? 0.55 : 1}
              className="gc-draw transition-[stroke-width,opacity] duration-200"
              style={{ ["--gc-len" as string]: 400 }}
            />
          ))}
          {rows > splits.length ? (
            <path key="kept" d={pathTo(splits.length)} fill="none" stroke="var(--input)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 7" className="gc-settle" />
          ) : null}
        </svg>
        {splits.map((s, i) => (
          <span
            key={s.member.address}
            className="gc-settle absolute right-[2%] size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ top: `${((i + 0.5) / rows) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex w-32 shrink-0 flex-col sm:w-40">
        {splits.map((s) => (
          <li key={s.member.address} className="gc-settle flex items-center gap-2" style={{ height: ROW }}>
            <Avatar address={s.member.address} size={32} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold">{s.member.name}</span>
              <span className="block text-xs font-extrabold text-primary-ink tabular-nums">{n(s.amount)} tGOV</span>
            </span>
          </li>
        ))}
        {rows > splits.length ? (
          <li className="flex items-center gap-2" style={{ height: ROW }}>
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-input text-muted-foreground">
              <UserRoundIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold">{keptLabel}</span>
              <span className="block text-xs font-extrabold tabular-nums">{n(kept)} tGOV</span>
            </span>
          </li>
        ) : null}
      </ul>
    </figure>
  )
}
