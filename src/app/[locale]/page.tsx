import { ArrowRightIcon, HandshakeIcon, ScrollTextIcon, ZapIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Lifecycle } from "@/components/diagrams/lifecycle"
import { ModelDots } from "@/components/diagrams/model-dots"
import { HeroTally } from "@/components/home/hero-tally"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { sameBallotsExample } from "@/lib/demo/examples"
import type { VotingModel } from "@/lib/demo/types"
import { fmtNumber, fmtPctNumber } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale).meta
  return pageMetadata(locale, "/", null, d.description)
}

const OUTCOME_ICONS = [ScrollTextIcon, HandshakeIcon, ZapIcon]

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const ex = sameBallotsExample(dict, locale)
  const tokenFor = fmtPctNumber(locale, ex.token.forShare, 0)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={569}
          height={571}
          unoptimized
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-44 w-[34rem] max-w-none opacity-[0.10] select-none sm:-right-24 lg:-top-20 lg:-right-24 lg:w-[48rem] dark:opacity-[0.16]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
            <h1 className="mt-4 text-[2.25rem] leading-[1.05] font-extrabold tracking-display sm:text-5xl lg:text-[4.25rem]">{h.title}</h1>
            <p className="mt-6 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{dict.common.demoBadge}</p>
          </div>
          <HeroTally locale={locale} labels={{ ...dict.terms, tally: dict.app.proposal.tally }} copy={h.hero} />
        </div>
      </section>

      {/* Outcomes */}
      <section aria-labelledby="outcomes-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="outcomes-title" className="max-w-[24ch] text-3xl font-bold tracking-display sm:text-4xl">
            {h.outcomes.title}
          </h2>
          <p className="mt-4 max-w-[68ch] text-muted-foreground">{h.outcomes.intro}</p>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {h.outcomes.items.map((item, i) => {
              const Icon = OUTCOME_ICONS[i] ?? ZapIcon
              return (
                <li key={item.title}>
                  <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Voting models */}
      <section aria-labelledby="models-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="eyebrow text-primary-ink">{h.models.eyebrow}</p>
        <h2 id="models-title" className="mt-3 text-3xl font-bold tracking-display sm:text-4xl">
          {h.models.title}
        </h2>
        <p className="mt-4 max-w-[68ch] text-muted-foreground">{h.models.body}</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {h.models.items.map((m) => (
            <li key={m.key} className="flex flex-col rounded-3xl border bg-card p-6">
              <ModelDots model={m.key as VotingModel} className="h-28 w-full" />
              <h3 className="mt-5 text-xl font-bold">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{m.body}</p>
              <p className="mt-4 text-xs font-bold text-primary-ink">{m.best}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-6 rounded-3xl border border-dashed p-6 md:grid-cols-[1fr_1.1fr] md:items-center md:p-8">
          <div>
            <h3 className="text-xl font-bold">{h.models.same.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(h.models.same.body, {
                ballots: ex.ballots,
                tokenFor,
                walletFor: ex.wallet.for,
                walletAgainst: ex.wallet.against,
              })}
            </p>
            <Link
              href={href(locale, "/app/proposals/demo-day-venue")}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4"
            >
              {h.models.same.cta}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-5">
            {(
              [
                [h.models.same.tokenLabel, ex.token.for, ex.token.against, ex.token.outcome === "passed", "tGOV"],
                [h.models.same.walletLabel, ex.wallet.for, ex.wallet.against, ex.wallet.outcome === "passed", dict.terms.wallets],
              ] as const
            ).map(([label, f, a, ok, unit]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-bold">{label}</span>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive")}>
                    {ok ? h.models.same.passed : h.models.same.failed}
                  </span>
                </div>
                <div className="relative mt-2">
                  <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                    <span className="h-full bg-primary" style={{ flexGrow: f, flexBasis: 0 }} />
                    <span className="h-full bg-foreground/70" style={{ flexGrow: a, flexBasis: 0 }} />
                  </div>
                  <span aria-hidden="true" className="absolute -top-1 left-[calc(50%-1px)] h-6 w-0.5 rounded-full bg-foreground" />
                </div>
                <p className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>
                    {dict.terms.choices.for} {fmtNumber(locale, f)} {unit}
                  </span>
                  <span>
                    {dict.terms.choices.against} {fmtNumber(locale, a)} {unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Lifecycle */}
      <section aria-labelledby="life-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="life-title" className="text-3xl font-bold tracking-display sm:text-4xl">
            {h.lifecycle.title}
          </h2>
          <Link href={href(locale, "/how-it-works")} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4">
            {h.lifecycle.more}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Lifecycle steps={h.lifecycle.steps} className="mt-10" />
      </section>

      {/* Who */}
      <section aria-labelledby="who-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="eyebrow text-primary-ink">{h.who.eyebrow}</p>
          <h2 id="who-title" className="mt-3 text-3xl font-bold tracking-display sm:text-4xl">
            {h.who.title}
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {h.who.items.map((item, i) => {
              const photo = PHOTOS[i]
              return (
                <li key={item.title} className="overflow-hidden rounded-3xl border bg-background">
                  {photo ? (
                    <div className="relative aspect-[4/3]">
                      <Image src={photo.file} alt={item.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <p className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold">{item.model}</p>
                    <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-4xl">
          {h.faq.title}
        </h2>
        <div className="mt-8 divide-y border-y">
          {h.faq.items.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[68ch] pb-5 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Closing */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 className="mx-auto max-w-[22ch] text-3xl font-extrabold tracking-display sm:text-5xl">{h.closing.title}</h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-muted-foreground">{h.closing.body}</p>
        <Button asChild size="lg" className="mt-8 h-12 px-6 text-base">
          <Link href={href(locale, "/app")}>
            {h.closing.cta}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </>
  )
}
