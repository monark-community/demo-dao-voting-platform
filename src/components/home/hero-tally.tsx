"use client"

import { CalendarClockIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState, useSyncExternalStore } from "react"

import { liveOutcome, OutcomeChip, TallyView, type TallyLabels } from "@/components/diagrams/tally-view"
import type { Locale } from "@/i18n/config"
import type { Tally } from "@/lib/demo/tally"
import type { Choice } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

const TOTAL = 38_350
const QUORUM = Math.ceil(TOTAL * 0.2)
/** Ballots in arrival order; the first four are already in when the loop starts. */
const SCRIPT: { choice: Choice; weight: number }[] = [
  { choice: "for", weight: 2400 },
  { choice: "against", weight: 1800 },
  { choice: "for", weight: 1400 },
  { choice: "abstain", weight: 1100 },
  { choice: "for", weight: 2400 },
  { choice: "against", weight: 3100 },
  { choice: "for", weight: 4700 },
]
const START = 4

function tallyOf(count: number): Tally {
  const sum = { for: 0, against: 0, abstain: 0 }
  for (const b of SCRIPT.slice(0, count)) sum[b.choice] += b.weight
  const participation = sum.for + sum.against + sum.abstain
  const sided = sum.for + sum.against
  const quorumReached = participation >= QUORUM
  return {
    ...sum,
    participation,
    totalPower: TOTAL,
    quorumNeeded: QUORUM,
    quorumReached,
    forShare: sided ? sum.for / sided : 0,
    thresholdPct: 50,
    passing: quorumReached && sum.for * 2 > sided,
    ballots: count,
  }
}

const reducedQuery = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(reducedQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false)
}

/** Home hero: a live vote on a calm loop. Ballots arrive, quorum is reached, the outcome settles. */
export function HeroTally({
  locale,
  labels,
  copy,
}: {
  locale: Locale
  labels: TallyLabels
  copy: { label: string; space: string; title: string; action: string; endsIn: string; ballotLabel: string; voters: string[] }
}) {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(SCRIPT.length)

  useEffect(() => {
    if (reduced) return
    let n = START
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      setCount(n)
      if (n < SCRIPT.length) {
        n += 1
        timer = setTimeout(step, 1700)
      } else {
        n = START
        timer = setTimeout(step, 4200)
      }
    }
    timer = setTimeout(step, 600)
    return () => clearTimeout(timer)
  }, [reduced])

  const tl = tallyOf(count)
  const outcome = liveOutcome(tl)
  const latest = SCRIPT.slice(0, count)
    .map((b, i) => ({ ...b, name: copy.voters[i] ?? "", i }))
    .slice(-4)
    .reverse()

  return (
    <figure aria-label={copy.label} className="relative w-full rounded-3xl border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Image src="/brand/monark-mark.svg" alt="" width={18} height={18} unoptimized className="size-4.5" />
        {copy.space}
      </div>
      <p className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">{copy.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{copy.action}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClockIcon className="size-3.5" aria-hidden="true" />
          {copy.endsIn}
        </span>
        <OutcomeChip key={outcome} outcome={outcome} label={labels.live[outcome]} />
      </div>

      <TallyView className="mt-4" tally={tl} model="delegated" locale={locale} labels={labels} />

      <div className="mt-5 border-t pt-4">
        <p className="text-xs font-semibold text-muted-foreground">{copy.ballotLabel}</p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-live="off">
          {latest.map((b) => (
            <li
              key={b.i}
              className={cn(
                "gc-settle inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold",
                b.choice === "for" && "border-primary/60 bg-primary/10",
                b.choice === "against" && "border-foreground/30 bg-foreground/5",
                b.choice === "abstain" && "border-dashed text-muted-foreground"
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", b.choice === "for" && "bg-primary", b.choice === "against" && "bg-foreground/70", b.choice === "abstain" && "gc-hatch text-muted-foreground")}
              />
              {b.name} · {labels.choices[b.choice]}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
