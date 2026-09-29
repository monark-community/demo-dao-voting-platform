import { ArrowRightIcon, CheckIcon, ChevronDownIcon, FileSignatureIcon, LinkIcon, MinusIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { Lifecycle } from "@/components/diagrams/lifecycle"
import { ModelDots } from "@/components/diagrams/model-dots"
import { TallyView } from "@/components/diagrams/tally-view"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale, REPO_URL } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { sameBallotsExample } from "@/lib/demo/examples"
import type { Tally } from "@/lib/demo/tally"
import type { VotingModel } from "@/lib/demo/types"
import { fmtNumber } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const ex = sameBallotsExample(dict, locale)
  const vars = { total: fmtNumber(locale, ex.total), needed: fmtNumber(locale, ex.quorumNeeded) }
  const example: Tally = {
    for: 5050,
    against: 1800,
    abstain: 1100,
    participation: 7950,
    totalPower: ex.total,
    quorumNeeded: ex.quorumNeeded,
    quorumReached: 7950 >= ex.quorumNeeded,
    forShare: 5050 / 6850,
    thresholdPct: 50,
    passing: true,
    ballots: 5,
  }
  const labels = { ...dict.terms, tally: dict.app.proposal.tally }
  const rows: [VotingModel, Tally & { outcome: string }][] = [
    ["wallet", ex.wallet],
    ["token", ex.token],
    ["delegated", ex.delegated],
  ]

  return (
    <div className="flex flex-col">
      <header className="mx-auto w-full max-w-4xl px-4 pt-12 pb-10 sm:px-6 lg:pt-16">
        <h1 className="text-4xl font-extrabold tracking-display sm:text-5xl">{h.title}</h1>
        <p className="mt-4 max-w-[68ch] text-lg text-muted-foreground">{h.intro}</p>
      </header>

      <Section id="lifecycle" title={h.lifecycle.title}>
        <Lifecycle steps={h.lifecycle.states} className="mt-8" />
        <p className="mt-8 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{h.lifecycle.cancelled}</p>
      </Section>

      <Section id="quorum" title={h.quorum.title} body={h.quorum.body}>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6">
            <h3 className="font-bold">{h.quorum.exampleTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t(h.quorum.example, vars)}</p>
            <ol className="mt-4 flex flex-col gap-2 text-sm">
              {h.quorum.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary text-xs font-extrabold">{i + 1}</span>
                  <span>{t(s, vars)}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure aria-label={h.quorum.gaugeLabel} className="rounded-3xl border bg-card p-6">
            <TallyView tally={example} model="token" locale={locale} labels={labels} />
          </figure>
        </div>
      </Section>

      <Section id="models" title={h.models.title} body={h.models.body}>
        <div className="mt-8 overflow-x-auto rounded-3xl border bg-card">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="px-5 py-3 font-semibold">{h.models.rows.model}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.models.rows.for}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.models.rows.against}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.models.rows.result}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([m, tl]) => {
                const unit = m === "wallet" ? dict.terms.wallets : "tGOV"
                const ok = tl.outcome === "passed"
                return (
                  <tr key={m} className="border-b align-top last:border-0">
                    <th scope="row" className="px-5 py-4 font-bold">
                      {dict.terms.models[m]}
                    </th>
                    <td className="px-5 py-4 tabular-nums">
                      {fmtNumber(locale, tl.for)} {unit}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {fmtNumber(locale, tl.against)} {unit}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold", ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive")}>
                        {ok ? dict.terms.status.passed : tl.outcome === "noQuorum" ? dict.terms.status.noQuorum : dict.terms.status.defeated}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-[68ch]">{h.models.takeaway}</p>
      </Section>

      <SectionDivider className="my-4" />

      <Section id="delegation" title={h.delegation.title} body={h.delegation.body}>
        <div className="mt-8 grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <ModelDots model="delegated" className="h-40 w-full" />
          <ul className="flex flex-col gap-3">
            {h.delegation.points.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="roles" title={h.roles.title} body={h.roles.body}>
        <div className="mt-8 overflow-x-auto rounded-3xl border bg-card">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="px-5 py-3 font-semibold">{h.roles.headers.action}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.roles.headers.admin}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.roles.headers.proposer}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{h.roles.headers.voter}</th>
              </tr>
            </thead>
            <tbody>
              {h.roles.rows.map((row) => (
                <tr key={row.action} className="border-b last:border-0">
                  <th scope="row" className="px-5 py-3.5 font-bold">{row.action}</th>
                  {[row.admin, row.proposer, row.voter].map((v, i) => (
                    <td key={i} className="px-5 py-3.5">
                      {v === true ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <CheckIcon className="size-4 text-success" aria-hidden="true" />
                          {h.roles.yes}
                        </span>
                      ) : v === false ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <MinusIcon className="size-4" aria-hidden="true" />
                          {h.roles.no}
                        </span>
                      ) : (
                        <span className="font-semibold">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="records" title={h.records.title}>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {h.records.items.map((item, i) => {
            const Icon = i === 0 ? LinkIcon : FileSignatureIcon
            return (
              <li key={item.title} className="rounded-3xl border bg-card p-6">
                <Icon className="size-6 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section id="developers" title={h.dev.title} body={h.dev.body}>
        <details className="group mt-6 overflow-hidden rounded-3xl border bg-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
            {h.dev.show}
            <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <figure className="border-t">
            <figcaption className="border-b px-5 py-3 text-xs font-semibold text-muted-foreground">{h.dev.codeLabel}</figcaption>
            <ul className="divide-y">
              {h.dev.mapping.map((m) => (
                <li key={m.call} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <code className="font-mono text-xs break-all sm:text-sm">{m.call}</code>
                  <code className="shrink-0 font-mono text-xs text-primary-ink">{m.demo}</code>
                </li>
              ))}
            </ul>
          </figure>
        </details>
        <a href={REPO_URL} className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4">
          {h.dev.repo}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </a>
      </Section>

      <section className="border-t bg-card">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-display">{h.closing.title}</h2>
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link href={href(locale, "/app")}>
              {h.closing.cta}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function Section({ id, title, body, children }: { id: string; title: string; body?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-12">
      <h2 id={`${id}-title`} className="text-2xl font-bold tracking-display sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="mt-3 max-w-[68ch] text-muted-foreground">{body}</p> : null}
      {children}
    </section>
  )
}
