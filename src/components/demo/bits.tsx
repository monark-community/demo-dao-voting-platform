"use client"

import { BanIcon, CheckCircle2Icon, CircleDotIcon, CircleSlashIcon, XCircleIcon, ZapIcon } from "lucide-react"
import type * as React from "react"
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

import type { ProposalStatus } from "@/lib/demo/tally"
import type { Choice, DemoState } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/** Display name for an address: "You", a member's name, or the short address. */
export function useNameOf(demo: DemoState | null) {
  const { app } = useAppCopy()
  return (address: string | null | undefined): string => {
    if (!address) return ""
    if (demo && address === demo.wallet.address) return app.activity.you
    const m = demo?.members.find((x) => x.address === address)
    return m ? m.name : `${address.slice(0, 6)}…${address.slice(-4)}`
  }
}

export function Avatar({ address, size = 28, className }: { address: string; size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
      <Jazzicon diameter={size} seed={jsNumberForAddress(address)} />
    </span>
  )
}

const STATUS_STYLE: Record<ProposalStatus, { icon: typeof CircleDotIcon; cls: string }> = {
  active: { icon: CircleDotIcon, cls: "border-primary/50 bg-primary/10 text-foreground [&>svg]:text-primary-ink" },
  passed: { icon: CheckCircle2Icon, cls: "border-success/40 bg-success/10 text-success" },
  executed: { icon: ZapIcon, cls: "border-success/40 bg-success/10 text-success" },
  defeated: { icon: XCircleIcon, cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  noQuorum: { icon: CircleSlashIcon, cls: "border-warning/40 bg-warning/10 text-warning" },
  cancelled: { icon: BanIcon, cls: "border-border bg-muted text-muted-foreground" },
}

export function StatusBadge({ status, className }: { status: ProposalStatus; className?: string }) {
  const { terms } = useAppCopy()
  const s = STATUS_STYLE[status]
  const Icon = s.icon
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold whitespace-nowrap", s.cls, className)}>
      <Icon className={cn("size-3.5", status === "active" && "gc-pulse")} aria-hidden="true" />
      {terms.status[status]}
    </span>
  )
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 text-card-foreground sm:p-6", className)} {...props}>
      {children}
    </section>
  )
}

export function ChoicePill({ choice, label }: { choice: Choice; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-bold",
        choice === "for" && "border-primary/60 bg-primary/15",
        choice === "against" && "border-foreground/30 bg-foreground/10",
        choice === "abstain" && "border-dashed text-muted-foreground"
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", choice === "for" && "bg-primary", choice === "against" && "bg-foreground/70", choice === "abstain" && "gc-hatch text-muted-foreground")}
      />
      {label}
    </span>
  )
}
