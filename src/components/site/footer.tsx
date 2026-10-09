import Link from "next/link"

import { MONARK_SOCIALS, SiteFooter as MonarkSiteFooter } from "@/components/ui/site-footer"
import { href, REPO_URL, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

/** The @monark/ui three-band footer with GovChain's pages, links and copy. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const f = c.footer
  const social = f.social as Record<string, string>

  return (
    <MonarkSiteFooter
      LinkComponent={Link}
      product={c.product}
      description={f.product}
      links={[
        { href: href(locale), label: c.nav.overview },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: href(locale, "/app"), label: c.nav.demo },
        { href: href(locale, "/credits"), label: c.nav.credits },
      ]}
      resources={[
        { href: `https://www.monark.io/${locale}/project/dao-voting-platform`, label: f.projectPage },
        { href: REPO_URL, label: f.repo },
      ]}
      socials={MONARK_SOCIALS.map((s) => ({ ...s, label: social[s.key] ?? s.label }))}
      copyright={`© ${new Date().getFullYear()} ${f.legal}`}
      demoNotice={c.demoBadge}
      legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
      labels={{
        productNav: f.productNav,
        builtBy: f.builtBy,
        monarkHome: f.monarkHome,
        tagline: f.tagline,
        socials: f.socialLabel,
      }}
    />
  )
}
