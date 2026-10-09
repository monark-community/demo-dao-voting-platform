"use client"

import { toast } from "sonner"

import { DemoControls as MonarkDemoControls, DemoControlsToggle } from "@/components/ui/demo-controls"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ROLES } from "@/lib/demo/permissions"
import { resetDemo, setSettings, update, useDemo } from "@/lib/demo/store"
import type { Role } from "@/lib/demo/types"

import { useAppCopy } from "./app-provider"

/**
 * The app bar's one demo element: the @monark/ui demo controls (network pill,
 * slow network, forced failure, reset) plus GovChain's live voters and role.
 */
export function DemoControls() {
  const demo = useDemo()
  const { app, seed, locale, terms } = useAppCopy()
  const c = app.controls
  if (!demo) return null
  const me = demo.members.find((m) => m.address === demo.wallet.address)
  const setRole = (role: Role) => {
    update((s) => ({ ...s, members: s.members.map((m) => (m.address === s.wallet.address ? { ...m, role } : m)) }))
  }

  return (
    <MonarkDemoControls
      networkName={app.network}
      slow={demo.settings.slow}
      onSlowChange={(v) => setSettings({ slow: v })}
      failNext={demo.settings.failNext}
      onFailNextChange={(v) => setSettings({ failNext: v })}
      onReset={() => {
        resetDemo(seed, locale)
        toast.success(c.resetDone)
      }}
      title={c.title}
      openLabel={c.open}
      slowLabel={c.slow}
      slowHint={c.slowHint}
      failNextLabel={c.failNext}
      failNextHint={c.failNextHint}
      resetLabel={c.reset}
      resetHint={c.resetHint}
      resetConfirmTitle={c.resetConfirm}
      resetConfirmBody={c.resetConfirmBody}
      resetConfirmLabel={c.resetDo}
      cancelLabel={c.cancel}
      closeLabel={app.close}
    >
      <DemoControlsToggle
        label={c.live}
        hint={c.liveHint}
        checked={demo.settings.liveVoters}
        onCheckedChange={(v) => setSettings({ liveVoters: v })}
      />
      {me ? (
        <div className="p-4">
          <p id="ctl-role" className="text-sm font-bold">
            {c.role}
          </p>
          <p id="ctl-role-hint" className="mt-1 text-xs text-muted-foreground">
            {c.roleHint}
          </p>
          <ToggleGroup
            type="single"
            variant="chip"
            value={me.role}
            onValueChange={(v) => v && setRole(v as Role)}
            aria-labelledby="ctl-role"
            aria-describedby="ctl-role-hint"
            className="mt-3"
          >
            {ROLES.map((role) => (
              <ToggleGroupItem key={role} value={role}>
                {terms.roles[role]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
    </MonarkDemoControls>
  )
}
