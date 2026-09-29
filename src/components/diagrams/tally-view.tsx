import { CheckCircle2Icon, CircleDashedIcon, XCircleIcon } from "lucide-react"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { fmtNumber, fmtPctNumber } from "@/lib/format"
import type { Tally } from "@/lib/demo/tally"
import type { Choice, VotingModel } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

export type TallyLabels = Dictionary["terms"] & { tally: Dictionary["app"]["proposal"]["tally"] }

/** "7,950 tGOV" or "6 wallets", depending on the model. */
export function fmtPower(locale: Locale, n: number, model: VotingModel, terms: Dictionary["terms"]): string {
  return model === "wallet" ? `${fmtNumber(locale, n)} ${terms.wallets}` : `${fmtNumber(locale, n)} tGOV`
}

export type LiveOutcome = "passing" | "failing" | "noQuorum"

export function liveOutcome(tl: Tally): LiveOutcome {
  if (!tl.quorumReached) return "noQuorum"
  return tl.passing ? "passing" : "failing"
}

/** Outcome chip, always icon + text label (never colour alone). */
export function OutcomeChip({ outcome, label, className }: { outcome: LiveOutcome; label: string; className?: string }) {
  const Icon = outcome === "passing" ? CheckCircle2Icon : outcome === "failing" ? XCircleIcon : CircleDashedIcon
  return (
    <span
      className={cn(
        "gc-settle inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        outcome === "passing" && "border-success/40 bg-success/10 text-success",
        outcome === "failing" && "border-destructive/40 bg-destructive/10 text-destructive",
        outcome === "noQuorum" && "border-warning/40 bg-warning/10 text-warning",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

/**
 * The tally, as two answers: "did enough of us take part?" (the quorum gauge)
 * and "of those who took a side, did enough say For?" (the result bar with its
 * threshold). A pending ballot shows as a hatched ghost until it confirms.
 */
export function TallyView({
  tally: tl,
  model,
  locale,
  labels,
  pending,
  compact = false,
  className,
}: {
  tally: Tally
  model: VotingModel
  locale: Locale
  labels: TallyLabels
  pending?: { choice: Choice; weight: number } | null
  compact?: boolean
  className?: string
}) {
  const ghostFor = pending?.choice === "for" ? pending.weight : 0
  const ghostAgainst = pending?.choice === "against" ? pending.weight : 0
  const ghostAll = pending?.weight ?? 0
  const sided = tl.for + tl.against + ghostFor + ghostAgainst
  const forShare = sided > 0 ? (tl.for + ghostFor) / sided : 0
  const part = tl.participation + ghostAll
  const partShare = tl.totalPower > 0 ? Math.min(1, part / tl.totalPower) : 0
  const quorumShare = tl.totalPower > 0 ? tl.quorumNeeded / tl.totalPower : 0
  const quorumOk = part >= tl.quorumNeeded && part > 0
  const pw = (n: number) => fmtPower(locale, n, model, labels)

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-5", className)}>
      {/* Result: For vs Against, with the threshold */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="font-bold">
            <span className="mr-1.5 inline-block size-2.5 rounded-full bg-primary align-middle" aria-hidden="true" />
            {labels.choices.for} <span className="tabular-nums">{pw(tl.for + ghostFor)}</span>
          </span>
          <span className="font-bold">
            <span className="mr-1.5 inline-block size-2.5 rounded-full bg-foreground/70 align-middle" aria-hidden="true" />
            {labels.choices.against} <span className="tabular-nums">{pw(tl.against + ghostAgainst)}</span>
          </span>
        </div>
        <div className="relative mt-2">
          <div
            className={cn("flex w-full overflow-hidden rounded-full bg-muted", compact ? "h-3" : "h-4")}
            role="img"
            aria-label={`${labels.choices.for} ${pw(tl.for + ghostFor)}, ${labels.choices.against} ${pw(tl.against + ghostAgainst)}, ${t(labels.tally.forShare, { pct: fmtPctNumber(locale, forShare, 1) })}`}
          >
            {sided > 0 ? (
              <>
                <span className="gc-seg h-full bg-primary" style={{ flexGrow: tl.for, flexBasis: 0 }} />
                {ghostFor ? <span className="gc-seg gc-hatch gc-pulse h-full text-primary" style={{ flexGrow: ghostFor, flexBasis: 0 }} /> : null}
                {ghostAgainst ? <span className="gc-seg gc-hatch gc-pulse h-full text-foreground/60" style={{ flexGrow: ghostAgainst, flexBasis: 0 }} /> : null}
                <span className="gc-seg h-full bg-foreground/70" style={{ flexGrow: tl.against, flexBasis: 0 }} />
              </>
            ) : null}
          </div>
          {/* Threshold marker */}
          <span
            aria-hidden="true"
            className={cn("absolute -top-1 w-0.5 rounded-full bg-foreground", compact ? "h-5" : "h-6")}
            style={{ left: `calc(${tl.thresholdPct}% - 1px)` }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t(labels.tally.forShare, { pct: fmtPctNumber(locale, forShare, 1) })}</span>
          <span>{t(labels.tally.thresholdMark, { pct: tl.thresholdPct })}</span>
        </div>
      </div>

      {/* Participation vs quorum */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
          <span className="font-bold text-foreground">
            {quorumOk ? (
              <span className="gc-settle inline-flex items-center gap-1 text-success">
                <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
                {labels.quorumReached}
              </span>
            ) : (
              t(labels.tally.quorumProgress, { value: pw(part), needed: pw(tl.quorumNeeded) })
            )}
          </span>
          <span className="text-muted-foreground">
            {t(labels.tally.participation, { value: pw(part), total: pw(tl.totalPower) })}
          </span>
        </div>
        <div className="relative mt-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <span className="gc-seg h-full bg-foreground/80" style={{ width: `${Math.min(1, tl.participation / Math.max(1, tl.totalPower)) * 100}%` }} />
            {ghostAll ? <span className="gc-seg gc-hatch gc-pulse h-full text-foreground/60" style={{ width: `${Math.max(0, partShare - tl.participation / Math.max(1, tl.totalPower)) * 100}%` }} /> : null}
          </div>
          <span
            aria-hidden="true"
            className={cn("absolute -top-1 h-4 w-0.5 rounded-full", quorumOk ? "bg-success" : "bg-primary")}
            style={{ left: `calc(${quorumShare * 100}% - 1px)` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground" style={{ paddingLeft: `min(calc(${quorumShare * 100}% - 1.5rem), 70%)` }}>
          {t(labels.tally.quorumMark, { pct: fmtPctNumber(locale, quorumShare, 0) })}
        </p>
      </div>
    </div>
  )
}
