"use client"

import { RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ROLES } from "@/lib/demo/permissions"
import { resetDemo, setSettings, update, useDemo } from "@/lib/demo/store"
import type { Role } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/**
 * The app bar's one demo element: a pill showing the (simulated) network that
 * opens the demo controls: role, live voters, network speed, forced failure,
 * and "Reset demo".
 */
export function DemoControls() {
  const demo = useDemo()
  const { app, seed, locale, terms } = useAppCopy()
  const c = app.controls
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  if (!demo) return null
  const me = demo.members.find((m) => m.address === demo.wallet.address)
  const setRole = (role: Role) => {
    update((s) => ({ ...s, members: s.members.map((m) => (m.address === s.wallet.address ? { ...m, role } : m)) }))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setConfirming(false)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title={c.open} className="h-10 shrink-0 px-3">
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          <span className="hidden sm:inline">{app.network}</span>
          <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
          <SlidersHorizontalIcon aria-hidden="true" />
          <span className="sr-only lg:not-sr-only">{c.open}</span>
          {demo.settings.failNext || demo.settings.slow ? (
            <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={app.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{c.title}</DialogTitle>
          <DialogDescription className="sr-only">{c.resetHint}</DialogDescription>
        </DialogHeader>
        {me ? (
          <fieldset className="rounded-2xl border p-4">
            <legend className="sr-only">{c.role}</legend>
            <p aria-hidden="true" className="text-sm font-bold">
              {c.role}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{c.roleHint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const active = me.role === role
                return (
                  <label
                    key={role}
                    className={cn(
                      "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted"
                    )}
                  >
                    <input type="radio" name="demo-role" value={role} checked={active} onChange={() => setRole(role)} className="sr-only" />
                    {terms.roles[role]}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ) : null}
        <div className="flex flex-col divide-y rounded-2xl border">
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-live" className="text-sm font-bold">
                {c.live}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.liveHint}</p>
            </div>
            <Switch id="ctl-live" checked={demo.settings.liveVoters} onCheckedChange={(v) => setSettings({ liveVoters: v })} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-slow" className="text-sm font-bold">
                {c.slow}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.slowHint}</p>
            </div>
            <Switch id="ctl-slow" checked={demo.settings.slow} onCheckedChange={(v) => setSettings({ slow: v })} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-fail" className="text-sm font-bold">
                {c.failNext}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.failNextHint}</p>
            </div>
            <Switch id="ctl-fail" checked={demo.settings.failNext} onCheckedChange={(v) => setSettings({ failNext: v })} />
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          {!confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{c.resetHint}</p>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} className="shrink-0">
                <RotateCcwIcon aria-hidden="true" />
                {c.reset}
              </Button>
            </div>
          ) : (
            <div role="alertdialog" aria-labelledby="reset-q" className="flex flex-col gap-3">
              <p id="reset-q" className="font-bold">
                {c.resetConfirm}
              </p>
              <p className="text-xs text-muted-foreground">{c.resetConfirmBody}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  autoFocus
                  onClick={() => {
                    resetDemo(seed, locale)
                    setConfirming(false)
                    setOpen(false)
                    toast.success(c.resetDone)
                  }}
                >
                  {c.resetDo}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {c.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
