"use client"

import { useTheme } from "next-themes"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { simulateLiveVote } from "@/lib/demo/ops"
import { initDemo } from "@/lib/demo/store"

import { WalletPrompt } from "./wallet-prompt"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  terms: Dictionary["terms"]
  seed: Dictionary["seed"]
  disclaimer: string
  demoBadge: string
}

const AppContext = createContext<AppCopy | null>(null)

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    initDemo(value.seed, value.locale)
  }, [value.seed, value.locale])

  // Live voters: every 7–13 s a simulated member casts a ballot on an open vote.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        simulateLiveVote()
        schedule()
      }, 7000 + Math.random() * 6000)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletPrompt />
      <Toaster
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        // Desktop: top-right, below the header, the network strip and the
        // section tabs (~190px), where pages keep their right edge clear
        // (titles are left-aligned and the vote panel starts lower), so a
        // toast never covers the tally or panel it reports on. Phones: full
        // width over the network strip, which carries no reported content.
        position="top-right"
        offset={{ top: 196, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-md",
            description: "!text-muted-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}
