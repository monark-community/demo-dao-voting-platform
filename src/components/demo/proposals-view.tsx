"use client"

import { ArrowRightIcon, PlusIcon, SearchIcon, XIcon, ZapIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { fmtPower, liveOutcome, OutcomeChip, TallyView } from "@/components/diagrams/tally-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenAmount } from "@/components/ui/token-amount"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { awaitingExecution, statusOf, tally, totalPower } from "@/lib/demo/tally"
import { useDemo, useNow } from "@/lib/demo/store"
import type { DemoState, Proposal } from "@/lib/demo/types"
import { fmtPct, fmtPctNumber, fmtRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { intlLocale } from "@/i18n/config"

import { ActivityRail } from "./activity-rail"
import { useAppCopy } from "./app-provider"
import { Card, StatusBadge } from "./bits"
import { PowerCard } from "./power-card"

type Tab = "active" | "passed" | "closed" | "all"

/** Average share of voting power that took part in closed proposals. */
export function averageTurnout(demo: DemoState, now: number): number {
  const closed = demo.proposals.filter((p) => !p.cancelled && p.endsAt <= now)
  if (closed.length === 0) return 0
  const sum = closed.reduce((acc, p) => {
    const tl = tally(p, demo.members)
    return acc + tl.participation / Math.max(1, totalPower(demo.members, p.model))
  }, 0)
  return sum / closed.length
}

export function ProposalsView() {
  const demo = useDemo()
  const now = useNow()
  const { app, locale, terms } = useAppCopy()
  const l = app.list
  const [tab, setTab] = useState<Tab>("active")
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    if (!demo) return []
    return demo.proposals
      .map((p) => ({ p, status: statusOf(p, demo.members, now) }))
      .sort((a, b) => (a.status === "active" && b.status === "active" ? a.p.endsAt - b.p.endsAt : b.p.createdAt - a.p.createdAt))
  }, [demo, now])

  if (!demo) return null
  const counts = {
    active: rows.filter((r) => r.status === "active").length,
    passed: rows.filter((r) => r.status === "passed" || r.status === "executed").length,
    closed: rows.filter((r) => r.status !== "active").length,
    all: rows.length,
  }
  const q = query.trim().toLowerCase()
  const visible = rows.filter(({ p, status }) => {
    const inTab =
      tab === "all" ||
      (tab === "active" && status === "active") ||
      (tab === "passed" && (status === "passed" || status === "executed")) ||
      (tab === "closed" && status !== "active")
    if (!inTab) return false
    if (!q) return true
    const category = terms.categories[p.category]
    return `${p.title} ${p.summary} ${category}`.toLowerCase().includes(q)
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        <SpaceHeader demo={demo} now={now} />

        <section aria-labelledby="list-title" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <h2 id="list-title" className="text-2xl font-bold">
                {l.title}
              </h2>
              {/* On phones "New proposal" lives here, so the app bar's three sections fit. */}
              <Button asChild size="sm" className="h-10 sm:hidden">
                <Link href={href(locale, "/app/new")}>
                  <PlusIcon aria-hidden="true" />
                  {app.nav.newProposal}
                </Link>
              </Button>
            </div>
            <div className="relative sm:w-72">
              <label htmlFor="search" className="sr-only">
                {l.search}
              </label>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={l.searchPlaceholder}
                className="h-11 rounded-full pr-10 pl-9"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={l.clear}
                  className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div role="group" aria-label={l.title} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {(["active", "passed", "closed", "all"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors duration-150",
                  tab === key ? "border-foreground bg-foreground text-background" : "border-input text-foreground hover:bg-muted"
                )}
              >
                {l.tabs[key]}
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab === key ? "bg-background/20" : "bg-muted")}>{counts[key]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>{q ? t(l.noMatch, { query }) : l.empty}</p>
              {q ? (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>
                  {l.clear}
                </Button>
              ) : (
                <Button asChild size="sm" className="mt-4">
                  <Link href={href(locale, "/app/new")}>{app.nav.newProposal}</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map(({ p }) => (
                <li key={p.id}>
                  <ProposalRow proposal={p} demo={demo} now={now} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-6" aria-label={app.power.title}>
        <PowerCard />
        <ActivityRail />
      </aside>
    </div>
  )
}

function SpaceHeader({ demo, now }: { demo: DemoState; now: number }) {
  const { app, locale } = useAppCopy()
  const s = app.space
  const nf = intlLocale[locale]
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{demo.space.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(s.members, { n: demo.members.length })} · {t(s.rules, { quorum: demo.space.defaultQuorumPct, days: demo.space.defaultPeriodDays })}
        </p>
      </div>
      <dl className="grid gap-4 border-t pt-5 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{s.treasury}</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-lg font-extrabold">
            <TokenAmount value={demo.space.treasury.tUSDC} decimals={0} symbol="tUSDC" locale={nf} />
            <TokenAmount value={demo.space.treasury.tETH} decimals={0} symbol="tETH" locale={nf} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{s.participation}</dt>
          <dd className="mt-1 text-lg font-extrabold tabular-nums">{fmtPct(locale, averageTurnout(demo, now), 0)}</dd>
        </div>
      </dl>
    </Card>
  )
}

function ProposalRow({ proposal: p, demo, now }: { proposal: Proposal; demo: DemoState; now: number }) {
  const { app, terms, locale } = useAppCopy()
  const l = app.list
  const status = statusOf(p, demo.members, now)
  const tl = tally(p, demo.members)
  const mine = p.ballots.find((b) => b.voter === demo.wallet.address)
  const ready = awaitingExecution(p, demo.members, now)
  const link = href(locale, `/app/proposals/${p.id}`)

  return (
    <article className="group relative rounded-2xl border bg-card p-5 transition-colors hover:border-input sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs font-semibold text-muted-foreground">
          {terms.categories[p.category]} · {terms.modelsShort[p.model]}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold">
        <Link href={link} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {p.title}
        </Link>
      </h3>

      {status === "active" ? (
        <div className="mt-4">
          <TallyView tally={tl} model={p.model} locale={locale} labels={{ ...terms, tally: app.proposal.tally }} compact />
        </div>
      ) : (
        <p className="mt-3 text-sm">
          <span className="font-semibold">{t(app.proposal.tally.forShare, { pct: fmtPctNumber(locale, tl.forShare, 1) })}</span>
          <span className="text-muted-foreground"> · {fmtPower(locale, tl.participation, p.model, terms)}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
        <span>{status === "active" ? t(l.endsIn, { time: fmtRelative(locale, p.endsAt, now) }) : t(l.endedAgo, { time: fmtRelative(locale, p.endsAt, now) })}</span>
        {status === "active" ? <OutcomeChip outcome={liveOutcome(tl)} label={terms.live[liveOutcome(tl)]} /> : null}
        <span className={cn("font-semibold", mine ? "text-foreground" : "")}>
          {mine ? t(l.yourVote, { choice: terms.choices[mine.choice].toLowerCase() }) : status === "active" ? l.notVoted : ""}
        </span>
        {ready ? (
          <span className="inline-flex items-center gap-1 font-bold text-primary-ink">
            <ZapIcon className="size-3.5" aria-hidden="true" />
            {l.awaiting}
          </span>
        ) : null}
        <ArrowRightIcon className="ml-auto size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </article>
  )
}
