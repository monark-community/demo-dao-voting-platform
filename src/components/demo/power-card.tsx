"use client"

import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"

import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useDemo } from "@/lib/demo/store"
import { delegatedTo } from "@/lib/demo/tally"
import { fmtNumber } from "@/lib/format"

import { useAppCopy } from "./app-provider"
import { Avatar, Card, useNameOf } from "./bits"

/** Your voting power at a glance: own tGOV, what's delegated to you or away, and your role. */
export function PowerCard() {
  const demo = useDemo()
  const { app, terms, locale } = useAppCopy()
  const nameOf = useNameOf(demo)
  if (!demo) return null
  const p = app.power
  const me = demo.members.find((m) => m.address === demo.wallet.address)
  if (!me) return null
  const incoming = delegatedTo(demo.members, me.address)
  const effective = (me.delegate ? 0 : me.balance) + incoming

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar address={me.address} size={40} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-muted-foreground">{p.title}</h2>
          <p className="text-2xl font-extrabold tabular-nums">
            {fmtNumber(locale, effective)} <span className="font-sans text-base font-bold text-muted-foreground">tGOV</span>
          </p>
        </div>
      </div>
      <dl className="flex flex-col divide-y rounded-xl border text-sm">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-muted-foreground">{p.own}</dt>
          <dd className="font-semibold tabular-nums">{fmtNumber(locale, me.balance)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-muted-foreground">{p.delegatedIn}</dt>
          <dd className="font-semibold tabular-nums">{fmtNumber(locale, incoming)}</dd>
        </div>
        {me.delegate ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-muted-foreground">{t(p.delegatedOut, { name: nameOf(me.delegate) })}</dt>
            <dd className="font-semibold tabular-nums">−{fmtNumber(locale, me.balance)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-muted-foreground">{p.role}</dt>
          <dd className="-my-1 inline-flex items-center gap-1 font-bold">
            <ShieldCheckIcon className="size-4 text-primary" aria-hidden="true" />
            {terms.roles[me.role]}
            <InfoTip label={p.roleTip} className="-mr-2">
              {p.roleHint[me.role]}
            </InfoTip>
          </dd>
        </div>
      </dl>
      <Link
        href={href(locale, "/app/delegates")}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-primary-ink underline underline-offset-4"
      >
        {p.manage}
        <ArrowRightIcon className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  )
}
