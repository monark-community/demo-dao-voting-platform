"use client"

import { Loader2Icon, PlusIcon, WalletIcon, XCircleIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { AppLoading } from "@/components/ui/app-loading"
import { AppTabs, type AppTab } from "@/components/ui/app-tabs"
import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import { connectWallet } from "@/lib/demo/wallet"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"

/**
 * App chrome under the site header: the @monark/ui app tabs, with the
 * network + demo controls pill and "New proposal" on the right. No testnet strip: that line lives in the wallet prompt, once per
 * transaction. Gates on wallet connection.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app } = useAppCopy()
  const connected = demo?.wallet.status === "connected"

  return (
    <div className="flex flex-1 flex-col">
      <AppBar connected={connected} />
      {!storageOk ? (
        <p role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 text-sm text-warning sm:px-6">
          {app.storageError}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-8">
        {!demo ? <AppLoading label={app.loading} stats={3} /> : !connected ? <ConnectGate /> : children}
      </div>
    </div>
  )
}

function AppBar({ connected }: { connected: boolean }) {
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  const base = href(locale, "/app")
  const tabs: AppTab[] = connected
    ? [
        { href: base, label: app.nav.proposals, active: pathname === base || pathname.startsWith(`${base}/proposals`) },
        { href: `${base}/delegates`, label: app.nav.delegates },
        { href: `${base}/results`, label: app.nav.results },
      ]
    : []
  const onNew = pathname.startsWith(`${base}/new`)
  return (
    <AppTabs
      tabs={tabs}
      pathname={pathname}
      LinkComponent={Link}
      label={app.nav.label}
      actions={
        <>
          <DemoControls />
          {connected ? (
            <Button asChild variant={onNew ? "outline" : "default"} className="hidden sm:inline-flex">
              <Link href={`${base}/new`} aria-current={onNew ? "page" : undefined}>
                <PlusIcon aria-hidden="true" />
                {app.nav.newProposal}
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  )
}

function ConnectGate() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const g = app.gate
  const connecting = demo?.wallet.status === "connecting"
  const rejected = demo?.wallet.lastError === "rejected"

  return (
    <section aria-labelledby="gate-title" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-8 text-center">
      <Image src="/brand/monark-mark.svg" alt="" width={56} height={56} unoptimized className="size-14" />
      <h1 id="gate-title" className="mt-6 text-3xl font-extrabold tracking-display">
        {g.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{g.body}</p>
      <Button
        size="lg"
        className="mt-8 w-full sm:w-auto"
        disabled={connecting}
        onClick={() =>
          void connectWallet({
            title: app.summaries.signIn,
            rows: [{ label: app.summaries.signInRow, value: app.summaries.signInValue }],
            movesValue: false,
            noFee: true,
          })
        }
      >
        {connecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <WalletIcon aria-hidden="true" />}
        {connecting ? app.wallet.connecting : g.connect}
      </Button>
      <div aria-live="polite" className="mt-4 min-h-6">
        {rejected ? (
          <p role="alert" className="flex items-start gap-2 text-left text-sm text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {g.rejected}
          </p>
        ) : null}
      </div>
    </section>
  )
}
