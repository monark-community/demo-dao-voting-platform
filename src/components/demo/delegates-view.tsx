"use client"

import { CheckIcon, UndoIcon, UserRoundIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { DELEGATE_KEYS, addressOf } from "@/lib/demo/seed"
import { setDelegate } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { delegatedTo } from "@/lib/demo/tally"
import type { DemoState, Member } from "@/lib/demo/types"
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

export function DelegatesView() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const d = app.delegates
  const tx = useTx()
  const [target, setTarget] = useState<string | null>(null)
  if (!demo) return null
  const me = demo.members.find((m) => m.address === demo.wallet.address)
  if (!me) return null
  const delegates = DELEGATE_KEYS.map((k) => demo.members.find((m) => m.address === addressOf(k))).filter((m): m is Member => !!m)
  const current = me.delegate ? demo.members.find((m) => m.address === me.delegate) : undefined
  const n = (x: number) => fmtNumber(locale, x)

  const run = (to: Member | null) => {
    setTarget(to?.address ?? null)
    void tx.run(
      to
        ? {
            title: t(app.summaries.delegate, { name: to.name }),
            rows: [
              { label: app.summaries.delegateRows.to, value: to.name },
              { label: app.summaries.delegateRows.amount, value: `${n(me.balance)} tGOV` },
            ],
            movesValue: false,
          }
        : { title: app.summaries.undelegate, rows: [{ label: app.summaries.delegateRows.amount, value: `${n(me.balance)} tGOV` }], movesValue: false },
      // No toast: the power diagram and the "Delegated to …" line confirm it.
      (hash) => setDelegate(to?.address ?? null, hash)
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
        <h2 id="your-power" className="text-lg font-bold">
          {d.yourPower}
        </h2>
        <PowerFlow me={me} delegate={current} label={d.diagramLabel} amount={`${n(me.balance)} tGOV`} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{current ? t(d.current, { name: current.name }) : d.self}</p>
          {current ? (
            <Button variant="outline" onClick={() => run(null)} disabled={tx.busy}>
              <UndoIcon aria-hidden="true" />
              {d.undelegate}
            </Button>
          ) : null}
        </div>
        <TxFeedback state={tx.state} pendingLabel={d.pending} confirmedLabel={target ? d.done : d.doneBack} onRetry={() => run(delegates.find((x) => x.address === target) ?? null)} onDismiss={tx.reset} />
      </Card>

      <ul className="grid gap-4 md:grid-cols-2">
        {delegates.map((m) => {
          const received = delegatedTo(demo.members, m.address)
          const mine = me.delegate === m.address
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
                {!mine && me.address !== m.address ? (
                  <Button onClick={() => run(m)} disabled={tx.busy} variant="outline">
                    <UserRoundIcon aria-hidden="true" />
                    {t(d.delegate, { amount: n(me.balance) })}
                  </Button>
                ) : null}
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Signature moment: a line carries your power to your delegate, or curls back to you. */
function PowerFlow({ me, delegate, label, amount }: { me: Member; delegate?: Member; label: string; amount: string }) {
  return (
    <figure aria-label={label} className="relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Avatar address={me.address} size={48} className="ring-2 ring-primary ring-offset-2 ring-offset-card" />
          <span className="text-xs font-bold">{me.name}</span>
        </div>
        <div className="relative h-14 min-w-0 flex-1" aria-hidden="true">
          {/* The SVG stretches to fit (non-uniform scale), so the end dot is an
              HTML element: inside the SVG it would squash into an ellipse. */}
          <svg viewBox="0 0 300 60" className="size-full" preserveAspectRatio="none">
            {delegate ? (
              <path key={delegate.address} d="M 6 30 C 100 30, 200 30, 294 30" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" className="gc-draw" style={{ ["--gc-len" as string]: 300 }} />
            ) : (
              <path key="self" d="M 6 30 L 294 30" fill="none" stroke="var(--input)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 7" className="gc-settle" />
            )}
          </svg>
          {delegate ? <span key={delegate.address} className="gc-settle absolute top-1/2 right-[2%] size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" /> : null}
        </div>
        <div className="flex w-24 flex-col items-center gap-1.5 text-center">
          {delegate ? (
            <>
              <Avatar address={delegate.address} size={48} className="gc-settle" />
              <span className="text-xs font-bold">{delegate.name}</span>
            </>
          ) : (
            <>
              <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-dashed border-input text-muted-foreground">
                <UserRoundIcon className="size-5" aria-hidden="true" />
              </span>
            </>
          )}
        </div>
      </div>
      <figcaption className="mt-1 text-center text-sm font-extrabold tabular-nums">{amount}</figcaption>
    </figure>
  )
}
