"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { href } from "@/i18n/config"
import { useDemo, useNow } from "@/lib/demo/store"
import type { Activity, DemoState } from "@/lib/demo/types"
import { fmtNumber, fmtRelative } from "@/lib/format"

import { useAppCopy } from "./app-provider"
import { Avatar, Card, useNameOf } from "./bits"

/** Fill a template's {placeholders} with React nodes. */
function fill(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/g).map((chunk, i) => {
    const key = chunk.match(/^\{(\w+)\}$/)?.[1]
    return key && key in parts ? <span key={i}>{parts[key]}</span> : chunk
  })
}

export function ActivityLine({ entry, demo }: { entry: Activity; demo: DemoState }) {
  const { app, terms, locale } = useAppCopy()
  const nameOf = useNameOf(demo)
  const a = app.activity
  const proposal = entry.proposalId ? demo.proposals.find((p) => p.id === entry.proposalId) : undefined
  const proposalNode = proposal ? (
    <Link href={href(locale, `/app/proposals/${proposal.id}`)} className="font-semibold text-foreground underline-offset-4 hover:underline">
      {proposal.title}
    </Link>
  ) : (
    "…"
  )
  const parts: Record<string, ReactNode> = {
    actor: <strong className="font-bold text-foreground">{nameOf(entry.actor)}</strong>,
    proposal: proposalNode,
    choice: entry.choice ? <strong className="font-bold text-foreground">{terms.choices[entry.choice].toLowerCase()}</strong> : "",
    weight: fmtNumber(locale, entry.weight ?? 0),
    target: <strong className="font-bold text-foreground">{nameOf(entry.target)}</strong>,
  }
  return <>{fill(a[entry.kind], parts)}</>
}

export function ActivityRail() {
  const demo = useDemo()
  const now = useNow()
  const { app, locale } = useAppCopy()
  if (!demo) return null
  const items = demo.activity.slice(0, 4)
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{app.activity.title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{app.activity.empty}</p>
      ) : (
        <ol className="flex flex-col gap-4" aria-live="polite">
          {items.map((entry) => (
            <li key={entry.id} className="gc-settle flex gap-3 text-sm text-muted-foreground">
              <Avatar address={entry.actor} size={24} className="mt-0.5" />
              <div className="min-w-0">
                <p className="break-words">
                  <ActivityLine entry={entry} demo={demo} />
                </p>
                <p className="mt-0.5 text-xs">{fmtRelative(locale, entry.at, now)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
