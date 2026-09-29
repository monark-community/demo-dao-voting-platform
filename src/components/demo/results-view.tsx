"use client"

import Link from "next/link"

import { fmtPower } from "@/components/diagrams/tally-view"
import { href } from "@/i18n/config"
import { useDemo, useNow } from "@/lib/demo/store"
import { statusOf, tally, totalPower, type ProposalStatus } from "@/lib/demo/tally"
import type { Category } from "@/lib/demo/types"
import { fmtNumber, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Card, ChoicePill, StatusBadge } from "./bits"
import { averageTurnout } from "./proposals-view"

const CATEGORIES: Category[] = ["treasury", "events", "community", "rules", "technical"]

export function ResultsView() {
  const demo = useDemo()
  const now = useNow()
  const { app, terms, locale } = useAppCopy()
  const r = app.results
  if (!demo) return null

  const rows = demo.proposals
    .filter((p) => !p.cancelled)
    .map((p) => {
      const tl = tally(p, demo.members)
      return { p, tl, status: statusOf(p, demo.members, now), turnout: tl.participation / Math.max(1, totalPower(demo.members, p.model)) }
    })
    .sort((a, b) => b.p.endsAt - a.p.endsAt)
  const closed = rows.filter((x) => x.status !== "active")
  const passed = closed.filter((x) => x.status === "passed" || x.status === "executed")
  const mine = demo.proposals.flatMap((p) => {
    const b = p.ballots.find((x) => x.voter === demo.wallet.address)
    return b ? [{ p, b, status: statusOf(p, demo.members, now) }] : []
  })
  const maxScale = Math.max(0.6, ...rows.map((x) => Math.max(x.turnout, x.p.quorumPct / 100) * 1.1))

  const stats = [
    { label: r.stats.proposals, value: fmtNumber(locale, demo.proposals.length) },
    { label: r.stats.passRate, value: fmtPct(locale, closed.length ? passed.length / closed.length : 0, 0) },
    { label: r.stats.turnout, value: fmtPct(locale, averageTurnout(demo, now), 0) },
    { label: r.stats.yourVotes, value: fmtNumber(locale, mine.length) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{r.title}</h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 sm:p-5">
            <dt className="text-xs font-semibold text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-3xl font-extrabold tracking-display tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Card aria-labelledby="chart-title">
        <h2 id="chart-title" className="text-lg font-bold">
          {r.chartTitle}
        </h2>
        <ul className="mt-5 flex flex-col gap-4" aria-label={r.chartLabel}>
          {rows.map(({ p, turnout, status }) => {
            const q = p.quorumPct / 100
            const met = turnout >= q
            return (
              <li key={p.id} className="grid gap-1.5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
                <Link href={href(locale, `/app/proposals/${p.id}`)} className="truncate text-sm font-semibold underline-offset-4 hover:underline">
                  {p.title}
                </Link>
                <div className="flex items-center gap-3">
                  <div className="relative h-3 flex-1 rounded-full bg-muted">
                    <span
                      className={cn("gc-seg absolute inset-y-0 left-0 rounded-full", met ? "bg-primary" : "bg-foreground/40", status === "active" && "gc-hatch text-primary")}
                      style={{ width: `${(turnout / maxScale) * 100}%` }}
                    />
                    <span aria-hidden="true" className="absolute -top-1 h-5 w-0.5 rounded-full bg-foreground" style={{ left: `${(q / maxScale) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                    <strong>{fmtPct(locale, turnout, 0)}</strong>
                    <span className="text-muted-foreground"> / {fmtPct(locale, q, 0)}</span>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-primary" aria-hidden="true" />
            {terms.quorumReached}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-foreground/40" aria-hidden="true" />
            {terms.status.noQuorum}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="gc-hatch h-2.5 w-5 rounded-full text-primary" aria-hidden="true" />
            {terms.status.active}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5 rounded-full bg-foreground" aria-hidden="true" />
            {terms.quorum}
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card aria-labelledby="outcomes-title">
          <h2 id="outcomes-title" className="text-lg font-bold">
            {r.outcomesTitle}
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {CATEGORIES.map((cat) => {
              const inCat = closed.filter((x) => x.p.category === cat)
              if (inCat.length === 0) return null
              const ok = inCat.filter((x) => x.status === "passed" || x.status === "executed").length
              return (
                <li key={cat}>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{terms.categories[cat]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {ok} / {inCat.length} {terms.status.passed.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
                    <span className="h-full bg-success" style={{ width: `${(ok / inCat.length) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card aria-labelledby="history-title">
          <h2 id="history-title" className="text-lg font-bold">
            {r.historyTitle}
          </h2>
          {mine.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {r.historyEmpty}{" "}
              <Link href={href(locale, "/app")} className="font-bold text-primary-ink underline underline-offset-4">
                {app.nav.proposals}
              </Link>
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {r.table.proposal}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {r.table.choice}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {r.table.weight}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      {r.table.result}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map(({ p, b, status }) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">
                        <Link href={href(locale, `/app/proposals/${p.id}`)} className="font-semibold underline-offset-4 hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <ChoicePill choice={b.choice} label={terms.choices[b.choice]} />
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap tabular-nums">{fmtPower(locale, b.weight, p.model, terms)}</td>
                      <td className="py-3">
                        <StatusBadge status={status as ProposalStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
