"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { DemoChip } from "@/components/ui/demo-chip"
import { HeaderAction } from "@/components/ui/header-action"
import { LocaleSwitch } from "@/components/ui/locale-switch"
import { SiteBrand } from "@/components/ui/site-brand"
import { SiteHeader as MonarkSiteHeader } from "@/components/ui/site-header"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { href, locales, switchLocalePath, type Locale } from "@/i18n/config"
import { useDemo } from "@/lib/demo/store"
import { connectWallet, disconnectWallet } from "@/lib/demo/wallet"

export interface HeaderLabels {
  product: string
  homeLabel: string
  nav: { label: string; overview: string; how: string; demo: string }
  openMenu: string
  closeMenu: string
  menu: string
  demoChip: string
  demoBadge: string
  language: { label: string; names: Record<Locale, string>; short: Record<Locale, string> }
  theme: string
  launchDemo: string
  wallet: {
    connect: string
    connecting: string
    disconnect: string
    signIn: string
    signInRow: string
    signInValue: string
  }
}

/** The @monark/ui site shell, wired to GovChain's routes, copy and simulated wallet. */
export function SiteHeader({ locale, t }: { locale: Locale; t: HeaderLabels }) {
  const pathname = usePathname() ?? `/${locale}`
  const demo = useDemo()
  const w = t.wallet

  return (
    <MonarkSiteHeader
      pathname={pathname}
      LinkComponent={Link}
      brand={<SiteBrand name={t.product} href={href(locale)} aria-label={t.homeLabel} LinkComponent={Link} />}
      links={[
        { href: href(locale), label: t.nav.overview, exact: true },
        { href: href(locale, "/how-it-works"), label: t.nav.how },
        { href: href(locale, "/app"), label: t.nav.demo },
      ]}
      labels={{ nav: t.nav.label, openMenu: t.openMenu, closeMenu: t.closeMenu, menu: t.menu }}
      actions={
        <>
          <DemoChip label={t.demoChip} description={t.demoBadge} />
          <LocaleSwitch
            locales={locales}
            current={locale}
            hrefFor={(l) => switchLocalePath(pathname, l)}
            labels={t.language}
            LinkComponent={Link}
            linkProps={{ prefetch: false }}
          />
          <ThemeToggle label={t.theme} />
        </>
      }
      primaryAction={
        <HeaderAction
          appHref={href(locale, "/app")}
          pathname={pathname}
          launchLabel={t.launchDemo}
          LinkComponent={Link}
          loading={!demo}
          wallet={{
            status: demo?.wallet.status ?? "disconnected",
            address: demo?.wallet.address,
            name: demo?.wallet.name,
            connectLabel: w.connect,
            connectingLabel: w.connecting,
            disconnectLabel: w.disconnect,
            onConnect: () =>
              void connectWallet({
                title: w.signIn,
                rows: [{ label: w.signInRow, value: w.signInValue }],
                movesValue: false,
                noFee: true,
              }),
            onDisconnect: disconnectWallet,
          }}
        />
      }
    />
  )
}
